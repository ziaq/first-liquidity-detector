require('dotenv').config();

const ethers = require('ethers');
const redis = require('redis');
const { mainInfoLogger } = require('./utils/logger');
const getAdminInput = require('./utils/adminStartInput');
const listenTransactions = require('./utils/listenTransactions');

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL, {
  chainId: 1,
});

const redisClient = redis.createClient(process.env.REDIS_URL);
redisClient.connect().then(() => {
  mainInfoLogger.info('Connected to Redis');
});

function startListening(provider, startBlockNumber) {
  listenTransactions(provider, startBlockNumber);
}

getAdminInput((startBlockNumber) => {
  startListening(provider, startBlockNumber);
});