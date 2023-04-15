require('dotenv').config(); // Подключаем dotenv

const ethers = require('ethers');
const redis = require('redis');
const { sendTelegramNotification } = require('./utils/sendTelegramNotification');
const logger = require('./utils/logger');

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const redisClient = redis.createClient(process.env.REDIS_URL);

const pairABI = [
  'event Swap(uint112 amount0In, uint112 amount1In, uint112 amount0Out, uint112 amount1Out, address indexed to)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];

const trackSwapEvents = async (pairAddress) => {
  const pairContract = new ethers.Contract(pairAddress, pairABI, provider);

  pairContract.on('Swap', async (amount0In, amount1In, amount0Out, amount1Out, to) => {
    if (amount0Out.eq(0) && amount1Out.eq(0)) {
      const reserves = await pairContract.getReserves();
      const reserve0 = reserves.reserve0;
      const reserve1 = reserves.reserve1;

      if (reserve0.gt(0) && reserve1.gt(0)) {
        logger.info(`First liquidity added for pair: ${pairAddress}`);
        redisClient.set(`pair:${pairAddress}`, 'First liquidity added');

        sendTelegramNotification(`First liquidity added for pair: ${pairAddress}`);
      }
    }
  });
};

const trackNewPairs = async (uniswapFactory) => {
  uniswapFactory.on('PairCreated', async (token0, token1, pairAddress) => {
    console.log(`New pair created: ${token0}, ${token1}, ${pairAddress}`);
    trackSwapEvents(pairAddress);
  });
};

const startListening = async () => {
  logger.info('Listening for PairCreated events...');

  const uniswapFactory = new ethers.Contract(uniswapFactoryAddress, uniswapFactoryABI, provider);
  trackNewPairs(uniswapFactory);
};

startListening();