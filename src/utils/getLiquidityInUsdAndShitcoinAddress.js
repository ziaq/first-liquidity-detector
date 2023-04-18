const { wethPriceInUsd } = require('../../config/config');

function getLiquidityValueInUSD(tokenA, amountA, tokenB, amountB) {
  const VALUABLE_TOKENS = {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  };

  let liquidityValueInUsd = 0;
  let nonValuableToken = null;

  if (tokenA === VALUABLE_TOKENS.WETH || tokenB === VALUABLE_TOKENS.WETH) {
    const wethAmount = tokenA === VALUABLE_TOKENS.WETH ? amountA : amountB;
    liquidityValueInUsd = wethAmount * wethPriceInUsd;
    nonValuableToken = tokenA === VALUABLE_TOKENS.WETH ? tokenB : tokenA;
  } else if (tokenA === VALUABLE_TOKENS.USDT || tokenA === VALUABLE_TOKENS.USDC) {
    liquidityValueInUsd = amountA;
    nonValuableToken = tokenB;
  } else if (tokenB === VALUABLE_TOKENS.USDT || tokenB === VALUABLE_TOKENS.USDC) {
    liquidityValueInUsd = amountB;
    nonValuableToken = tokenA;
  }

  return {
    valueInUsd: liquidityValueInUsd,
    nonValuableToken: nonValuableToken,
  };
}

module.exports = getLiquidityValueInUSD;