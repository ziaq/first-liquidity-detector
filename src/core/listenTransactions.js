const logger = require('../utils/logger');
const config = require('../../config/config');
const ignoreList = require('../../config/ignoreList.json');
const isAddLiquidityTransaction = require('../utils/checkIsTransactionLiquidAdd');
const getInputTokensFromTransaction = require('../utils/getInputTokensFromTransaction');
const sendTelegramNotification = require('../services/sendTelegramNotification');
const checkPoolExists = require('../utils/checkPoolExists');
const getLiquidityInUsdAndShitcoinAddress = require('../utils/getLiquidityInUsdAndShitcoinAddress');
const redis = require('redis');

async function processBlock(provider, currentBlockNumber, redisClient) {
  try {
    logger.checkBlock(`Checking block ${currentBlockNumber}`);
    const block = await provider.getBlockWithTransactions(currentBlockNumber);

    if (!block) {
      setTimeout(() => {
        processBlock(provider, currentBlockNumber, redisClient);
      }, 1500);
      return;
    }

    for (const transaction of block.transactions) {
      if (!isAddLiquidityTransaction(transaction)) {
        continue;
      }

      const inputTokens = await getInputTokensFromTransaction(provider, transaction);
      // Condition for ignoring some tokens that have unusual pools and give wrong result
      if (ignoreList.tokens.includes(inputTokens.tokenA) || ignoreList.tokens.includes(inputTokens.tokenB)) {
        continue;
      }

      const isPoolExits = await checkPoolExists(provider, inputTokens.tokenA, inputTokens.tokenB, currentBlockNumber);

      const message = `liquidity addition detected in block ${currentBlockNumber}:\n` +
                      `TokenA: ${inputTokens.tokenA}\n` +
                      `TokenB: ${inputTokens.tokenB}\n` +
                      `Transaction Hash: ${transaction.hash}`;
      if (!isPoolExits) {
        const { valueInUsd, nonValuableToken } = getLiquidityInUsdAndShitcoinAddress(
          inputTokens.tokenA, 
          inputTokens.amountA, 
          inputTokens.tokenB, 
          inputTokens.amountB
        );
        
        redisClient.set(nonValuableToken, block.timestamp);

        logger.catched('First ' + message + `\nLiquidity value in USD: ${valueInUsd}`);
        sendTelegramNotification('First ' + message + `\nLiquidity value in USD: ${valueInUsd}`);
      } else {
        logger.info('Not the first ' + message);
      }
    }

    processBlock(provider, currentBlockNumber + 1, redisClient);
  } catch (error) {
    logger.error(`Error processing block ${currentBlockNumber}: ${error.message}\nStart process the block again`);
    sendTelegramNotification(`Error processing block ${currentBlockNumber}: ${error.message}\nStart process the block again`);
    processBlock(provider, currentBlockNumber, redisClient);
  }
}

async function listenTransactions(provider, startBlockNumber) {
  const redisClient = redis.createClient({ url: config.redisUrl, db: 0 });
  await redisClient.connect();
  logger.info('Connected to Redis');

  if (!startBlockNumber) {
    startBlockNumber = await provider.getBlockNumber();
  }
  
  processBlock(provider, startBlockNumber, redisClient);
}

module.exports = listenTransactions;