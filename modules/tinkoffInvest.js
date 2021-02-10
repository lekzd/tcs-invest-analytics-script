const { env } = require('./env');
const OpenAPI = require('@tinkoff/invest-openapi-js-sdk');

const apiURL = 'https://api-invest.tinkoff.ru/openapi';
const socketURL = 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws';
const secretToken = env.TCS_TOKEN;
const api = new OpenAPI({ apiURL, secretToken, socketURL });

/*
  Documentation
  https://github.com/TinkoffCreditSystems/invest-openapi-js-sdk/blob/master/doc/classes/openapi.md
*/

const CURRENCIES = {
  RUB: {
    postfix: '₽',
    multiplier: 1,
  },
  USD: {
    postfix: '$',
    multiplier: 1,
  },
  EUR: {
    postfix: '€',
    multiplier: 1,
  }
}

const getPositionSortValue = (position) => {
  const { multiplier = 1 } = CURRENCIES[position.averagePositionPrice.currency];

  return position.expectedYield.value * multiplier;
}

const getPortfolio = () => {
  return api.portfolio()
    .then(response => {
      response.positions
        .filter(({ instrumentType }) => instrumentType === 'Currency')
        .forEach((position) => {
          CURRENCIES[position.ticker.substr(0, 3)].multiplier = position.averagePositionPrice.value;
        })

      const total = response.positions.reduce((memo, cur) => {
        return memo + getPositionSortValue(cur)
      }, 0);

      response.positions = response.positions
        .filter(({ instrumentType }) => instrumentType !== 'Bond')
        .sort((a, b) => {
          return getPositionSortValue(b) > getPositionSortValue(a)
            ? 1 : -1;
        });

      return {
        total,
        positions: response.positions.map(position => {
          const { balance, averagePositionPrice, expectedYield } = position;
          const percent = (((expectedYield.value / balance) / averagePositionPrice.value) * 100);
          const sortValue = getPositionSortValue(position);
  
          return {
            ...position,
            percent,
            sortValue,
          }
        })
      }
    })
    .catch(error => {
      console.log(error);
    })
}

module.exports = { getPortfolio, CURRENCIES };