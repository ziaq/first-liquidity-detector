const ethers = require('ethers');
const config = require('../config/config');
const getStartSettingsFromAdmin = require('./core/getStartSettingsFromAdmin');
const listenTransactions = require('./core/listenTransactions');

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

function startListening(provider, startBlockNumber) {
  listenTransactions(provider, startBlockNumber);
}

getStartSettingsFromAdmin((startBlockNumber) => {
  startListening(provider, startBlockNumber);
});