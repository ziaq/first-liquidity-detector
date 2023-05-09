const logger = require('./logger');

function identifyShitcoinAddress(tokenA, tokenB) {
  const VALUABLE_TOKENS = {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
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
      logger.details(
        `Tokens both are not valuable, tokenA ${tokenA} tokenB ${tokenB}`
      );
      return null;
  }

  return nonValuableToken;
}

module.exports = identifyShitcoinAddress;