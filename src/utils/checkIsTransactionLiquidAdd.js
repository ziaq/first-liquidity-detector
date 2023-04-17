const liquidityAddingSignatureList = [
  '0xf305d719', // addLiquidityETH
  '0xddf252ad', // addLiquidity
  '0xe8e33700', // addLiquidityETHSupportingFeeOnTransferTokens
  '0xc9c6532e', // addLiquiditySupportingFeeOnTransferTokens
];

function isAddLiquidityTransaction(transaction) {
  return liquidityAddingSignatureList.includes(transaction.data.slice(0, 10));
}

module.exports = isAddLiquidityTransaction;