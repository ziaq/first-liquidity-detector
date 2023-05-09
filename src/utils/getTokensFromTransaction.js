const ethers = require('ethers');
const uniswapV2RouterAbi = require('../../abi/uniswapV2Router.json');
const logger = require('./logger');

function getTokensFromTransaction(transaction, addLiquiditySignature) {
  let tokenA, tokenB;
  try {
    if (addLiquiditySignature === '0xc9567bf9') { // openTrading
      tokenA = transaction.to;
      tokenB = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH address

    } else {
      const tokenContractInterface = new ethers.utils.Interface(uniswapV2RouterAbi);
      const decodedTx = tokenContractInterface.parseTransaction(transaction);

      const methodName = decodedTx.signature.split('(')[0];
      switch (methodName) {
        case 'addLiquidity':
        case 'addLiquiditySupportingFeeOnTransferTokens':
          tokenA = decodedTx.args.tokenA.toLowerCase();
          tokenB = decodedTx.args.tokenB.toLowerCase();
          break;
        case 'addLiquidityETH':
        case 'addLiquidityETHSupportingFeeOnTransferTokens':
          tokenA = decodedTx.args.token.toLowerCase();
          tokenB = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH address
          break;
        default:
          logger.error(
            `Unsupported method signature ${addLiquiditySignature} in module getTokensFromTransaction`
          );
      }
    }
  } catch (error) {
    logger.error(`Error in getTokensFromTransaction (module1). Error message: ${error.message}`);
    return { tokenA: null, tokenB: null };
  }

  return { tokenA, tokenB };
}

module.exports = getTokensFromTransaction;