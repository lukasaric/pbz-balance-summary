'use strict';

const { forwardError, forwardReport } = require('./mail');
const AccBalanceResolver = require('./accBalanceResolver');
const { simpleParser } = require('mailparser');

module.exports.resolveAccBalance = async event => {
  const encodedContent = event.Records[0].Sns.Message.content;
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
