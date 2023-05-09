const logger = require('../utils/logger');
const ignoreList = require('../../config/ignoreList.json');
const addingLiquiditySignatureList = require('../../config/addingLiquiditySignatureList');
const getTokensFromTransaction = require('../utils/getTokensFromTransaction');
const sendTelegramNotification = require('../utils/sendTelegramNotification');
const checkIsItFirstAddLiquidity = require('./checkIsItFirstAddLiquidity');
const identifyShitcoinAddress = require('../utils/identifyShitcoinAddress');
const redisClientDb0 = require('../connections/redisInstance');
const provider = require('../connections/ethersProviderInstance');
const wait = require('../utils/wait');

async function processBlocksRecursively(currentBlockNumber) {
  let block;

  try {
    block = await provider.getBlockWithTransactions(currentBlockNumber);

  } catch (error) {
    const message = 
      `Error getting block in processBlocksRecursively ${currentBlockNumber} ` +
      `retry in 3 seconds. Error message: ${error.message}`;
    logger.error(message);
    sendTelegramNotification(message);

    await wait(3000);
    processBlocksRecursively(currentBlockNumber)
    return;
  }

  if (!block) {
    await wait(3000);
    processBlocksRecursively(currentBlockNumber)
    return;
  }
  logger.info(`Checking block ${currentBlockNumber}`);

  for (const transaction of block.transactions) {
    const getAddLiquiditySignature = (transaction) => {
      return addingLiquiditySignatureList.find(signature => signature === transaction.data.slice(0, 10));
    };
    
    const addLiquiditySignature = getAddLiquiditySignature(transaction);
    if (!addLiquiditySignature) continue;

    const { tokenA, tokenB } = getTokensFromTransaction(transaction, addLiquiditySignature);
    if (!tokenA || !tokenB) continue;

    // Condition for ignoring some tokens that have unusual pools and give weird result
    if (ignoreList.tokens.includes(tokenA) || ignoreList.tokens.includes(tokenB)) {
      continue;
    }

    logger.details(`Сaught liquidity addition tx tokenA ${tokenA} tokenB ${tokenB}`)

    const isItFirstAddLiquidity = await checkIsItFirstAddLiquidity(
      tokenA, tokenB, currentBlockNumber);

    let nonValuableToken = identifyShitcoinAddress(tokenA, tokenB);

    // If someone create pool with two shitcoins then it is not first liquidity add
    if (!nonValuableToken) {
      logger.info(
        `Not first liquidity addition tokenA ${tokenA} tokenB ${tokenB}`
      );
      continue;
    }

    if (isItFirstAddLiquidity) {
      const isSetBefore = await redisClientDb0.exists(nonValuableToken);

      if (isSetBefore) {
        logger.details(
          `nonValuableToken ${nonValuableToken} exists in db0, avoid readdition to db0`
        );
        continue;
      }

      redisClientDb0.set(nonValuableToken, transaction.from.toLowerCase(), 'EX', 129600);

      logger.bingo(`First liquidity addition token ${nonValuableToken}`);
    } else {
      logger.info(`Not first liquidity addition token ${nonValuableToken}`);
    }
  }

  processBlocksRecursively(currentBlockNumber + 1);
}

module.exports = processBlocksRecursively;