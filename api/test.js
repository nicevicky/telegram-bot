const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Bot API is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      environment: {
        bot_token: process.env.BOT_TOKEN ? 'Set' : 'Missing',
        admin_id: process.env.ADMIN_ID ? 'Set' : 'Missing',
        supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing',
        supabase_key: process.env.SUPABASE_KEY ? 'Set' : 'Missing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
