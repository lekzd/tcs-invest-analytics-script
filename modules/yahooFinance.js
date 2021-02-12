const axios = require("axios");

const host = 'https://query1.finance.yahoo.com';

const searchForPositionByTicker = (ticker) => {
  const url = `${host}/v1/finance/search?q=${ticker}&quotesCount=10&newsCount=0`;

  return axios(url)
    .then(response => {
      const { data: {quotes}} = response;

      return quotes.find(({ symbol }) => symbol === ticker);
    });
}

const searchForPosition = (isinOrTicker) => {
  const url = `${host}/v1/finance/search?q=${isinOrTicker}&quotesCount=1&newsCount=0`;

  return axios(url)
    .then(response => {
      const { data: {quotes: [result]}} = response;

      return result;
    });
}

const getQuoteModules = (ticker, modules = []) => {
  const url = `${host}/v10/finance/quoteSummary/${ticker}?modules=${modules.join('%2C')}`;
  
  return axios(url)
    .then(response => {
      const { data: {quoteSummary: {result}}} = response;

      if (result === null) {
        return null;
      }

      return result[0];
    })
    .catch(() => {
      const result = {};

      modules.forEach(key => {
        result[key] = {};
      })

      return result;
    })
}

module.exports = { getQuoteModules, searchForPosition, searchForPositionByTicker };