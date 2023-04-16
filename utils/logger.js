const winston = require('winston');
const { combine, timestamp, printf, label } = winston.format;

const commonFormat = printf(({ timestamp, level, message, label }) => {
  return `${timestamp} ${level} [${label}]: ${message}`;
});

const logger = winston.createLogger({
  format: combine(
    timestamp(),
    commonFormat
  ),
  transports: [
    new winston.transports.File({
      filename: './logs/app.log',
      level: 'info',
    }),
    new winston.transports.Console({
      format: combine(
        timestamp(),
        commonFormat
      ),
      level: 'info',
    }),
  ],
});

const mainInfoLogger = logger.child({ label: 'info' });
const checkedBlocksLogger = logger.child({ label: 'block' });

module.exports = {
  mainInfoLogger,
  checkedBlocksLogger,
};