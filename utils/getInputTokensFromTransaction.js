const ethers = require('ethers');
const ADD_LIQUIDITY_ABI = require('../abi/uniswapV2Router02.json');
const { mainInfoLogger } = require('./logger');

async function getInputTokensFromTransaction(transaction) {
  const tokenContractInterface = new ethers.utils.Interface(ADD_LIQUIDITY_ABI);

  try {
    const decoded = tokenContractInterface.parseTransaction(transaction);
    let tokenA, tokenB;

    switch (decoded.signature) {
      case 'addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)':
      case 'addLiquiditySupportingFeeOnTransferTokens(address,address,uint256,uint256,uint256,uint256,address,uint256)':
        tokenA = decoded.args.tokenA;
        tokenB = decoded.args.tokenB;
        break;
      case 'addLiquidityETH(address,uint256,uint256,uint256,address,uint256)':
      case 'addLiquidityETHSupportingFeeOnTransferTokens(address,uint256,uint256,uint256,address,uint256)':
        tokenA = decoded.args.token;
        tokenB = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address
        break;
      default:
        throw new Error('Unsupported method signature');
    }

    return {
      tokenA: tokenA,
      tokenB: tokenB,
    };
  } catch (error) {
    mainInfoLogger.error(`Error decoding transaction ${transaction.hash}: ${error.message}`);
  }

  return null;
}

module.exports = getInputTokensFromTransaction;