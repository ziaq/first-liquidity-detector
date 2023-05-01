const Redis = require('ioredis');

const logger = require('../utils/logger');
const ignoreList = require('../../config/ignoreList.json');
const addingLiquiditySignatureList = require('../../config/addingLiquiditySignatureList');
const getTokensFromTransaction = require('../utils/getTokensFromTransaction');
const sendTelegramNotification = require('../utils/sendTelegramNotification');
const isThereLiquidityInPreviousBlock = require('./isThereLiquidityInPreviousBlock');
const identifyShitcoinAddress = require('../utils/identifyShitcoinAddress');
const redisClientDb0 = require('../connections/redisInstance');
const provider = require('../connections/ethersProviderInstance');

async function processBlocksRecursively(currentBlockNumber) {
  try {
    const block = await provider.getBlockWithTransactions(currentBlockNumber);

    if (!block) {
      setTimeout(() => {
        processBlocksRecursively(currentBlockNumber);
      }, 3000);
      return;
    }
    logger.info(`Checking block ${currentBlockNumber}`);

    for (const transaction of block.transactions) {
      const getAddLiquiditySignature = (transaction) => {
        return addingLiquiditySignatureList.find(signature => signature === transaction.data.slice(0, 10));
      };
      
      const addLiquiditySignature = getAddLiquiditySignature(transaction);
      if (!addLiquiditySignature) continue;

      const { tokenA, tokenB } = await getTokensFromTransaction(transaction, addLiquiditySignature);

      // Condition for ignoring some tokens that have unusual pools and give weird result
      if (ignoreList.tokens.includes(tokenA) || ignoreList.tokens.includes(tokenB)) {
        continue;
      }

      const isItFirstAddLiquidity = await isThereLiquidityInPreviousBlock(
        tokenA, tokenB, currentBlockNumber);

      const nonValuableToken = identifyShitcoinAddress(tokenA, tokenB);;
      if (isItFirstAddLiquidity) {
        redisClientDb0.set(nonValuableToken, 'readyForNextInspection', 'EX', 1800);

        logger.bingo(`First liquidity addition in token ${nonValuableToken}`);
      } else {
        logger.info(`Not first liquidity addition in token ${nonValuableToken}`);
      }
    }

    processBlocksRecursively(currentBlockNumber + 1);

  } catch (error) {
    logger.error(`Error processing block ${currentBlockNumber}: ${error.message}`);
    sendTelegramNotification(`Error processing block ${currentBlockNumber}: ${error.message}`);
    processBlocksRecursively(currentBlockNumber + 1);
  }
}

module.exports = processBlocksRecursively;