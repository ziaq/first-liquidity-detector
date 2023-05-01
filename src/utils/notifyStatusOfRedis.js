const sendTelegramNotification = require('./sendTelegramNotification');
const logger = require('./logger');

function notifyStatusOfRedis(redisClient, name) {
  redisClient.on('ready', () => {
    logger.info(`Connected to Redis ${name}`);
  });

  redisClient.on('error', (error) => {
    const message = `Error connecting to Redis ${name}: ${error.message}`;
    logger.error(message);
    sendTelegramNotification(message);
  });
}

module.exports = notifyStatusOfRedis;