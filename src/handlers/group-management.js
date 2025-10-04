class GroupManagementHandler {
  async handleBannedWord(bot, msg, database) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Delete the message
    await bot.deleteMessage(chatId, msg.message_id);

    // Add warning
    await database.addWarning(userId, 'Used banned word');

    // Get user warnings
    const { data: warnings } = await database.getUserWarnings(userId);
    const warningCount = warnings ? warnings.length : 0;

    // Get max warnings setting
    const { data: settings } = await database.getGroupSettings();
    const maxWarnings = settings?.max_warnings || 3;

    if (warningCount >= maxWarnings) {
      // Mute user
      const muteDuration = settings?.mute_duration || 60; // minutes
      const muteUntil = new Date(Date.now() + muteDuration * 60 * 1000);

      try {
        await bot.restrictChatMember(chatId, userId, {
          until_date: Math.floor(muteUntil.getTime() / 1000),
          can_send_messages: false
        });

        await bot.sendMessage(chatId, 
          `🔇 @${msg.from.username || msg.from.first_name} has been muted for ${muteDuration} minutes due to repeated violations.`
        );

        // Clear warnings after mute
        await database.clearUserWarnings(userId);
      } catch (error) {
        console.error('Error muting user:', error);
      }
    } else {
      await bot.sendMessage(chatId, 
        `⚠️ @${msg.from.username || msg.from.first_name}, please avoid using banned words. Warning ${warningCount}/${maxWarnings}`
      );
    }
  }

  async handleLink(bot, msg, database) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Delete the message with link
    await bot.deleteMessage(chatId, msg.message_id);

    // Add warning
    await database.addWarning(userId, 'Posted unauthorized link');

    await bot.sendMessage(chatId, 
      `🔗 @${msg.from.username || msg.from.first_name}, unauthorized links are not allowed. Message deleted.`
    );
  }

  async kickUser(bot, chatId, userId, reason) {
    try {
      await bot.kickChatMember(chatId, userId);
      await bot.unbanChatMember(chatId, userId); // Unban immediately so they can rejoin
      return true;
    } catch (error) {
      console.error('Error kicking user:', error);
      return false;
    }
  }

  async banUser(bot, chatId, userId, reason) {
    try {
      await bot.kickChatMember(chatId, userId);
      return true;
    } catch (error) {
      console.error('Error banning user:', error);
      return false;
    }
  }
}

module.exports = new GroupManagementHandler();
