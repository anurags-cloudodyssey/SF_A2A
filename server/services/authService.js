const axios = require('axios');
const { LOGIN_API_URL } = require('../config/api');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Helper for Supabase headers
const getSupabaseHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
});

exports.login = async (username, password) => {
  try {
    const response = await axios.post(LOGIN_API_URL, { username, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'External login failed');
  }
};

exports.getUserProfile = async (email) => {
  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      params: {
        select: '*,family_members(*)',
        email: `eq.${email}`
      },
      headers: getSupabaseHeaders()
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
  }
};

exports.signup = async (userData) => {
  try {
    const response = await axios.post(`${SUPABASE_URL}/rest/v1/users`, userData, {
      headers: {
        ...getSupabaseHeaders(),
        'Prefer': 'return=representation'
      }
    });
    return response;
  } catch (error) {
    throw error; // Let controller handle specific error codes like 409
  }
};
