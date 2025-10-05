const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  try {
    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN is required');
    }

    const bot = new TelegramBot(process.env.BOT_TOKEN);
    const webhookUrl = `https://${req.headers.host}/api/webhook`;
    
    await bot.setWebHook(webhookUrl);
    
    res.json({ 
      success: true, 
      webhook: webhookUrl,
      message: 'Webhook set successfully'
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
