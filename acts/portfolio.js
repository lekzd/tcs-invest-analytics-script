const chalk = require('chalk');
const { getPortfolio, CURRENCIES } = require('../modules/tinkoffInvest');
const { env } = require('../modules/env');

const toFixed = (num) => {
  const [floor, decimal = ''] = num.toFixed(2).split('.');

  return `${floor}.${decimal.padEnd(2, '0')}`;
}

const displayPrice = (moneyAmount) => {
  const { value, currency } = moneyAmount;
  const { postfix = '' } = CURRENCIES[currency];

  return `${toFixed(Math.abs(value))}${postfix}`;
}

const getPositionIcon = (position) => {
  switch (position.instrumentType) {
    case 'Etf':
      return '★'
  }

  return ' ';
}

const run = () => {
  getPortfolio()
    .then(({total, positions}) => {
      console.log('TOTAL', total.toFixed(2));
      console.log('---------------------');

      positions.forEach(position => {
        const { name, ticker, expectedYield, percent, sortValue } = position;

        const tickerPart = `($${ticker.substr(0, 4).padEnd(4, ' ')})`;
        const benefitsPart = `${displayPrice(expectedYield).padStart(8, ' ')}`;
        const percentPart = `${toFixed(Math.abs(percent)).padStart(6, ' ')}%`;
        const namePart = `${name.padStart(40, '_')}`;

        const result = `${getPositionIcon(position)} ${tickerPart} ${benefitsPart} ${percent < 0 ? '⬇' : '⬆'} ${percentPart} ${namePart}`;

        if (sortValue >= +env.COLOR_BORDER_2) {
          console.log(chalk.greenBright(chalk.bold(result)));
        } else if (sortValue >= +env.COLOR_BORDER_1) {
          console.log(chalk.green(result));
        } else if (sortValue >= 0) {
          console.log(chalk.yellow(result));
        } else if (sortValue >= -env.COLOR_BORDER_1) {
          console.log(chalk.red(result));
        } else {
          console.log(chalk.magenta(result));
        }
  
      })
    })
    .catch(error => {
      console.log(error);
    })
}

module.exports = run;