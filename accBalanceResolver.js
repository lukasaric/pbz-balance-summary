'use strict';

const { extract, parse, verify } = require('@extensionengine/pbzcomnet-signedfile');
const { format, unformat } = require('currency-formatter');
const BigNumber = require('bignumber.js');
const parseRTF = require('@extensionengine/rtf-parser');
const { readFileSync } = require('fs');
const request = require('simple-get');

BigNumber.set({ DECIMAL_PLACES: 2 });

const normalizeAmount = amount => unformat(amount, { locale: 'hr_HR' });
const formatAmount = amount => `${format(amount, { currency: 'HRK' })} HRK`;
const isBuffer = arg => Buffer.isBuffer(arg);

const EXCHANGE_RATE_URL = 'http://api.hnb.hr/tecajn/v2?valuta=EUR&valuta=USD';

const ERRORS = {
  noContent: 'The email does not contain any attached files/reports.',
  verification: 'File did not pass the signature verification.'
};

const LOCALIZED_ATTRS = {
  currencyStatement: 'valuta_izvod',
  newAccBalance: 'novo_stanje',
  middleExchange: 'srednji_tecaj',
  currency: 'valuta'
};

class AccBalanceResolver {
  constructor(reports = null) {
    this.reports = reports;
    this.hrkAccBalance = 0;
    this.foreignCurrencyAccBalance = 0;
  }

  async inferBalance() {
    if (!this.reports) throw new Error(ERRORS.noContent);
    await this.getHrkAccBalance();
    await this.getForeignCurrencyAccBalance();
    const { hrkAccBalance, foreignCurrencyAccBalance } = this;
    console.log(hrkAccBalance, foreignCurrencyAccBalance);
    const total = BigNumber(hrkAccBalance).plus(foreignCurrencyAccBalance).toNumber();
    return {
      hrkAccBAmount: formatAmount(hrkAccBalance),
      foreignCurrencyAmount: formatAmount(foreignCurrencyAccBalance),
      total: formatAmount(total)
    };
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
    if (!report) return;
    const xml = isBuffer(report) ? report.toString() : readFileSync(report, 'utf-8');
    const xmlDoc = parse(xml);
    if (!verify(xmlDoc)) throw new Error(ERRORS.verification);
    return xmlDoc;
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
