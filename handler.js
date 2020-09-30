'use strict';

const { forwardError, forwardReport } = require('./mail');
const AccBalanceResolver = require('./accBalanceResolver');
const config = require('./config');
const { simpleParser } = require('mailparser');
const storage = require('./storage');

module.exports.resolveAccBalance = async event => {
  const mail = event.Records[0].ses.mail;
  if (mail.source !== config.email.recipientAddress) return;
  const { Body: encodedContent } = await storage.getFile(mail);
  const email = await simpleParser(encodedContent);
  const reports = adjustAttachments(email);
  return new AccBalanceResolver(reports).inferBalance()
    .then(forwardReport)
    .catch(forwardError);
};

function adjustAttachments({ attachments }) {
  if (!attachments.length) return;
  return attachments.reduce((acc, { content, filename }) => {
    const ext = filename.includes('.xml') ? 'xml' : 'rtf';
    acc[ext] = content;
    return acc;
  }, {});
}
