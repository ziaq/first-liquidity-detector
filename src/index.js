const redis = require('redis');
const ethers = require('ethers');
const config = require('../config/config');
const logger = require('./utils/logger');
const getStartSettingsFromAdmin = require('./core/getStartSettingsFromAdmin');
const listenTransactions = require('./core/listenTransactions');

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

const redisClient = redis.createClient(config.redisUrl);
redisClient.connect().then(() => {
  logger.info('Connected to Redis');
});

function startListening(provider, startBlockNumber) {
  listenTransactions(provider, startBlockNumber);
}

getStartSettingsFromAdmin((startBlockNumber) => {
  startListening(provider, startBlockNumber);
});