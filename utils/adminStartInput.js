const readline = require('readline');

const getAdminInput = (callback) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Start listening from (1) current block or (2) specific block? (Enter 1 or 2): ', async (choice) => {
    if (choice === '1') {
      console.log('Starting from the current block...');
      callback();
    } else if (choice === '2') {
      rl.question('Enter the block number to start listening from: ', async (blockNumber) => {
        console.log(`Starting from block ${blockNumber}...`);
        callback(parseInt(blockNumber));
        rl.close();
      });
    } else {
      console.log('Invalid choice. Exiting...');
      rl.close();
    }
  });
};

module.exports = getAdminInput;