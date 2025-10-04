class AutoResponseHandler {
  async checkAndRespond(bot, msg, database) {
    const messageText = msg.text.toLowerCase();
    const chatId = msg.chat.id;

    // Get all auto responses
    const { data: responses } = await database.getAutoResponses();
    
    if (!responses) return;

    // Check if message matches any trigger
    for (const response of responses) {
      if (this.messageMatchesTrigger(messageText, response.trigger)) {
        await bot.sendMessage(chatId, response.response, {
          reply_to_message_id: msg.message_id
        });
        break; // Only send one auto response per message
      }
    }
  }

  messageMatchesTrigger(message, trigger) {
    // Simple keyword matching - can be enhanced with more sophisticated matching
    const triggerWords = trigger.split(' ');
    return triggerWords.some(word => message.includes(word));
  }

  // Predefined responses for common questions
  async setupDefaultResponses(database) {
    const defaultResponses = [
      {
        trigger: 'airdrop real fake legit',
                response: '⚠️ **Airdrop Safety Notice**\n\nAlways verify airdrops through official channels:\n✅ Official website\n✅ Official social media\n✅ Community verification\n\n❌ Never share private keys\n❌ Don\'t connect wallet to suspicious sites\n\nStay safe! 🛡️'
      },
      {
        trigger: 'scam fraud fake project',
        response: '🚨 **Scam Alert Guidelines**\n\n🔍 How to identify scams:\n• Too good to be true promises\n• Urgent time pressure\n• Asking for private keys/seeds\n• Unverified team/project\n\n💡 Always DYOR (Do Your Own Research)!'
      },
      {
        trigger: 'wallet connect metamask trust',
        response: '🔐 **Wallet Security Tips**\n\n✅ Best practices:\n• Never share seed phrases\n• Use hardware wallets for large amounts\n• Verify URLs before connecting\n• Enable 2FA when possible\n\n🛡️ Your security is our priority!'
      },
      {
        trigger: 'price when moon lambo',
        response: '📈 **Price Discussion**\n\nWe don\'t provide financial advice or price predictions.\n\n💡 Remember:\n• DYOR before investing\n• Only invest what you can afford to lose\n• Market is volatile\n\nFocus on the technology and utility! 🚀'
      }
    ];

    for (const response of defaultResponses) {
      await database.addAutoResponse(response.trigger, response.response);
    }
  }
}

module.exports = new AutoResponseHandler();
