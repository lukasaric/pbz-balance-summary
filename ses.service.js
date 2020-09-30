'use strict';

const config = require('./config');
const SES = require('aws-sdk/clients/ses');

const ses = new SES({ region: config.amazonStorage.region });

const setParams = ({ subject, text }) => ({
  Destination: {
    ToAddresses: [config.email.recipientAddress]
  },
  Message: {
    Subject: { Data: subject },
    Body: { Text: { Data: text.toString() } }
  },
  Source: config.email.sender.address
});

const formatReport = ({ hrkAccBAmount, foreignCurrencyAmount, total }) => `
  Croatian account balance: ${hrkAccBAmount},
  Foreign currency account balance: ${foreignCurrencyAmount}
  Account balance total: ${total}
  `;

const forwardReport = resolvedAmounts => {
  const text = formatReport(resolvedAmounts);
  const params = setParams({ subject: 'Infered PBZ reports', text });
  return ses.sendEmail(params).promise();
};

const forwardError = error => {
  const params = setParams({ subject: 'PBZ reports error', text: error });
  return ses.sendEmail(params).promise();
};

module.exports = {
  forwardReport,
  forwardError
};
