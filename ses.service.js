'use strict';

const { ses: config } = require('./config');
const SES = require('aws-sdk/clients/ses');

class SESService {
  constructor() {
    this.ses = new SES({ region: config.region });
    this.summary = {};
    this.text = '';
    this.subject = '';
  }

  get params() {
    return {
      Destination: {
        ToAddresses: [config.recipientAddress]
      },
      Message: {
        Subject: { Data: this.subject },
        Body: { Text: { Data: this.text.toString() } }
      },
      Source: config.sender.address
    };
  }

  get formattedReport() {
    const { hrkAccBAmount, foreignCurrencyAmount, total } = this.summary;
    return `
      Croatian account balance: ${hrkAccBAmount}
      Foreign currency account balance: ${foreignCurrencyAmount}\n
      Account balance total: ${total}`;
  }

  forwardReport(summary) {
    Object.assign(this, { subject: 'PBZ reports summary', summary });
    this.text = this.formattedReport;
    return this.ses.sendEmail(this.params).promise();
  }

  forwardError(error) {
    Object.assign(this, { subject: 'PBZ reports error', text: error });
    return this.ses.sendEmail(this.params).promise();
  }
}

module.exports = new SESService();
