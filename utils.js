'use strict';

const { format, unformat } = require('currency-formatter');
const { ses } = require('./config');

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });

const formatAmount = amount => `${format(amount, { currency: 'HRK' })} HRK`;

const isBuffer = arg => Buffer.isBuffer(arg);

const isAllowedSource = ({ source }) => ses.allowedSources.some(it => it === source);

function adjustAttachments(attachments) {
  if (!attachments.length) return;
  return attachments.reduce((acc, { content, filename }) => {
    const ext = filename.includes('.xml') ? 'xml' : 'rtf';
    acc[ext] = content;
    return acc;
  }, {});
}

module.exports = {
  normalizeAmount,
  formatAmount,
  isBuffer,
  isAllowedSource,
  adjustAttachments
};
