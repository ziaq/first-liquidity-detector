const ethers = require('ethers');
const { mainInfoLogger, checkedBlocksLogger } = require('./logger');
const { sendTelegramNotification } = require('./sendTelegramNotification');
const getInputTokensFromTransaction = require('./getInputTokensFromTransaction');

const liquidityAddingSignatureList = [
  '0xf305d719', // addLiquidityETH
  '0xddf252ad', // addLiquidity
  '0xe8e33700', // addLiquidityETHSupportingFeeOnTransferTokens
  '0xc9c6532e', // addLiquiditySupportingFeeOnTransferTokens
];

function isAddLiquidityTransaction(transaction) {
  return liquidityAddingSignatureList.includes(transaction.data.slice(0, 10));
}

async function listenTransactions(provider, fromBlock = null) {
  let currentBlock = fromBlock || await provider.getBlockNumber();

  try {
    const block = await provider.getBlockWithTransactions(currentBlock);
  
    for (const transaction of block.transactions) {
      if (isAddLiquidityTransaction(transaction)) {
        (async () => {
          try {
            const inputToken = await getInputTokensFromTransaction(transaction);
            const message = `Liquidity addition detected in block ${currentBlock}:\n` +
              `TokenA: ${inputToken.tokenA}\n` +
              `TokenB: ${inputToken.tokenB}\n` +
              `Transaction Hash: ${transaction.hash}`;
        
            mainInfoLogger.info(message);
            sendTelegramNotification(message);
          } catch (error) {
            mainInfoLogger.error(`Error processing transaction ${transaction.hash}: ${error.message}`);
          }
        })();
      }
    }
  
    checkedBlocksLogger.info(`Checked block ${currentBlock}`);
    currentBlock++;
  } catch (error) {
    mainInfoLogger.error(`Error processing block ${currentBlock}: ${error.message}`);
  }

  // It is necessary not to block the event loop
  setTimeout(() => listenTransactions(provider, currentBlock));
}

module.exports = listenTransactions;