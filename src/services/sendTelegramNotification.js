const { Telegraf } = require('telegraf');
const config = require('../../config/config');
const { mainInfoLogger } = require('../utils/logger');

const bot = new Telegraf(config.telegramBotToken);
const TELEGRAM_CHAT_ID = config.telegramChatId;

const sendTelegramNotification = async (message) => {
  try {
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'HTML' });
  } catch (error) {
    mainInfoLogger.error('Can not send message to telegram');
  }
};

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = sendTelegramNotification;