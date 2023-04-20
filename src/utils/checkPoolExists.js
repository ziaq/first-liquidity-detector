const ethers = require('ethers');
const uniswapFactoryAbi = require('../../abi/uniswapV2Factory.json');
const uniswapPairAbi = require('../../abi/uniswapV2Pair.json');
const sendTelegramNotification = require('../services/sendTelegramNotification');
const logger = require('./logger');

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

// Check is it the first liquidity addition through checking any pool existing
async function checkPoolExists(provider, tokenAAddress, tokenBAddress, currentBlockNumber) {
  const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, uniswapFactoryAbi, provider);

  try {
    const previousBlockNumber = currentBlockNumber - 1;
    const pairsToCheck = [
      [tokenAAddress, tokenBAddress],
      ...getExtraPairsToCheck(tokenAAddress, tokenBAddress),
    ];

    logger.info(`Checking pairs: ${JSON.stringify(pairsToCheck)}`);

    // Iterate through each pair to check if a liquidity pool exists
    for (const [tokenA, tokenB] of pairsToCheck) {
      const pairAddress = await factoryContract.getPair(tokenA, tokenB, { blockTag: previousBlockNumber });
      if (pairAddress !== ethers.constants.AddressZero) {
        return true; // Pool exists
      }
    }

    return false; // Pool does not exist
  } catch (error) {
    logger.error(`Error while checking pool existence: ${error.message}`);
    sendTelegramNotification(`Error while checking pool existence: ${error.message}`);
    return false; // Pool does not exist
  }
}

module.exports = checkPoolExists;