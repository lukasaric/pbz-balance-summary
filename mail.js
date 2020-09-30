'use strict';

const { email: config } = require('./config');
const { SMTPClient } = require('emailjs');

const from = `${config.sender.name} <${config.sender.address}>`;
const recipient = `<${config.recipientAddress}>`;

const client = new SMTPClient(config);

const formatReport = ({ hrkAccBAmount, foreignCurrencyAmount, total }) => `
  Croatian account balance: ${hrkAccBAmount},
  Foreign currency account balance: ${foreignCurrencyAmount}
  Account balance total: ${total}
  `;

const forwardReport = resolvedAmounts => {
  const text = formatReport(resolvedAmounts);
  const message = { from, to: recipient, text, subject: 'Infered PBZ reports' };
  return client.send(message);
};

const forwardError = error => {
  const message = { from, to: recipient, text: error, subject: 'PBZ reports error' };
  return client.send(message);
};

module.exports = { forwardReport, forwardError };
