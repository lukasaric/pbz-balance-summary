'use strict';

const { simpleParser } = require('mailparser');
const { storage } = require('./amazon');

class AttachmentsResolver {
  constructor(files) {
    this.files = files;
  }

  async getAttachments() {
    await this.adjustFiles();
    if (this.files.length < 2) return;
    if (this.files.length > 2) await this.processSameFormatFiles();
    const attachments = this.files.flatMap(it => it.email.attachments);
    const reports = this.processAttachments(attachments);
    if (Object.keys(reports).length < 2) {
      return storage.removeFile(this.getObjectByDate(this.files, 'min').key);
    }
    return reports;
  }

  async adjustFiles() {
    const emails = await Promise.all(this.files.map(it => simpleParser(it.content)));
    this.files = this.files.map((it, i) => ({ ...it, email: emails[i] }));
  }

  async processSameFormatFiles() {
    const adjustedFiles = this.files.map(it => ({
      ...it, attachments: this.processAttachments(it.email.attachments)
    }));
    const latest = this.getObjectByDate(adjustedFiles, 'max').attachments;
    const sameFormatItems = adjustedFiles.filter(it => it.attachments[Object.keys(latest)[0]]);
    const oldest = this.getObjectByDate(sameFormatItems, 'min').key;
    await storage.removeFile(oldest);
    this.files = adjustedFiles.filter(it => it.key !== oldest);
  }

  processAttachments(attachments) {
    return attachments.reduce((acc, { content, filename }) => {
      const ext = filename.includes('.xml') ? 'xml' : 'rtf';
      acc[ext] = content;
      return acc;
    }, {});
  }

  getObjectByDate(items, action) {
    const date = new Date(Math[action](...items.map(it => new Date(it.date))));
    return items.find(it => it.date.toISOString() === date.toISOString());
  }
}

module.exports = AttachmentsResolver;
