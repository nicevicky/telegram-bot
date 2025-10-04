const express = require('express');
const bodyParser = require('body-parser');
const TelegramCustomerSupportBot = require('../src/bot');
const database = require('../src/database');

const app = express();
app.use(bodyParser.json());

// Initialize bot
const bot = new TelegramCustomerSupportBot(process.env.BOT_TOKEN);

// Initialize database
database.initTables().catch(console.error);

// Webhook endpoint
app.post('/api/webhook', async (req, res) => {
  await bot.handleWebhook(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Set webhook endpoint
app.get('/api/setwebhook', async (req, res) => {
  try {
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhook`;
    await bot.bot.setWebHook(webhookUrl);
    res.json({ success: true, webhook: webhookUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export for Vercel
module.exports = app;
