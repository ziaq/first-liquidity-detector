const logger = require('../utils/logger');
const config = require('../../config/config');
const isAddLiquidityTransaction = require('../utils/checkIsTransactionLiquidAdd');
const getInputTokensFromTransaction = require('../utils/getInputTokensFromTransaction');
const sendTelegramNotification = require('../services/sendTelegramNotification');
const checkAnyPoolNotExists = require('../utils/checkAnyPoolNotExists');
const getLiquidityInUsdAndShitcoinAddress = require('../utils/getLiquidityInUsdAndShitcoinAddress');
const redis = require('redis');

async function processBlock(provider, currentBlockNumber, redisClient) {
  try {
    logger.checkBlock(`Checking block ${currentBlockNumber}`);
    const block = await provider.getBlockWithTransactions(currentBlockNumber);

    if (!block) {
      setTimeout(() => {
        processBlock(provider, currentBlockNumber);
      }, 500);
      return;
    }

    for (const transaction of block.transactions) {
      if (!isAddLiquidityTransaction(transaction)) {
        continue;
      }

      const inputTokens = await getInputTokensFromTransaction(provider, transaction);
      const poolNotExists = await checkAnyPoolNotExists(provider, inputTokens.tokenA, inputTokens.tokenB, currentBlockNumber);

      const message = `liquidity addition detected in block ${currentBlockNumber}:\n` +
                      `TokenA: ${inputTokens.tokenA}\n` +
                      `TokenB: ${inputTokens.tokenB}\n` +
                      `Transaction Hash: ${transaction.hash}`;

      if (poolNotExists) {
        const { valueInUsd, nonValuableToken } = getLiquidityInUsdAndShitcoinAddress(
          inputTokens.tokenA, 
          inputTokens.amountA, 
          inputTokens.tokenB, 
          inputTokens.amountB
        );
        
        redisClient.set(nonValuableToken, JSON.stringify({ valueInUsd, transactionHash: transaction.hash }));

        logger.catched('First ' + message + `\nLiquidity value in USD: ${valueInUsd}`);
        sendTelegramNotification('First ' + message + `\nLiquidity value in USD: ${valueInUsd}`);
      } else {
        logger.info('Not the first ' + message);
      }
    }

    processBlock(provider, currentBlockNumber + 1, redisClient);
  } catch (error) {
    logger.error(`Error processing block ${currentBlockNumber}: ${error.message}`);
    sendTelegramNotification(`Error processing block ${currentBlockNumber}: ${error.message}`);
  }
}

async function listenTransactions(provider, startBlockNumber) {
  const redisClient = redis.createClient(config.redisUrl);
  redisClient.connect().then(() => {
    logger.info('Connected to Redis');
  });

  if (!startBlockNumber) {
    startBlockNumber = await provider.getBlockNumber();
  }
  
  processBlock(provider, startBlockNumber, redisClient);
}

module.exports = listenTransactions;