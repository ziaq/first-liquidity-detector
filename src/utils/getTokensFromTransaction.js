const ethers = require('ethers');
const uniswapV2RouterAbi = require('../../abi/uniswapV2Router.json');
const openTradingAbi = require('../../abi/openTrading.json');
const logger = require('./logger');

async function getTokensFromTransaction(transaction, addLiquiditySignature) {
  let tokenA, tokenB;

  if (addLiquiditySignature === '0xc9567bf9') { // openTrading
    const tokenContractInterface = new ethers.utils.Interface(openTradingAbi);
    const decodedTx = tokenContractInterface.parseTransaction(transaction);
    tokenA = decodedTx.args.token0;
    tokenB = decodedTx.args.token1;

  } else {
    const tokenContractInterface = new ethers.utils.Interface(uniswapV2RouterAbi);
    const decodedTx = tokenContractInterface.parseTransaction(transaction);

    const methodName = decodedTx.signature.split('(')[0];
    switch (methodName) {
      case 'addLiquidity':
      case 'addLiquiditySupportingFeeOnTransferTokens':
        tokenA = decodedTx.args.tokenA;
        tokenB = decodedTx.args.tokenB;
        break;
      case 'addLiquidityETH':
      case 'addLiquidityETHSupportingFeeOnTransferTokens':
        tokenA = decodedTx.args.token;
        tokenB = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address
        break;
      default:
        logger.error(
          `Unsupported method signature ${addLiquiditySignature} in module getTokensFromTransaction`
        );
    }
  }

  return { tokenA, tokenB };
}

module.exports = getTokensFromTransaction;