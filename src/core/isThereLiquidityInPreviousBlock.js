const ethers = require('ethers');
const uniswapFactoryAbi = require('../../abi/uniswapV2Factory.json');
const uniswapPairAbi = require('../../abi/uniswapV2Pair.json');
const sendTelegramNotification = require('../utils/sendTelegramNotification');
const logger = require('../utils/logger');

const FACTORY_CONTRACT_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

const VALUABLE_TOKENS = [
  WETH_ADDRESS,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
];

function getExtraPairsToCheck(tokenAAddress, tokenBAddress) {
  if (tokenAAddress === WETH_ADDRESS || tokenBAddress === WETH_ADDRESS) {
    return [];
  }

  const extraPairs = [];

  for (const token of [tokenAAddress, tokenBAddress]) {
    if (!VALUABLE_TOKENS.includes(token)) {
      for (const valuableToken of VALUABLE_TOKENS) {
        extraPairs.push([token, valuableToken]);
      }
    }
  }

  return extraPairs;
}

async function checkPairExists(provider, factoryContract, tokenA, tokenB, blockNumber) {
  try {
    const pairAddress = await factoryContract.getPair(tokenA, tokenB, { blockTag: blockNumber });

    if (pairAddress === ethers.constants.AddressZero) {
      logger.fetch(
        `Doesn't exist pairAddress ${pairAddress.slice(0, 8)} == 0x000000 in previous block`
      );
      return false;
    }

    if (tokenA === WETH_ADDRESS || tokenB === WETH_ADDRESS) {
      const pairContract = new ethers.Contract(pairAddress, uniswapPairAbi, provider);
      const reserves = await pairContract.getReserves({ blockTag: blockNumber });
      const reserveA = reserves._reserve0;
      const reserveB = reserves._reserve1;

      if (reserveA.gt(0) || reserveB.gt(0)) {
        logger.fetch(
          `Pair with WETH exists in previous block pairAddress ${pairAddress}`
        );
        return true;
      }

      logger.fetch(
        `Doesn't exist pair with WETH in previous block, reserves == 0 pairAddress ${pairAddress}`
      );
      return false;
    }

    logger.fetch(`Pair exists in previous block pairAddress ${pairAddress}`);
    return true;
  } catch (error) {
    logger.error(`Error in checkPairExists: ${error.message}`);
    sendTelegramNotification(`Error in checkPairExists: ${error.message}`);
    return true;
  }
}

async function isThereLiquidityInPreviousBlock(provider, tokenAAddress, tokenBAddress, currentBlockNumber) {
  try {
    const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, uniswapFactoryAbi, provider);
    const previousBlockNumber = currentBlockNumber - 1;
    const pairsToCheck = [
      [tokenAAddress, tokenBAddress],
      ...getExtraPairsToCheck(tokenAAddress, tokenBAddress),
    ];

    logger.fetch(`Checking pairs exist in previous block ${JSON.stringify(pairsToCheck)}`);
    for (const [tokenA, tokenB] of pairsToCheck) {
      const poolExists = await checkPairExists(provider, factoryContract, tokenA, tokenB, previousBlockNumber);

      if (poolExists) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error(`Error in isThereLiquidityInPreviousBlock: ${error.message}`);
    sendTelegramNotification(`Error in isThereLiquidityInPreviousBlock: ${error.message}`);
    return true;
  }
}

module.exports = isThereLiquidityInPreviousBlock;