'use strict';

const AccBalanceResolver = require('./accBalanceResolver');
const { forwardReport } = require('./mail');
const { simpleParser } = require('mailparser');

module.exports.resolveAccBalance = async event => {
  const encodedContent = event.Records[0].Sns.Message.content;
  const email = await simpleParser(encodedContent);
  const reports = adjustAttachments(email);
  const accBalance = await new AccBalanceResolver(reports).inferBalance();
  forwardReport(accBalance);
  return { statusCode: 200 };
};

function adjustAttachments({ attachments }) {
  if (!attachments.length) return;
  // TODO: format attachments
  return { rtf: '', xml: '' };
}
