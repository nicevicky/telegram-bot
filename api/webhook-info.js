const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  try {
    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN is required');
    }

    const bot = new TelegramBot(process.env.BOT_TOKEN);
    const webhookInfo = await bot.getWebHookInfo();
    const botInfo = await bot.getMe();
    
    res.json({
      success: true,
      webhook_info: webhookInfo,
      bot_info: botInfo
    });
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
