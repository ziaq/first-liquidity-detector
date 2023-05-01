const config = require('../config/config');
const processBlocksRecursively = require('./core/processBlocksRecursively');
const provider = require('./connections/ethersProviderInstance');

async function listenBlocks() {
  let startBlockNumber;
  if (config.startBlockNumber === 'latest') {
    startBlockNumber = await provider.getBlockNumber();
  } else {
    startBlockNumber = config.startBlockNumber;
  }
  
  processBlocksRecursively(startBlockNumber);
}

listenBlocks();