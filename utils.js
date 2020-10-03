'use strict';

const { format, unformat } = require('currency-formatter');
const { ses } = require('./config');

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });

const formatAmount = amount => `${format(amount, { currency: 'HRK' })} HRK`;

const isBuffer = arg => Buffer.isBuffer(arg);

const isAllowedSource = ({ source }) => ses.allowedSources.some(it => it === source);

const isEmpty = arg => !arg || (count(arg) === 0 && arg.constructor === Object);

const count = (obj = {}) => Object.keys(obj).length;

module.exports = {
  count,
  formatAmount,
  isAllowedSource,
  isBuffer,
  isEmpty,
  normalizeAmount
};
