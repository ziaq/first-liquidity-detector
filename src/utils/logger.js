const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, printf } = format;

const customFormat = (customLabel) => printf(({ timestamp, level, message }) => {
  const date = new Date(timestamp);
  const formattedTimestamp = date.toLocaleString('ru-RU', { hour12: false }) +
    ' :' + String(date.getMilliseconds()).padStart(3, '0');
  return `${formattedTimestamp} ${level} [${customLabel}]: ${message}`;
});

const createTransports = () => ([
  new DailyRotateFile({
    filename: `logs/app-%DATE%.log`,
    datePattern: 'DD-MM-YYYY',
    maxSize: '10m',
    maxFiles: '10d',
    level: 'info',
  }),
  new transports.Console({
    level: 'info',
  }),
]);

const createCustomLabelLogger = (customLabel) => createLogger({
  format: combine(timestamp(), customFormat(customLabel)),
  transports: createTransports(),
});

const loggers = {
  info: createCustomLabelLogger('info'),
  error: createCustomLabelLogger('error'),
  fetch: createCustomLabelLogger('fetch'),
  bingo: createCustomLabelLogger('bingo'),
};

module.exports = {
  info: loggers.info.info.bind(loggers.info),
  error: loggers.error.error.bind(loggers.error),
  fetch: loggers.fetch.info.bind(loggers.fetch),
  bingo: loggers.bingo.info.bind(loggers.bingo),
};