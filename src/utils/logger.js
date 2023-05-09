const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, printf } = format;

const customFormat = (customLabel) => printf(({ timestamp, level, message }) => {
  const date = new Date(timestamp);
  const formattedTimestamp = date.toLocaleString('ru-RU', { hour12: false }) +
    ' :' + String(date.getMilliseconds()).padStart(3, '0');
  return `${formattedTimestamp} ${level} [${customLabel}]: ${message}`;
});

const appTransports = [
  new DailyRotateFile({
    filename: `logs/app-%DATE%.log`,
    datePattern: 'DD-MM-YYYY',
    maxSize: '10m',
    maxFiles: '3d',
    level: 'info',
  }),
  new transports.Console({
    level: 'info',
  }),
];

const detailsTransports = [
  new DailyRotateFile({
    filename: `logs/details-%DATE%.log`,
    datePattern: 'DD-MM-YYYY',
    maxSize: '10m',
    maxFiles: '3d',
    level: 'info',
  }),
];

const createCustomLabelLogger = (customLabel, customTransports) => createLogger({
  format: combine(timestamp(), customFormat(customLabel)),
  transports: customTransports,
});

const loggers = {
  info: createCustomLabelLogger('info', appTransports),
  error: createCustomLabelLogger('error', appTransports),
  details: createCustomLabelLogger('details', detailsTransports),
  bingo: createCustomLabelLogger('bingo', appTransports),
};

module.exports = {
  info: loggers.info.info.bind(loggers.info),
  error: loggers.error.error.bind(loggers.error),
  details: loggers.details.info.bind(loggers.details),
  bingo: loggers.bingo.info.bind(loggers.bingo),
};