const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(bodyParser.json());

// Initialize bot
let bot;
try {
  if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN environment variable is required');
  }
  bot = new TelegramBot(process.env.BOT_TOKEN);
  console.log('Bot initialized successfully');
} catch (error) {
  console.error('Failed to initialize bot:', error.message);
}

// Simple bot handlers
if (bot) {
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    console.log('Received /start command from:', msg.from.id);
    try {
      const welcomeMessage = `👋 Welcome ${msg.from.first_name}!\n\n` +
                            `🎯 This is your Customer Support Bot.\n\n` +
                            `How can I help you today?\n\n` +
                            `Please write your complaint or question and I'll forward it to our admin.`;

      await bot.sendMessage(msg.chat.id, welcomeMessage);
      console.log('Welcome message sent successfully');
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  });

  // Handle all other messages
  bot.on('message', async (msg) => {
    console.log('Received message:', {
      from: msg.from.id,
      text: msg.text,
      chat_type: msg.chat.type
    });

    // Skip if it's a command (already handled above)
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    // Handle private messages as complaints
    if (msg.chat.type === 'private' && msg.text) {
      try {
        // Send confirmation to user
        await bot.sendMessage(msg.chat.id, 
          `✅ Thank you for your message!\n\n` +
          `📝 Your message: "${msg.text}"\n\n` +
          `👨‍💼 I've forwarded this to our admin. You'll receive a response soon!`
        );

        // Forward to admin
        const adminId = process.env.ADMIN_ID;
        if (adminId) {
          const adminMessage = `🔔 New message from user:\n\n` +
                              `👤 User: ${msg.from.first_name} (@${msg.from.username || 'no username'})\n` +
                              `🆔 User ID: ${msg.from.id}\n` +
                              `📝 Message: ${msg.text}\n\n` +
                              `Reply with: /reply ${msg.from.id} Your response here`;

          await bot.sendMessage(adminId, adminMessage);
          console.log('Message forwarded to admin');
        }
      } catch (error) {
        console.error('Error handling message:', error);
        try {
          await bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your message. Please try again.');
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
      }
    }
  });

  // Handle admin replies
  bot.onText(/\/reply (\d+) (.+)/, async (msg, match) => {
    if (msg.from.id.toString() === process.env.ADMIN_ID) {
      const userId = match[1];
      const reply = match[2];

      try {
        await bot.sendMessage(userId, `💬 Response from Admin:\n\n${reply}`);
        await bot.sendMessage(msg.chat.id, '✅ Reply sent successfully!');
        console.log('Admin reply sent to user:', userId);
      } catch (error) {
        console.error('Error sending admin reply:', error);
        await bot.sendMessage(msg.chat.id, '❌ Failed to send reply. User may have blocked the bot.');
      }
    }
  });
}

// Webhook endpoint
app.post('/api/webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  
  try {
    if (!bot) {
      throw new Error('Bot not initialized');
    }
    
    await bot.processUpdate(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    bot_initialized: !!bot
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Bot API is working',
    timestamp: new Date().toISOString(),
    env_check: {
      bot_token: process.env.BOT_TOKEN ? 'Set' : 'Missing',
      admin_id: process.env.ADMIN_ID ? 'Set' : 'Missing',
      supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing'
    },
    bot_initialized: !!bot
  });
});

// Set webhook endpoint
app.get('/api/setwebhook', async (req, res) => {
  try {
    if (!bot) {
      throw new Error('Bot not initialized');
    }
    
    const webhookUrl = `https://${req.get('host')}/api/webhook`;
    console.log('Setting webhook to:', webhookUrl);
    
    const result = await bot.setWebHook(webhookUrl);
    console.log('Webhook set result:', result);
    
    const webhookInfo = await bot.getWebHookInfo();
    console.log('Webhook info:', webhookInfo);
    
    res.json({ 
      success: true, 
      webhook: webhookUrl,
      webhook_info: webhookInfo
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get webhook info endpoint
app.get('/api/webhook-info', async (req, res) => {
  try {
    if (!bot) {
      throw new Error('Bot not initialized');
    }
    
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
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Telegram Bot is running!',
    endpoints: {
      webhook: '/api/webhook',
      health: '/api/health',
      test: '/api/test',
      setwebhook: '/api/setwebhook',
      'webhook-info': '/api/webhook-info'
    }
  });
});

// Export for Vercel
module.exports = app;
