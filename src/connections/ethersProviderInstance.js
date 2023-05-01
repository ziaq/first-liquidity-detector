const { providers } = require('ethers');
const config = require('../../config/config');

const provider = new providers.JsonRpcProvider(config.rpcUrl);

module.exports = provider;