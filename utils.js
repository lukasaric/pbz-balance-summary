'use strict';

const { format, unformat } = require('currency-formatter');

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });

const formatAmount = amount => `${format(amount, { currency: 'HRK' })} HRK`;

const isBuffer = arg => Buffer.isBuffer(arg);

module.exports = {
  normalizeAmount,
  formatAmount,
  isBuffer
};
