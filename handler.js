'use strict';

const AccBalanceResolver = require('./accBalanceResolver');
const config = require('./config');
const ses = require('./ses.service');
const { simpleParser } = require('mailparser');
const storage = require('./s3.service');

module.exports.resolveAccBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (!config.ses.allowedSources.some(it => it === mail.source)) return;
  const encodedContents = await storage.listFiles();
  if (!encodedContents) return;
  const emails = await Promise.all(encodedContents.map(it => simpleParser(it.Body)));
  const attachments = emails.flatMap(it => it.attachments);
  const reports = adjustAttachments(attachments);
  return new AccBalanceResolver(reports).inferBalance()
    .then(async summary => {
      await ses.forwardReport(summary);
      return storage.keys.map(key => storage.removeFile(key));
    })
    .catch(err => ses.forwardError(err));
};

function adjustAttachments(attachments) {
  if (!attachments.length) return;
  return attachments.reduce((acc, { content, filename }) => {
    const ext = filename.includes('.xml') ? 'xml' : 'rtf';
    acc[ext] = content;
    return acc;
  }, {});
}
