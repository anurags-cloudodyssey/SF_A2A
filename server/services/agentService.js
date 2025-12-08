const axios = require('axios');
const {
  PUBLIC_DATA_AGENT_URL,
  PREFERENCE_CREATE_AGENT_URL,
  CALENDAR_AGENT_URL,
  PREFERENCE_QUERY_AGENT_URL,
  GIFT_RECOMMEND_AGENT_URL,
} = require('../config/api');
const { 
  PUBLIC_DATA_PROMPT, 
  PREFERENCE_CREATE_PROMPT,
  PREFERENCE_QUERY_PROMPT,
  GIFT_RECOMMEND_PROMPT
} = require('../config/prompts');
const { createRpcBody, parseAgentResponse, getAgentResponseText } = require('../utils/agentHelper');

// Helper to handle errors
const handleRequest = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = errorData.message || JSON.stringify(errorData);
      throw new Error(errorMessage);
    }
    throw error;
  }
};

exports.getPublicData = async (email, name, phone) => {
  const prompt = PUBLIC_DATA_PROMPT(name, phone);
  const rpcBody = createRpcBody(prompt);
  
  const rawResponse = await handleRequest(axios.post(PUBLIC_DATA_AGENT_URL, rpcBody));
  
  const parsedData = parseAgentResponse(rawResponse);
  if (!parsedData) {
    console.warn('Failed to parse JSON from Public Data Agent response');
    return rawResponse; 
  }
  return parsedData;
};

exports.savePreferences = async (preferenceData) => {
  const jsonString = JSON.stringify(preferenceData, null, 2);
  const prompt = PREFERENCE_CREATE_PROMPT(jsonString);
  const rpcBody = createRpcBody(prompt);

  const rawResponse = await handleRequest(axios.post(PREFERENCE_CREATE_AGENT_URL, rpcBody));
  
  const textContent = getAgentResponseText(rawResponse);
  if (textContent && (
      textContent.toLowerCase().includes('conflict') || 
      textContent.toLowerCase().includes('error') || 
      textContent.includes('409') ||
      textContent.includes('500')
    )) {
    throw new Error(`Agent Error: ${textContent}`);
  }

  return rawResponse;
};

exports.fetchCalendarEvents = async (rpcBody) => {
  return handleRequest(axios.post(CALENDAR_AGENT_URL, rpcBody));
};

exports.queryPreferences = async (data) => {
  const { phone, eventSummary, eventLocation } = data;
  const location = eventLocation || "Hyderabad"; 
  const summary = eventSummary || "celebration";

  const prompt = PREFERENCE_QUERY_PROMPT(phone, summary, location);
  const rpcBody = createRpcBody(prompt);

  return handleRequest(axios.post(PREFERENCE_QUERY_AGENT_URL, rpcBody));
};

exports.getGiftRecommendations = async (data) => {
  const { events, preferences, recommendations } = data;
  
  const userProfile = preferences?.user_profiles || {};
  const familyMembers = preferences?.family_members || [];

  const prompt = GIFT_RECOMMEND_PROMPT(events, userProfile, familyMembers);
  const rpcBody = createRpcBody(prompt);

  const rawResponse = await handleRequest(axios.post(GIFT_RECOMMEND_AGENT_URL, rpcBody));

  const parsedData = parseAgentResponse(rawResponse);
  if (!parsedData) {
    console.warn('Failed to parse JSON from Gift Recommendation Agent response');
    return rawResponse;
  }
  return parsedData;
};
