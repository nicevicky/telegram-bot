class Keyboards {
  getMainMenuKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '📝 New Complaint', callback_data: 'new_complaint' },
          { text: '📋 Check Status', callback_data: 'check_status' }
        ],
        [
          { text: '📞 Contact Info', callback_data: 'contact_info' },
          { text: '❓ FAQ', callback_data: 'faq' }
        ],
        [
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
  }

  getAdminKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '📋 Complaints', callback_data: 'admin_complaints' },
          { text: '🚫 Banned Words', callback_data: 'admin_banned_words' }
        ],
        [
          { text: '🤖 Auto Responses', callback_data: 'admin_auto_responses' },
          { text: '⚙️ Group Settings', callback_data: 'admin_group_settings' }
        ],
        [
          { text: '📊 Statistics', callback_data: 'admin_statistics' },
          { text: '👥 User Management', callback_data: 'admin_users' }
        ],
        [
          { text: '📢 Broadcast', callback_data: 'admin_broadcast' },
          { text: '🔧 Bot Settings', callback_data: 'admin_bot_settings' }
        ]
      ]
    };
  }

  getComplaintAdminKeyboard(complaintId, userId) {
    return {
      inline_keyboard: [
        [
          { text: '💬 Reply', callback_data: `reply_complaint_${complaintId}` },
          { text: '✅ Close', callback_data: `close_complaint_${complaintId}` }
        ],
        [
          { text: '👤 User Info', callback_data: `user_info_${userId}` },
          { text: '📋 User History', callback_data: `user_history_${userId}` }
        ]
      ]
    };
  }

  getGroupModerationKeyboard(userId) {
    return {
      inline_keyboard: [
        [
          { text: '⚠️ Warn', callback_data: `warn_${userId}` },
          { text: '🔇 Mute', callback_data: `mute_${userId}` }
        ],
        [
          { text: '👢 Kick', callback_data: `kick_${userId}` },
          { text: '🚫 Ban', callback_data: `ban_${userId}` }
        ],
        [
          { text: '📋 User Info', callback_data: `info_${userId}` }
        ]
      ]
    };
  }

  getBroadcastKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: '📢 All Users', callback_data: 'broadcast_all' },
          { text: '👥 Group Only', callback_data: 'broadcast_group' }
        ],
        [
          { text: '📝 Custom Message', callback_data: 'broadcast_custom' },
          { text: '❌ Cancel', callback_data: 'broadcast_cancel' }
        ]
      ]
    };
  }

  getConfirmationKeyboard(action, targetId) {
    return {
      inline_keyboard: [
        [
          { text: '✅ Confirm', callback_data: `confirm_${action}_${targetId}` },
          { text: '❌ Cancel', callback_data: `cancel_${action}` }
        ]
      ]
    };
  }
}

module.exports = new Keyboards();
