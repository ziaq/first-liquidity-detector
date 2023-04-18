const logger = require('../utils/logger');
const isAddLiquidityTransaction = require('../utils/checkIsTransactionLiquidAdd');
const getInputTokensFromTransaction = require('../utils/getInputTokensFromTransaction');
const sendTelegramNotification = require('../services/sendTelegramNotification');
const checkAnyPoolNotExists = require('../utils/checkAnyPoolNotExists');
const getLiquidityValueInUSD = require('../utils/getLiquidityValueInUSD');

async function processBlock(provider, currentBlockNumber) {
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
        console.log(inputTokens.amountA + '  ' + inputTokens.amountB)
        const liquidityValueInUsd = getLiquidityValueInUSD(
          inputTokens.tokenA, 
          inputTokens.amountA, 
          inputTokens.tokenB, 
          inputTokens.amountB
          );
        logger.catched('First ' + message + `\nLiquidity value in USD: ${liquidityValueInUsd}`);
        sendTelegramNotification('First ' + message + `\nLiquidity value in USD: ${liquidityValueInUsd}`);
      } else {
        logger.info('Not the first ' + message);
      }
    }

    processBlock(provider, currentBlockNumber + 1);
  } catch (error) {
    logger.error(`Error processing block ${currentBlockNumber}: ${error.message}`);
    sendTelegramNotification(`Error processing block ${currentBlockNumber}: ${error.message}`);
  }
}

async function listenTransactions(provider, startBlockNumber) {
  if (!startBlockNumber) {
    startBlockNumber = await provider.getBlockNumber();
  }
  processBlock(provider, startBlockNumber);
}

module.exports = listenTransactions;