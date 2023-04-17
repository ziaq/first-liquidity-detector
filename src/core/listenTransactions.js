const logger = require('../utils/logger');
const isAddLiquidityTransaction = require('../utils/checkIsTransactionLiquidAdd');
const getInputTokensFromTransaction = require('../utils/getInputTokensFromTransaction');
const sendTelegramNotification = require('../services/sendTelegramNotification');

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

      const inputTokens = await getInputTokensFromTransaction(transaction);
      const message = `Liquidity addition detected in block ${currentBlockNumber}:\n` +
                      `TokenA: ${inputTokens.tokenA}\n` +
                      `TokenB: ${inputTokens.tokenB}\n` +
                      `Transaction Hash: ${transaction.hash}`;

      logger.catched(message);
      await sendTelegramNotification(message);
    }

    processBlock(provider, currentBlockNumber + 1);
  } catch (error) {
    logger.error(`Error processing block ${currentBlockNumber}: ${error.message}`);
  }
}

async function listenTransactions(provider, startBlockNumber) {
  if (!startBlockNumber) {
    startBlockNumber = await provider.getBlockNumber();
  }
  processBlock(provider, startBlockNumber);
}

module.exports = listenTransactions;