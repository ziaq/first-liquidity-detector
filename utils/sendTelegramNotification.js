require('dotenv').config();

const axios = require('axios');
const logger = require('./utils/logger');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const sendTelegramNotification = async (message) => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
  };

  try {
    await axios.post(url, payload);
    logger.info(`Telegram notification sent: ${message}`);
  } catch (error) {
    logger.error(`Failed to send Telegram notification: ${error.message}`);
  }
};

module.exports = {
  sendTelegramNotification,
};