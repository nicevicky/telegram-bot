const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize bot
let bot;
try {
  if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
  }
  bot = new TelegramBot(process.env.BOT_TOKEN);
  console.log('Bot initialized successfully');
} catch (error) {
  console.error('Bot initialization failed:', error.message);
}

// Simple database functions
const database = {
  async addUser(userId, username, firstName, lastName) {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          user_id: userId,
          username: username,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString()
        });
      return { data, error };
    } catch (error) {
      console.error('Database error:', error);
      return { data: null, error };
    }
  },

  async addComplaint(userId, message, username) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert({
          user_id: userId,
          username: username,
          message: message,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select();
      return { data, error };
    } catch (error) {
      console.error('Database error:', error);
      return { data: null, error };
    }
  }
};

// Bot handlers
if (bot) {
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    console.log('Start command received from:', msg.from.id);
    
    try {
      // Add user to database
      await database.addUser(
        msg.from.id,
        msg.from.username,
        msg.from.first_name,
        msg.from.last_name
      );

      const welcomeMessage = `👋 Welcome ${msg.from.first_name}!\n\n` +
                            `🎯 This is your Customer Support Bot.\n\n` +
                            `📝 Send me your complaint or question and I'll forward it to our admin.\n\n` +
                            `💬 How can I help you today?`;

      await bot.sendMessage(msg.chat.id, welcomeMessage);
      console.log('Welcome message sent successfully');
    } catch (error) {
      console.error('Error in start handler:', error);
      await bot.sendMessage(msg.chat.id, 'Welcome! Please try again.');
    }
  });

  // Handle all messages
  bot.on('message', async (msg) => {
    // Skip commands
    if (msg.text && msg.text.startsWith('/')) return;

    // Handle private messages only
    if (msg.chat.type === 'private' && msg.text) {
      console.log('Processing message from:', msg.from.id);
      
      try {
        // Save complaint to database
        const result = await database.addComplaint(
          msg.from.id,
          msg.text,
          msg.from.username || 'No username'
        );

        const complaintId = result.data ? result.data[0]?.id || 'Unknown' : 'Unknown';

        // Send confirmation to user
        await bot.sendMessage(msg.chat.id, 
          `✅ Thank you for your message!\n\n` +
          `📝 Your complaint: "${msg.text}"\n\n` +
          `🎫 Complaint ID: #${complaintId}\n\n` +
          `👨‍💼 I've forwarded this to our admin. You'll receive a response soon!`
        );

        // Forward to admin
        if (process.env.ADMIN_ID) {
          const adminMessage = `🔔 New Customer Complaint #${complaintId}\n\n` +
                              `👤 User: ${msg.from.first_name} (@${msg.from.username || 'no username'})\n` +
                              `🆔 User ID: ${msg.from.id}\n` +
                              `📝 Message: ${msg.text}\n\n` +
                              `To reply: /reply ${msg.from.id} Your response here`;

          await bot.sendMessage(process.env.ADMIN_ID, adminMessage);
          console.log('Message forwarded to admin');
        }
      } catch (error) {
        console.error('Error handling message:', error);
        await bot.sendMessage(msg.chat.id, '❌ Sorry, there was an error. Please try again.');
      }
    }
  });

  // Handle admin replies
  bot.onText(/\/reply (\d+) (.+)/, async (msg, match) => {
    if (msg.from.id.toString() === process.env.ADMIN_ID) {
      const userId = match[1];
      const reply = match[2];

      try {
        await bot.sendMessage(userId, 
          `💬 Response from Admin:\n\n${reply}\n\n` +
          `If you have more questions, feel free to ask!`
        );
        await bot.sendMessage(msg.chat.id, '✅ Reply sent successfully!');
      } catch (error) {
        console.error('Error sending admin reply:', error);
        await bot.sendMessage(msg.chat.id, '❌ Failed to send reply.');
      }
    }
  });
}

// API Routes
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Bot API is working!',
    timestamp: new Date().toISOString(),
    bot_status: bot ? 'Ready' : 'Not initialized',
    environment: {
      bot_token: process.env.BOT_TOKEN ? 'Set' : 'Missing',
      admin_id: process.env.ADMIN_ID ? 'Set' : 'Missing',
      supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing',
      supabase_key: process.env.SUPABASE_KEY ? 'Set' : 'Missing'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    bot_ready: !!bot,
    timestamp: new Date().toISOString() 
  });
});

app.post('/api/webhook', async (req, res) => {
  console.log('Webhook received');
  
  try {
    if (!bot) {
      throw new Error('Bot not initialized');
    }
    
    await bot.processUpdate(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/setwebhook', async (req, res) => {
  try {
    if (!bot) {
      throw new Error('Bot not initialized');
    }
    
    const webhookUrl = `https://${req.get('host')}/api/webhook`;
    await bot.setWebHook(webhookUrl);
    
    res.json({ 
      success: true, 
      webhook: webhookUrl
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Telegram Customer Support Bot',
    status: 'Running',
    bot_ready: !!bot
  });
});

module.exports = app;
