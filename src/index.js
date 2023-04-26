const ethers = require('ethers');
const config = require('../config/config');
const listenTransactions = require('./core/listenTransactions');

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

function startListening(provider, startBlockNumber) {
  listenTransactions(provider, startBlockNumber);
}

const startBlockNumber = () => {
  return config.startBlockNumber === 'latest' ? '' : config.startBlockNumber;
}

startListening(provider, startBlockNumber());