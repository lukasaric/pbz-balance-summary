'use strict';

const { s3: config } = require('./config');
const { count } = require('./utils');
const { simpleParser } = require('mailparser');
const { storage } = require('./amazon');

class AttachmentsResolver {
  constructor({ files, incomingKey } = {}) {
    this.files = files;
    this.incomingKey = `${config.prefix}${incomingKey}`;
  }

  async getAttachments() {
    await this.adjustFiles();
    const { files, incomingKey } = this;
    if (this.attachmentsCheck()) return storage.removeFile(incomingKey);
    if (files.length < 2) return;
    if (files.length > 2) await this.processSameFormatFiles();
    const attachments = this.files.flatMap(it => it.email.attachments);
    const reports = this.processAttachments(attachments);
    return count(reports) < 2
      ? storage.removeFile(this.getObjectByDate(files, 'min').key)
      : reports;
  }

  async adjustFiles() {
    const emails = await Promise.all(this.files.map(it => simpleParser(it.content)));
    this.files = this.files.map((it, index) => ({
      ...it,
      email: emails[index],
      attachments: this.processAttachments(emails[index].attachments)
    }));
  }

  attachmentsCheck() {
    const { files, incomingKey } = this;
    const latest = files.find(it => it.key === incomingKey);
    return !count(latest.attachments) || count(latest.attachments) > 1;
  }

  async processSameFormatFiles() {
    const latest = this.getObjectByDate(this.files, 'max').attachments;
    const sameFormatItems = this.files.filter(it => it.attachments[Object.keys(latest)[0]]);
    const oldest = this.getObjectByDate(sameFormatItems, 'min').key;
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

  getObjectByDate(items, action) {
    const date = new Date(Math[action](...items.map(it => new Date(it.date))));
    return items.find(it => it.date.toISOString() === date.toISOString());
  }
}

module.exports = AttachmentsResolver;
