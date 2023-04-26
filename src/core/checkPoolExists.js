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

// Check is it the first liquidity addition through checking any pool existing
async function checkPoolExists(provider, tokenAAddress, tokenBAddress, currentBlockNumber) {
  const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, uniswapFactoryAbi, provider);

  try {
    const previousBlockNumber = currentBlockNumber - 1;
    const pairsToCheck = [
      [tokenAAddress, tokenBAddress],
      ...getExtraPairsToCheck(tokenAAddress, tokenBAddress),
    ];

    const shortZeroAddress = '0x000000';
    const jsonPairsToCheck = JSON.stringify(pairsToCheck);
    logger.checkingTx(`Checking pairs ${jsonPairsToCheck}`);

    // Iterate through each pair to check if a liquidity pool exists
    for (const [tokenA, tokenB] of pairsToCheck) {
      const pairAddress = await factoryContract.getPair(tokenA, tokenB, { blockTag: previousBlockNumber });
    
      // If one of the tokens is WETH_ADDRESS, check the reserves of this pair in previous block
      // because pair with WETH often creted when deploy a contract
      if (tokenA === WETH_ADDRESS || tokenB === WETH_ADDRESS) {

        // If pairAddress received 0x0000 from getPair then pool doesn't exit and if there is only one pool
        if (pairAddress === ethers.constants.AddressZero &&
          pairsToCheck.length === 1) {
          logger.checkingTx(
            `Pool doesn't exist in previous block ${previousBlockNumber} due to pairAddress with ` +
            `WETH ${pairAddress.slice(0, 8)} == ${shortZeroAddress} ` +
            `and there is only one pair in pairsToCheck ${jsonPairsToCheck}`
          );

          return false; // Pool doesn't exit
        }

        const pairContract = new ethers.Contract(pairAddress, uniswapPairAbi, provider);
        const reserves = await pairContract.getReserves({ blockTag: previousBlockNumber });
        const reserveA = reserves._reserve0;
        const reserveB = reserves._reserve1;
    
        // If the reserves are not 0, interrupt the for loop
        if (reserveA.gt(0) || reserveB.gt(0)) {
          logger.checkingTx(
            `Pool exists, because ` +
            `WETH pair had reserves in previous block ${previousBlockNumber} ` +
            `reserveA ${ethers.utils.formatUnits(reserveA, 18)} reserveB ${ethers.utils.formatUnits(reserveB, 18)}`
          );

          return true; // Pool exists
        }

        // If there is only one pair in pairsToCheck, and in the previous step
        // it has been checked pool doesn't exist then pool in general doesn't exit
        if (pairsToCheck.length === 1) {
          logger.checkingTx(
            `Pool doesn't exist, WETH pair didn't have reserves in previous block ` +
            `${previousBlockNumber}, and it is a single pair in pairsToCheck ${jsonPairsToCheck} ` +
            `reserveA ${ethers.utils.formatUnits(reserveA, 18)} reserveB ${ethers.utils.formatUnits(reserveB, 18)}`
          );

          return false; // Pool doesn't exit
        }
      }
      
      // If pairAddress received 0x0000 from getPair then pool doesn't exit
      if (pairAddress === ethers.constants.AddressZero) {
        logger.checkingTx(
          `Pool doesn't exist in previous block ${previousBlockNumber} ` +
          `pairsToCheck ${jsonPairsToCheck} ` +
          `pairAddress ${pairAddress.slice(0, 8)} == ${shortZeroAddress}`
        );

        return false; // Pool doesn't exit
      }
    }

    logger.checkingTx(
      `Pool exists in previous block ${previousBlockNumber}, ` +
      `because all pairs aren't equal ${shortZeroAddress} ` +
      `pairs were checked ${jsonPairsToCheck}`
    );

    return true; // Pool exists
  } catch (error) {
    logger.error(`Error while checking pool existence: ${error.message}`);
    sendTelegramNotification(`Error while checking pool existence: ${error.message}`);
  }
}

module.exports = checkPoolExists;