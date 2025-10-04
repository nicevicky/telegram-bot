const TelegramBot = require('node-telegram-bot-api');
const database = require('./database');
const adminHandler = require('./handlers/admin');
const customerSupportHandler = require('./handlers/customer-support');
const groupManagementHandler = require('./handlers/group-management');
const autoResponseHandler = require('./handlers/auto-responses');

const ADMIN_ID = parseInt(process.env.ADMIN_ID);
const GROUP_ID = process.env.GROUP_ID;

class TelegramCustomerSupportBot {
  constructor(token) {
    this.bot = new TelegramBot(token);
    this.adminId = ADMIN_ID;
    this.groupId = GROUP_ID;
    this.setupHandlers();
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Admin commands
    this.bot.onText(/\/admin/, async (msg) => {
      if (msg.from.id === this.adminId) {
        await adminHandler.showAdminPanel(this.bot, msg.chat.id);
      }
    });

    // Handle all messages
    this.bot.on('message', async (msg) => {
      await this.handleMessage(msg);
    });

    // Handle callback queries
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    // Handle chat join requests
    this.bot.on('chat_join_request', async (request) => {
      await this.handleJoinRequest(request);
    });

    // Handle user leaving
    this.bot.on('left_chat_member', async (msg) => {
      await this.handleUserLeft(msg);
    });
  }

  async handleStart(msg) {
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name;

    // Add user to database
    await database.addUser(userId, username, firstName, lastName);

    if (msg.chat.type === 'private') {
      await customerSupportHandler.handleStart(this.bot, msg);
    }
  }

  async handleMessage(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const messageText = msg.text;

    // Skip if no text
    if (!messageText) return;

    // Handle private messages (customer support)
    if (msg.chat.type === 'private') {
      if (userId === this.adminId) {
        await this.handleAdminPrivateMessage(msg);
      } else {
        await customerSupportHandler.handleComplaint(this.bot, msg, database);
      }
      return;
    }

    // Handle group messages
    if (chatId.toString() === this.groupId) {
      await this.handleGroupMessage(msg);
    }
  }

  async handleAdminPrivateMessage(msg) {
    const messageText = msg.text;
    
    // Check if admin is replying to a complaint
    if (messageText.startsWith('/reply ')) {
      const parts = messageText.split(' ');
      const userId = parts[1];
      const reply = parts.slice(2).join(' ');
      
      await customerSupportHandler.sendReplyToUser(this.bot, userId, reply);
      await this.bot.sendMessage(this.adminId, '✅ Reply sent successfully!');
    }
  }

  async handleGroupMessage(msg) {
    const userId = msg.from.id;
    const messageText = msg.text.toLowerCase();

    // Skip admin messages
    if (userId === this.adminId) {
      await this.handleAdminGroupCommands(msg);
      return;
    }

    // Check if group is closed
    const { data: settings } = await database.getGroupSettings();
    if (settings && settings.is_closed) {
      await this.bot.deleteMessage(msg.chat.id, msg.message_id);
      await this.bot.sendMessage(msg.chat.id, '🔒 Group is currently closed. Messages are not allowed.');
      return;
    }

    // Check for banned words
    const { data: bannedWords } = await database.getBannedWords();
    if (bannedWords) {
      const hasBannedWord = bannedWords.some(word => 
        messageText.includes(word.word)
      );
      
      if (hasBannedWord) {
        await groupManagementHandler.handleBannedWord(this.bot, msg, database);
        return;
      }
    }

    // Check for auto responses
    await autoResponseHandler.checkAndRespond(this.bot, msg, database);

    // Check for links and handle accordingly
    if (this.containsLink(messageText)) {
      await groupManagementHandler.handleLink(this.bot, msg, database);
    }
  }

  async handleAdminGroupCommands(msg) {
    const messageText = msg.text;

    if (messageText === '/closegroup') {
      await database.updateGroupSettings({ is_closed: true });
      await this.bot.sendMessage(msg.chat.id, '🔒 Group has been closed. Only admins can send messages.');
    }

    if (messageText === '/opengroup') {
      await database.updateGroupSettings({ is_closed: false });
      await this.bot.sendMessage(msg.chat.id, '🔓 Group has been opened. Users can send messages.');
    }

    // Handle other admin commands
    await adminHandler.handleGroupCommands(this.bot, msg, database);
  }

  async handleCallbackQuery(query) {
    const data = query.data;
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (userId === this.adminId) {
      await adminHandler.handleAdminCallback(this.bot, query, database);
    } else {
      await customerSupportHandler.handleUserCallback(this.bot, query, database);
    }
  }

  async handleJoinRequest(request) {
    // Auto-approve join requests
    await this.bot.approveChatJoinRequest(request.chat.id, request.from.id);
    
    // Send welcome message to user
    const welcomeMessage = `🎉 Welcome to our group! Your join request has been approved.\n\n` +
                          `Please read our rules and feel free to ask questions.\n\n` +
                          `If you need support, you can message our bot @${this.bot.options.username}`;
    
    try {
      await this.bot.sendMessage(request.from.id, welcomeMessage);
    } catch (error) {
      console.log('Could not send welcome message to user');
    }
  }

  async handleUserLeft(msg) {
    const leftUser = msg.left_chat_member;
    
    // Don't message if user was kicked/banned
    if (msg.from.id === leftUser.id) {
      const rejoinMessage = `👋 We noticed you left our group.\n\n` +
                           `If you'd like to rejoin, please click here: ${process.env.GROUP_INVITE_LINK}\n\n` +
                           `Note: Leaving and rejoining frequently may result in account restrictions by Telegram.`;
      
      try {
        await this.bot.sendMessage(leftUser.id, rejoinMessage);
      } catch (error) {
        console.log('Could not send rejoin message to user');
      }
    }
  }

  containsLink(text) {
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+)/i;
    return linkRegex.test(text);
  }

  // Method to handle webhook
  async handleWebhook(req, res) {
    try {
      await this.bot.processUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Error');
    }
  }
}

module.exports = TelegramCustomerSupportBot;
