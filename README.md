# Tinkoff Investments analytics script

Simple analytics node.js script based on Yahoo Finance API

## Usage

### `node index.js portfolio`

![Portfolio](/images/portfolio.png)

Your portfolio list sorted by overall profit

### `node index.js table groupBy=sector`

![Table](/images/table.png)

Your portfolio table grouped by asset param from Yahoo Finance API

### `node index.js asset query=AAPL`

![Asset](/images/asset.png)

Best search result based on Yahoo Finance API

### `node index.js compare tickers=NOC,PFE,REGN,VRTX,ZGNX`

![Asset](/images/compare.png)

Compare stocks using tickers (Yahoo finance tickers) 

## Installation

`yarn && touch .env`

### .env file variables
**TCS_TOKEN**: get token [here](https://tinkoffcreditsystems.github.io/invest-openapi/auth/)

**COLOR_BORDER_1**: border value between yellow and green colors in RUB

**COLOR_BORDER_2**: border value between green and bright green colors in RUB
