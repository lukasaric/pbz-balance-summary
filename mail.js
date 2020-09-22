'use strict';

const { email: config } = require('./config');
const { SMTPClient } = require('emailjs');

const from = `${config.sender.name} <${config.sender.address}>`;
const recipient = '<lsaric@extensionengine.com>';

const client = new SMTPClient({
  user: config.user,
  password: config.password,
  host: config.host,
  ssl: config.ssl,
  tls: config.tls
});

module.exports.forwardReport = accBalance => {
  const text = `Account balance total: ${accBalance}`;
  const message = { from, to: recipient, text, subject: 'Infered PBZ reports' };
  return client.send(message, (err, message) => console.log(err || message));
};
