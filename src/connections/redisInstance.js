const Redis = require("ioredis");

const config = require("../../config/config")
const notifyStatusOfRedis = require("../utils/notifyStatusOfRedis");

const redisClientDb0 = new Redis({ url: config.redisUrl, db: 0 });
notifyStatusOfRedis(redisClientDb0, "redisClientDb0");

module.exports = redisClientDb0;