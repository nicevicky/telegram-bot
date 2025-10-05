const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
let supabase;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  }
} catch (error) {
  console.error('Supabase initialization error:', error);
}

// Simple database functions
const database = {
  async addUser(userId, username, firstName, lastName) {
    if (!supabase) return { data: null, error: 'Database not initialized' };
    
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
      return { data: null, error: error.message };
    }
  },

  async addComplaint(userId, message, username) {
    if (!supabase) return { data: [{ id: Math.floor(Math.random() * 1000) }], error: null };
    
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
      return { data: [{ id: Math.floor(Math.random() * 1000) }], error: null };
    }
  }
};

module.exports = async (req, res) => {
  console.log('Webhook received:', req.method, JSON.stringify(req.body, null, 2));
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN is required');
    }

    const bot = new TelegramBot(process.env.BOT_TOKEN);
    const update = req.body;

    // Handle different update types
    if (update.message) {
      await handleMessage(bot, update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(bot, update.callback_query);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

async function handleMessage(bot, msg) {
  console.log('Processing message from:', msg.from.id, 'Text:', msg.text);

  // Handle /start command
  if (msg.text === '/start') {
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
    return;
  }

  // Handle admin replies
  if (msg.text && msg.text.startsWith('/reply ') && msg.from.id.toString() === process.env.ADMIN_ID) {
    const parts = msg.text.split(' ');
    const userId = parts[1];
    const reply = parts.slice(2).join(' ');

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
    return;
  }

  // Handle regular messages (complaints)
  if (msg.chat.type === 'private' && msg.text && !msg.text.startsWith('/')) {
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
}

async function handleCallbackQuery(bot, query) {
  // Handle callback queries here
  await bot.answerCallbackQuery(query.id);
}
