'use strict';

const { format, unformat } = require('currency-formatter');
const { ses } = require('./config');

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });

const formatAmount = amount => `${format(amount, { currency: 'HRK' })} HRK`;

const isBuffer = arg => Buffer.isBuffer(arg);

const isAllowedSource = ({ source }) => ses.allowedSources.some(it => it === source);

const isEmpty = arg => !arg || (Object.keys(arg).length === 0 && arg.constructor === Object);

module.exports = {
  formatAmount,
  isAllowedSource,
  isBuffer,
  isEmpty,
  normalizeAmount
};
