const ethers = require('ethers');
const uniswapV2RouterAbi = require('../../abi/uniswapV2Router.json');
const erc20Abi = require('../../abi/erc20.json');
const logger = require('./logger');

async function getInputTokensFromTransaction(provider, transaction) {
  const tokenContractInterface = new ethers.utils.Interface(uniswapV2RouterAbi);
  try {
    const decoded = tokenContractInterface.parseTransaction(transaction);
    let tokenA, tokenB, amountA, amountB;

    // Signature: "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)"
    const methodName = decoded.signature.split('(')[0];
    switch (methodName) {
      case 'addLiquidity':
      case 'addLiquiditySupportingFeeOnTransferTokens':
        tokenA = decoded.args.tokenA;
        tokenB = decoded.args.tokenB;
        amountA = decoded.args.amountADesired;
        amountB = decoded.args.amountBDesired;
        break;
      case 'addLiquidityETH':
      case 'addLiquidityETHSupportingFeeOnTransferTokens':
        tokenA = decoded.args.token;
        tokenB = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address
        amountA = decoded.args.amountTokenDesired;
        amountB = transaction.value;
        break;
      default:
        logger.error('Unsupported method signature');
    }

    const tokenAContract = new ethers.Contract(tokenA, erc20Abi, provider);
    const tokenBContract = new ethers.Contract(tokenB, erc20Abi, provider);

    const decimalsA = await tokenAContract.decimals();
    const decimalsB = await tokenBContract.decimals();

    const amountAWithDecimals = parseFloat(ethers.utils.formatUnits(amountA, decimalsA));
    const amountBWithDecimals = parseFloat(ethers.utils.formatUnits(amountB, decimalsB));
    return {
      tokenA,
      amountA: amountAWithDecimals,
      tokenB,
      amountB: amountBWithDecimals,
    };
  } catch (error) {
    logger.error(`Error decoding transaction ${transaction.hash}: ${error.message}`);
  }

  return null;
}

module.exports = getInputTokensFromTransaction;
