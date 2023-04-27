const winston = require('winston');
const { combine, timestamp, printf } = winston.format;

const customFormat = (customLabel) => printf(({ timestamp, level, message }) => {
  const date = new Date(timestamp);
  const formattedTimestamp = date.toLocaleString('ru-RU', { hour12: false }) + 
    ' :' + String(date.getMilliseconds()).padStart(3, '0');
  return `${formattedTimestamp} ${level} [${customLabel}]: ${message}`;
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
const fetchLogger = createLoggerWithLabel('fetch');
const bingoLogger = createLoggerWithLabel('bingo');

module.exports = {
  info: infoLogger.info.bind(infoLogger),
  error: errorLogger.error.bind(errorLogger),
  checkingBlock: checkingBlockLogger.info.bind(checkingBlockLogger),
  fetch: fetchLogger.info.bind(fetchLogger),
  bingo: bingoLogger.info.bind(bingoLogger),
};