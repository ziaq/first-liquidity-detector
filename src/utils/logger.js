const winston = require('winston');
const { combine, timestamp, printf } = winston.format;

const customFormat = (customLabel) => printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level} [${customLabel}]: ${message}`;
});

const createLoggerWithLabel = (customLabel) => {
  return winston.createLogger({
    format: combine(timestamp(), customFormat(customLabel)),
    transports: [
      new winston.transports.File({
        filename: './logs/app.log',
        level: 'info',
      }),
      new winston.transports.Console({
        level: 'info',
      }),
    ],
  });
};

const infoLogger = createLoggerWithLabel('info');
const errorLogger = createLoggerWithLabel('error');
const checkingBlockLogger = createLoggerWithLabel('checkingBlock');
const checkingTxLogger = createLoggerWithLabel('checkingTx');
const bingoLogger = createLoggerWithLabel('bingo');

module.exports = {
  info: infoLogger.info.bind(infoLogger),
  error: errorLogger.error.bind(errorLogger),
  checkingBlock: checkingBlockLogger.info.bind(checkingBlockLogger),
  checkingTx: checkingTxLogger.info.bind(checkingTxLogger),
  bingo: bingoLogger.info.bind(bingoLogger),
};