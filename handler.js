'use strict';

const AccBalanceResolver = require('./accBalanceResolver');
const config = require('./config');
const ses = require('./ses.service');
const { simpleParser } = require('mailparser');
const storage = require('./s3.service');

module.exports.resolveAccBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (!config.ses.allowedSources.some(it => it === mail.source)) return;
  const { Body: encodedContent } = await storage.getFile(mail);
  const email = await simpleParser(encodedContent);
  const reports = adjustAttachments(email);
  return new AccBalanceResolver(reports).inferBalance()
    .then(summary => ses.forwardReport(summary))
    .catch(err => ses.forwardError(err));
};

function adjustAttachments({ attachments }) {
  if (!attachments.length) return;
  return attachments.reduce((acc, { content, filename }) => {
    const ext = filename.includes('.xml') ? 'xml' : 'rtf';
    acc[ext] = content;
    return acc;
  }, {});
}
