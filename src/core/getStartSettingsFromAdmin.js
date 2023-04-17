const readline = require('readline');
const logger = require('../utils/logger');

const getStartSettingsFromAdmin = (callback) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Start listening from (1) current block or (2) specific block? (Enter 1 or 2): ', async (choice) => {
    if (choice === '1') {
      logger.info('Starting from the current block...');
      callback();
    } else if (choice === '2') {
      rl.question('Enter the block number to start listening from: ', async (blockNumber) => {
        logger.info(`Starting from block ${blockNumber}...`);
        callback(parseInt(blockNumber));
        rl.close();
      });
    } else {
      logger.error('Invalid choice. Exiting...');
      rl.close();
    }
  });
};

module.exports = getStartSettingsFromAdmin;