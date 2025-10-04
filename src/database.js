const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

class Database {
  // Initialize database tables
  async initTables() {
    // Users table
    await supabase.rpc('create_users_table');
    
    // Complaints table
    await supabase.rpc('create_complaints_table');
    
    // Banned words table
    await supabase.rpc('create_banned_words_table');
    
    // Auto responses table
    await supabase.rpc('create_auto_responses_table');
    
    // User warnings table
    await supabase.rpc('create_user_warnings_table');
    
    // Group settings table
    await supabase.rpc('create_group_settings_table');
  }

  // User management
  async addUser(userId, username, firstName, lastName) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        user_id: userId,
        username: username,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date()
      });
    return { data, error };
  }

  async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  }

  // Complaints management
  async addComplaint(userId, message, username) {
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        user_id: userId,
        username: username,
        message: message,
        status: 'pending',
        created_at: new Date()
      });
    return { data, error };
  }

  async getComplaint(complaintId) {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .single();
    return { data, error };
  }

  async updateComplaintStatus(complaintId, status) {
    const { data, error } = await supabase
      .from('complaints')
      .update({ status: status })
      .eq('id', complaintId);
    return { data, error };
  }

  // Banned words management
  async addBannedWord(word) {
    const { data, error } = await supabase
      .from('banned_words')
      .insert({ word: word.toLowerCase() });
    return { data, error };
  }

  async getBannedWords() {
    const { data, error } = await supabase
      .from('banned_words')
      .select('word');
    return { data, error };
  }

  async removeBannedWord(word) {
    const { data, error } = await supabase
      .from('banned_words')
      .delete()
      .eq('word', word.toLowerCase());
    return { data, error };
  }

  // Auto responses management
  async addAutoResponse(trigger, response) {
    const { data, error } = await supabase
      .from('auto_responses')
      .insert({
        trigger: trigger.toLowerCase(),
        response: response
      });
    return { data, error };
  }

  async getAutoResponses() {
    const { data, error } = await supabase
      .from('auto_responses')
      .select('*');
    return { data, error };
  }

  async removeAutoResponse(trigger) {
    const { data, error } = await supabase
      .from('auto_responses')
      .delete()
      .eq('trigger', trigger.toLowerCase());
    return { data, error };
  }

  // User warnings management
  async addWarning(userId, reason) {
    const { data, error } = await supabase
      .from('user_warnings')
      .insert({
        user_id: userId,
        reason: reason,
        created_at: new Date()
      });
    return { data, error };
  }

  async getUserWarnings(userId) {
    const { data, error } = await supabase
      .from('user_warnings')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  }

  async clearUserWarnings(userId) {
    const { data, error } = await supabase
      .from('user_warnings')
      .delete()
      .eq('user_id', userId);
    return { data, error };
  }

  // Group settings management
  async getGroupSettings() {
    const { data, error } = await supabase
      .from('group_settings')
      .select('*')
      .single();
    return { data, error };
  }

  async updateGroupSettings(settings) {
    const { data, error } = await supabase
      .from('group_settings')
      .upsert(settings);
    return { data, error };
  }
}

module.exports = new Database();
