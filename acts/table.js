const chalk = require('chalk');
const { db } = require('../modules/db');
const { Position } = require('../models/Position');
const { env } = require('../modules/env');

const { getPortfolio } = require('../modules/tinkoffInvest');
const { getQuoteModules, searchForPosition } = require('../modules/yahooFinance');

const getPositionModel = async (ticker, isin) => {
  let position = await Position.getByTicker(ticker);

  if (!position) {
    const positionInfo = (await searchForPosition(isin)) || (await searchForPosition(ticker));
    const { assetProfile } = await getQuoteModules(positionInfo?.symbol ?? ticker, ['assetProfile']);

    position = await Position.create(ticker, isin, positionInfo, assetProfile);
  }

  return position;
}

module.exports = async (args) => {
  const pairs = args.slice(1);
  const argsParsed = {};
  
  pairs.forEach(pair => {
    const [attr, value] = pair.split('=');

    argsParsed[attr] = value;
  });

  const {groupBy = 'sector'} = argsParsed;

  db.serialize(async function () {
    const { positions } = await getPortfolio();
    const table = {};

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const positionModel = await getPositionModel(position.ticker, position.isin);

      table[positionModel[groupBy]] = table[positionModel[groupBy]] || [];

      table[positionModel[groupBy]].push({ ...positionModel, ...position });
    }

    Object.keys(table).forEach(key => {
      const positions = table[key];

      console.log(`[${key.padEnd(30, ' ')}]: ${positions.map(v => {
        const { sortValue, ticker } = v;

        if (sortValue >= +env.COLOR_BORDER_2) {
          return chalk.greenBright(chalk.bold(ticker));
        } else if (sortValue >= +env.COLOR_BORDER_1) {
          return chalk.green(ticker);
        } else if (sortValue >= 0) {
          return chalk.yellow(ticker);
        } else if (sortValue >= -env.COLOR_BORDER_1) {
          return chalk.red(ticker);
        } else {
          return chalk.magenta(ticker);
        }
      }).join(', ')}`);
    })

    db.close();
  });

}