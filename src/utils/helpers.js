class Helpers {
  // Format user mention
  formatUserMention(user) {
    const name = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
    return user.username ? `@${user.username}` : name;
  }

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Escape markdown
  escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }

  // Check if user is admin
  async isUserAdmin(bot, chatId, userId) {
    try {
      const member = await bot.getChatMember(chatId, userId);
      return ['creator', 'administrator'].includes(member.status);
    } catch (error) {
      return false;
    }
  }

  // Generate random ID
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Validate URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Extract user ID from message
  extractUserId(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Rate limiting
  rateLimiter = new Map();

  isRateLimited(userId, limit = 5, window = 60000) {
    const now = Date.now();
    const userRequests = this.rateLimiter.get(userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return true;
    }
    
    validRequests.push(now);
    this.rateLimiter.set(userId, validRequests);
    return false;
  }

  // Clean old rate limit entries
  cleanRateLimiter() {
    const now = Date.now();
    for (const [userId, requests] of this.rateLimiter.entries()) {
      const validRequests = requests.filter(time => now - time < 60000);
      if (validRequests.length === 0) {
        this.rateLimiter.delete(userId);
      } else {
        this.rateLimiter.set(userId, validRequests);
      }
    }
  }
}

module.exports = new Helpers();
