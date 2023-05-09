const ethers = require('ethers');

const uniswapFactoryAbi = require('../../abi/uniswapV2Factory.json');
const uniswapPairAbi = require('../../abi/uniswapV2Pair.json');
const sendTelegramNotification = require('../utils/sendTelegramNotification');
const logger = require('../utils/logger');
const provider = require('../connections/ethersProviderInstance');

const FACTORY_CONTRACT_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

const VALUABLE_TOKENS = [
  WETH_ADDRESS,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
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

async function checkPairExists(tokenA, tokenB, previousBlockNumber, retries = 1) {
  try {
    const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, uniswapFactoryAbi, provider);
    const pairAddress = await factoryContract.getPair(tokenA, tokenB, { blockTag: previousBlockNumber });

    if (pairAddress === ethers.constants.AddressZero) {
      logger.details(
        `Doesn't exist pairAddress ${pairAddress.slice(0, 8)} == 0x000000 in previous block ` +
        `tokenA ${tokenA} tokenB ${tokenB}`
      );
      return false;
    }

    if (tokenA === WETH_ADDRESS || tokenB === WETH_ADDRESS) {
      const pairContract = new ethers.Contract(pairAddress, uniswapPairAbi, provider);
      const reserves = await pairContract.getReserves({ blockTag: previousBlockNumber });
      const reserveA = reserves._reserve0;
      const reserveB = reserves._reserve1;

      if (reserveA.gt(0) || reserveB.gt(0)) {
        logger.details(
          `Pair with WETH exists in previous block pairAddress ${pairAddress} ` +
          `tokenA ${tokenA} tokenB ${tokenB}`
        );
        return true;
      } else {
        logger.details(
          `Pair with WETH does not exists in previous block pairAddress ${pairAddress} ` +
          `tokenA ${tokenA} tokenB ${tokenB}`
        );
        return false;
      }
    }

    logger.details(
      `Pair exists in previous block pairAddress ${pairAddress} tokenA ${tokenA} tokenB ${tokenB}`
      );
    return true;
    
  } catch (error) {
    if (retries > 0) {
      logger.error(`Error in checkPairExists: ${error.message}. Retrying in 10 seconds`);
      await new Promise(resolve => setTimeout(resolve, 10000))
      return await checkPairExists(tokenA, tokenB, previousBlockNumber, retries - 1);

    } else {
      const message = 
      `Error cheking pair exists in checkPairExists (module 1). pair ${pairAddress} ` +
      `tokenA ${tokenA} tokenB ${tokenB} Error message: ${error.message}`
      logger.error(message);
      sendTelegramNotification(message);

      return false;
    }
  }
}

async function checkIsItFirstAddLiquidity(tokenAAddress, tokenBAddress, currentBlockNumber) {
  const previousBlockNumber = currentBlockNumber - 1;
  const pairsToCheck = [
    [tokenAAddress, tokenBAddress],
    ...getExtraPairsToCheck(tokenAAddress, tokenBAddress),
  ];

  logger.details(`Checking pairs exist in previous block ${JSON.stringify(pairsToCheck)}`);
  for (const [tokenA, tokenB] of pairsToCheck) {
    const poolExists = await checkPairExists(tokenA, tokenB, previousBlockNumber);

    if (poolExists) {
      return false;
    }
  }

  return true;
}

module.exports = checkIsItFirstAddLiquidity;