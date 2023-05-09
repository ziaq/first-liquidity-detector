const sendTelegramNotification = require('./sendTelegramNotification');
const logger = require('./logger');

function identifyShitcoinAddress(tokenA, tokenB) {
  const VALUABLE_TOKENS = {
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  };

  let nonValuableToken;

  switch (true) {
    case tokenA === VALUABLE_TOKENS.WETH:
      nonValuableToken = tokenB;
      break;
    case tokenB === VALUABLE_TOKENS.WETH:
      nonValuableToken = tokenA;
      break;
    case tokenA === VALUABLE_TOKENS.USDT:
      nonValuableToken = tokenB;
      break;
    case tokenB === VALUABLE_TOKENS.USDT:
      nonValuableToken = tokenA;
      break;
    case tokenA === VALUABLE_TOKENS.USDC:
      nonValuableToken = tokenB;
      break;
    case tokenB === VALUABLE_TOKENS.USDC:
      nonValuableToken = tokenA;
      break;
    case tokenA === VALUABLE_TOKENS.DAI:
      nonValuableToken = tokenB;
      break;
    case tokenB === VALUABLE_TOKENS.DAI:
      nonValuableToken = tokenA;
      break;
    default:
      const message = 
        `Error VALUABLE_TOKENS does not have necessary valuable ` +
        `token in identifyShitcoinAddress (module 1)`
      logger.error(message);
      sendTelegramNotification(message);
      return null;
  }

  return nonValuableToken.toLowerCase();
}

module.exports = identifyShitcoinAddress;