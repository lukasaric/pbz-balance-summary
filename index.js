'use strict';

const { extract, parse, verify } = require('@extensionengine/pbzcomnet-signedfile');
const { format, unformat } = require('currency-formatter');
const BigNumber = require('bignumber.js');
const parseRTF = require('@extensionengine/rtf-parser');
const Promise = require('bluebird');
const { readFileSync } = require('fs');
const request = require('simple-get');

BigNumber.set({ DECIMAL_PLACES: 2 });

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });

const FILE_PATHS = {
  rtf: process.env.RTF_REPORT,
  xml: process.env.XML_REPORT
};

const ATTRS_DICTIONARY = {
  currencyStatement: 'valuta_izvod',
  newAccBalance: 'novo_stanje',
  middleExchange: 'srednji_tecaj'
};

const EXCHANGE_RATE_URL = 'http://api.hnb.hr/tecajn/v2?valuta=EUR&valuta=USD';

class BalanceResolver {
  constructor() {
    this.hrkAccBalance = null;
    this.foreignCurrencyAccBalance = null;
  }

  async inferBalance() {
    const METHODS = ['getHRKAccBalance', 'getForeignCurrencyAccBalance'];
    await Promise.each(METHODS, method => this[method]());
    const { hrkAccBalance, foreignCurrencyAccBalance } = this;
    if (!hrkAccBalance || !foreignCurrencyAccBalance) return;
    const total = BigNumber(hrkAccBalance).plus(foreignCurrencyAccBalance).toNumber();
    return `${format(total, { currency: 'HRK' })} HRK`;
  }

  getExchangeRate() {
    const opts = { url: EXCHANGE_RATE_URL, json: true };
    return new Promise((resolve, reject) => {
      return request.concat(opts, (err, _res, data) => {
        if (err) reject(err);
        const { middleExchange } = ATTRS_DICTIONARY;
        const exchangeRate = data.find(it => it.valuta === 'USD')[middleExchange];
        resolve(normalizeAmount(exchangeRate));
      });
    });
  }

  async getForeignCurrencyAccBalance() {
    const xmlDoc = this.sgnFileResolver('xml');
    if (!xmlDoc) return;
    const { currencyStatement, newAccBalance } = ATTRS_DICTIONARY;
    const buffer = await extract(xmlDoc);
    const innerXmlDoc = parse(buffer.toString());
    const arr = innerXmlDoc.findall('*/').find(it => it.tag === currencyStatement);
    const balance = arr.findall('*/').find(it => it.tag === newAccBalance).text;
    const exchangeRate = await this.getExchangeRate();
    this.foreignCurrencyAccBalance =
      BigNumber(normalizeAmount(balance)).times(exchangeRate).toNumber();
  }

  async getHRKAccBalance() {
    const xmlDoc = this.sgnFileResolver('rtf');
    if (!xmlDoc) return;
    const buffer = await extract(xmlDoc);
    const rtfDoc = await parseRTF(buffer);
    this.hrkAccBalance = this.getLatestHrkBalance(rtfDoc);
  }

  sgnFileResolver(format) {
    const xml = readFileSync(FILE_PATHS[format], 'utf-8');
    const xmlDoc = parse(xml);
    return verify(xmlDoc) ? xmlDoc : null;
  }

  getLatestHrkBalance(rtfDoc) {
    const rftObj = rtfDoc.content.find(paragraph => {
      return paragraph.content.find(span => span.value.includes('Novo stanje:'));
    });
    const span = rftObj.content[0].value;
    return normalizeAmount(span.split(':').pop());
  }
}

new BalanceResolver().inferBalance().then(amount => console.log(amount));

module.exports = new BalanceResolver().inferBalance();
