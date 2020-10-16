'use strict';

const { s3: config } = require('./config');
const { count } = require('./utils');
const path = require('path');
const { simpleParser } = require('mailparser');
const { storage } = require('./amazon');

class AttachmentsResolver {
  constructor({ files, incomingKey } = {}) {
    this.files = files;
    this.incomingKey = path.join(config.prefix, incomingKey);
  }

  get hasOneAttachment() {
    const { files, incomingKey } = this;
    return files.find(it => it.key === incomingKey).attachmentsCount === 1;
  }

  async getAttachments() {
    await this.filesAdjustment();
    const { files, incomingKey, hasOneAttachment } = this;
    if (!hasOneAttachment) return storage.removeFile(incomingKey);
    if (files.length < 2) return;
    if (files.length > 2) await this.processSameFormatFiles();
    const attachments = this.files.flatMap(it => it.email.attachments);
    const reports = this.processAttachments(attachments);
    return count(reports) < 2
      ? storage.removeFile(this.getFileByDate(files, 'min').key)
      : reports;
  }

  async filesAdjustment() {
    const emails = await Promise.all(this.files.map(it => simpleParser(it.content)));
    this.files = this.files.map((it, index) => ({
      ...it,
      email: emails[index],
      attachments: this.processAttachments(emails[index].attachments),
      attachmentsCount: emails[index].attachments.length
    }));
  }

  async processSameFormatFiles() {
    const latest = this.getFileByDate(this.files, 'max').attachments;
    const sameFormatItems = this.files.filter(it => it.attachments[Object.keys(latest)[0]]);
    const oldest = this.getFileByDate(sameFormatItems, 'min').key;
    await storage.removeFile(oldest);
    this.files = this.files.filter(it => it.key !== oldest);
  }

  processAttachments(attachments) {
    return attachments.reduce((acc, { content, filename }) => {
      const ext = filename.includes('.xml') ? 'xml' : 'rtf';
      acc[ext] = content;
      return acc;
    }, {});
  }

  getFileByDate(items, action) {
    const date = new Date(Math[action](...items.map(it => new Date(it.date))));
    return items.find(it => it.date.toISOString() === date.toISOString());
  }
}

module.exports = AttachmentsResolver;
