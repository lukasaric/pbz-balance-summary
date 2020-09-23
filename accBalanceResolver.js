'use strict';

const { extract, parse, verify } = require('@extensionengine/pbzcomnet-signedfile');
const { format, unformat } = require('currency-formatter');
const BigNumber = require('bignumber.js');
const parseRTF = require('@extensionengine/rtf-parser');
const { readFileSync } = require('fs');
const request = require('simple-get');

BigNumber.set({ DECIMAL_PLACES: 2 });

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });

const isBuffer = arg => Buffer.isBuffer(arg);

const REPORTS = {
  rtf: process.env.RTF_REPORT,
  xml: process.env.XML_REPORT
};

const LOCALIZED_ATTRS = {
  currencyStatement: 'valuta_izvod',
  newAccBalance: 'novo_stanje',
  middleExchange: 'srednji_tecaj',
  currency: 'valuta'
};

const EXCHANGE_RATE_URL = 'http://api.hnb.hr/tecajn/v2?valuta=EUR&valuta=USD';

class AccBalanceResolver {
  constructor(reports = null) {
    this.reports = reports || REPORTS;
    this.hrkAccBalance = null;
    this.foreignCurrencyAccBalance = null;
  }

  async inferBalance() {
    await this.getHrkAccBalance();
    await this.getForeignCurrencyAccBalance();
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
        const { currency, middleExchange } = LOCALIZED_ATTRS;
        resolve(data.find(it => it[currency] === 'USD')[middleExchange]);
      });
    });
  }

  async getForeignCurrencyAccBalance() {
    const xmlDoc = this.sgnFileResolver('xml');
    if (!xmlDoc) return;
    const buffer = await extract(xmlDoc);
    const innerXmlDoc = parse(buffer.toString());
    const balance = this.getLatestForeignBalance(innerXmlDoc);
    const exchangeRate = normalizeAmount(await this.getExchangeRate());
    this.foreignCurrencyAccBalance = BigNumber(balance).times(exchangeRate).toNumber();
  }

  async getHrkAccBalance() {
    const xmlDoc = this.sgnFileResolver('rtf');
    if (!xmlDoc) return;
    const buffer = await extract(xmlDoc);
    const rtfDoc = await parseRTF(buffer);
    this.hrkAccBalance = this.getLatestHrkBalance(rtfDoc);
  }

  sgnFileResolver(format) {
    const report = this.reports[format];
    const xml = isBuffer(report) ? report.toString() : readFileSync(report, 'utf-8');
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

  getLatestForeignBalance(innerXmlDoc) {
    const { currencyStatement, newAccBalance } = LOCALIZED_ATTRS;
    const el = innerXmlDoc.findall('*/').find(it => it.tag === currencyStatement);
    const balance = el.findall('*/').find(it => it.tag === newAccBalance).text;
    return normalizeAmount(balance);
  }
}

module.exports = AccBalanceResolver;
