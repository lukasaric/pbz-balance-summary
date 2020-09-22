'use strict';

const AccBalanceResolver = require('./accBalanceResolver');
const { simpleParser } = require('mailparser');

module.exports.resolveAccBalance = async event => {
  const encodedContent = event.Records[0].Sns.Message.content;
  const email = await simpleParser(encodedContent);
  const attachments = adjustAttachments(email);
  const accBalance = await new AccBalanceResolver(attachments).inferBalance();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: accBalance, input: '' }, null, 2)
  };
};

function adjustAttachments({ attachments }) {
  if (!attachments.length) return;
  // TODO: format attachments
  return { rtf: '', xml: '' };
}
