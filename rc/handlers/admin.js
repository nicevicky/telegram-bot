const keyboards = require('../utils/keyboards');

class AdminHandler {
  async showAdminPanel(bot, chatId) {
    const adminMessage = `🔧 Admin Control Panel\n\n` +
                        `Welcome to the admin dashboard. Choose an option:`;

    const keyboard = keyboards.getAdminKeyboard();
    
    await bot.sendMessage(chatId, adminMessage, {
      reply_markup: keyboard
    });
  }

  async handleAdminCallback(bot, query, database) {
    const data = query.data;
    const chatId = query.message.chat.id;

    switch (data) {
      case 'admin_complaints':
        await this.showPendingComplaints(bot, chatId, database);
        break;

      case 'admin_banned_words':
        await this.manageBannedWords(bot, chatId, database);
        break;

      case 'admin_auto_responses':
        await this.manageAutoResponses(bot, chatId, database);
        break;

      case 'admin_group_settings':
        await this.showGroupSettings(bot, chatId, database);
        break;

      case 'admin_statistics':
        await this.showStatistics(bot, chatId, database);
        break;

      default:
        if (data.startsWith('reply_complaint_')) {
          const complaintId = data.split('_')[2];
          await this.promptComplaintReply(bot, chatId, complaintId);
        } else if (data.startsWith('close_complaint_')) {
          const complaintId = data.split('_')[2];
          await this.closeComplaint(bot, chatId, complaintId, database);
        }
        break;
    }

    await bot.answerCallbackQuery(query.id);
  }

  async showPendingComplaints(bot, chatId, database) {
    // Implementation for showing pending complaints
    const message = `📋 Pending Complaints\n\n` +
                   `Here you can see all pending customer complaints.`;
    
    await bot.sendMessage(chatId, message);
  }

  async manageBannedWords(bot, chatId, database) {
    const { data: bannedWords } = await database.getBannedWords();
    
    let message = `🚫 Banned Words Management\n\n`;
    
    if (bannedWords && bannedWords.length > 0) {
      message += `Current banned words:\n`;
      bannedWords.forEach((word, index) => {
        message += `${index + 1}. ${word.word}\n`;
      });
    } else {
      message += `No banned words set.`;
    }
    
    message += `\n\nTo add a banned word: /addban <word>\n`;
    message += `To remove a banned word: /removeban <word>`;

    await bot.sendMessage(chatId, message);
  }

  async manageAutoResponses(bot, chatId, database) {
    const { data: responses } = await database.getAutoResponses();
    
    let message = `🤖 Auto Responses Management\n\n`;
    
    if (responses && responses.length > 0) {
      message += `Current auto responses:\n`;
      responses.forEach((response, index) => {
        message += `${index + 1}. Trigger: "${response.trigger}"\n`;
        message += `   Response: "${response.response}"\n\n`;
      });
    } else {
      message += `No auto responses set.`;
    }
    
    message += `\nTo add auto response: /addresponse <trigger> | <response>\n`;
    message += `To remove auto response: /removeresponse <trigger>`;

    await bot.sendMessage(chatId, message);
  }

  async showGroupSettings(bot, chatId, database) {
    const { data: settings } = await database.getGroupSettings();
    
    const message = `⚙️ Group Settings\n\n` +
                   `Group Status: ${settings?.is_closed ? '🔒 Closed' : '🔓 Open'}\n` +
                   `Max Warnings: ${settings?.max_warnings || 3}\n` +
                   `Mute Duration: ${settings?.mute_duration || 60} minutes\n\n` +
                   `Commands:\n` +
                   `/closegroup - Close group\n` +
                   `/opengroup - Open group\n` +
                   `/setwarnings <number> - Set max warnings\n` +
                   `/setmute <minutes> - Set mute duration`;

    await bot.sendMessage(chatId, message);
  }

  async showStatistics(bot, chatId, database) {
    // Implementation for showing bot statistics
    const message = `📊 Bot Statistics\n\n` +
                   `This will show various statistics about bot usage.`;
    
    await bot.sendMessage(chatId, message);
  }

  async handleGroupCommands(bot, msg, database) {
    const messageText = msg.text;
    const chatId = msg.chat.id;

    // Handle various admin commands in group
    if (messageText.startsWith('/addban ')) {
      const word = messageText.split(' ')[1];
      await database.addBannedWord(word);
      await bot.sendMessage(chatId, `✅ Added "${word}" to banned words list.`);
    }

    if (messageText.startsWith('/removeban ')) {
      const word = messageText.split(' ')[1];
      await database.removeBannedWord(word);
      await bot.sendMessage(chatId, `✅ Removed "${word}" from banned words list.`);
    }

    if (messageText.startsWith('/addresponse ')) {
      const parts = messageText.substring(13).split(' | ');
      if (parts.length === 2) {
        await database.addAutoResponse(parts[0], parts[1]);
        await bot.sendMessage(chatId, `✅ Added auto response for trigger "${parts[0]}".`);
      }
    }

    // Add more command handlers as needed
  }

  async promptComplaintReply(bot, chatId, complaintId) {
    await bot.sendMessage(chatId, 
      `📝 Reply to complaint #${complaintId}\n\n` +
      `Please send your reply in the format:\n` +
      `/reply <user_id> Your response here`
    );
  }

  async closeComplaint(bot, chatId, complaintId, database) {
    await database.updateComplaintStatus(complaintId, 'closed');
    await bot.sendMessage(chatId, `✅ Complaint #${complaintId} has been closed.`);
  }
}

module.exports = new AdminHandler();
