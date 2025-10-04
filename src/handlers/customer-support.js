const keyboards = require('../utils/keyboards');

class CustomerSupportHandler {
  async handleStart(bot, msg) {
    const welcomeMessage = `👋 Welcome to our Customer Support Bot!\n\n` +
                          `🎯 How can we help you today?\n\n` +
                          `Please choose an option below or write your complaint/question and we'll get back to you soon!`;

    const keyboard = keyboards.getMainMenuKeyboard();
    
    await bot.sendMessage(msg.chat.id, welcomeMessage, {
      reply_markup: keyboard
    });
  }

  async handleComplaint(bot, msg, database) {
    const userId = msg.from.id;
    const username = msg.from.username || 'No username';
    const messageText = msg.text;

    // Save complaint to database
    const { data, error } = await database.addComplaint(userId, messageText, username);
    
    if (error) {
      await bot.sendMessage(msg.chat.id, '❌ Sorry, there was an error submitting your complaint. Please try again.');
      return;
    }

    // Send confirmation to user
    await bot.sendMessage(msg.chat.id, 
      `✅ Thank you for your message!\n\n` +
      `📝 Your complaint has been recorded with ID: #${data[0].id}\n\n` +
      `👨‍💼 Our admin will review and respond to you shortly.\n\n` +
      `⏰ Average response time: 2-24 hours`
    );

    // Notify admin
    const adminMessage = `🔔 New Customer Complaint\n\n` +
                        `👤 User: @${username} (${userId})\n` +
                        `📝 Message: ${messageText}\n` +
                        `🆔 Complaint ID: #${data[0].id}\n\n` +
                        `To reply: /reply ${userId} Your response here`;

    const adminKeyboard = keyboards.getComplaintAdminKeyboard(data[0].id, userId);
    
    await bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
      reply_markup: adminKeyboard
    });
  }

  async sendReplyToUser(bot, userId, reply) {
    const replyMessage = `💬 Response from Admin:\n\n${reply}\n\n` +
                        `If you have more questions, feel free to ask!`;
    
    try {
      await bot.sendMessage(userId, replyMessage);
      return true;
    } catch (error) {
      console.error('Error sending reply to user:', error);
      return false;
    }
  }

  async handleUserCallback(bot, query, database) {
    const data = query.data;
    const chatId = query.message.chat.id;

    switch (data) {
      case 'new_complaint':
        await bot.sendMessage(chatId, 
          `📝 Please write your complaint or question below:\n\n` +
          `💡 Be as detailed as possible so we can help you better!`
        );
        break;

      case 'check_status':
        await this.showUserComplaints(bot, chatId, query.from.id, database);
        break;

      case 'contact_info':
        await this.showContactInfo(bot, chatId);
        break;

      case 'faq':
        await this.showFAQ(bot, chatId);
        break;
    }

    await bot.answerCallbackQuery(query.id);
  }

  async showUserComplaints(bot, chatId, userId, database) {
    // Implementation for showing user's complaint history
    const message = `📋 Your recent complaints:\n\n` +
                   `This feature will show your complaint history and status.`;
    
    await bot.sendMessage(chatId, message);
  }

  async showContactInfo(bot, chatId) {
    const contactMessage = `📞 Contact Information\n\n` +
                          `🤖 Bot Support: Available 24/7\n` +
                          `👨‍💼 Admin: @admin_username\n` +
                          `📧 Email: support@example.com\n` +
                          `🌐 Website: https://example.com`;

    await bot.sendMessage(chatId, contactMessage);
  }

  async showFAQ(bot, chatId) {
    const faqMessage = `❓ Frequently Asked Questions\n\n` +
                      `Q: How long does it take to get a response?\n` +
                      `A: Usually within 2-24 hours.\n\n` +
                      `Q: Can I track my complaint?\n` +
                      `A: Yes, use the "Check Status" button.\n\n` +
                      `Q: Is this service free?\n` +
                      `A: Yes, our support is completely free!`;

    await bot.sendMessage(chatId, faqMessage);
  }
}

module.exports = new CustomerSupportHandler();
