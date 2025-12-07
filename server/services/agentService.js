const axios = require('axios');
const {
  PUBLIC_DATA_AGENT_URL,
  PREFERENCE_CREATE_AGENT_URL,
  CALENDAR_AGENT_URL,
  PREFERENCE_QUERY_AGENT_URL,
  GIFT_RECOMMEND_AGENT_URL,
} = require('../config/api');
const { PUBLIC_DATA_PROMPT, PREFERENCE_CREATE_PROMPT } = require('../config/prompts');
const { createRpcBody, parseAgentResponse, getAgentResponseText } = require('../utils/agentHelper');

// Helper to handle errors
const handleRequest = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw error;
  }
};

/**
 * Fetches public data for a user.
 * Encapsulates prompt generation and response parsing.
 */
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

/**
 * Saves user preferences to Supabase.
 * Encapsulates prompt generation and error checking.
 */
exports.savePreferences = async (preferenceData) => {
  const jsonString = JSON.stringify(preferenceData, null, 2);
  const prompt = PREFERENCE_CREATE_PROMPT(jsonString);
  const rpcBody = createRpcBody(prompt);

  const rawResponse = await handleRequest(axios.post(PREFERENCE_CREATE_AGENT_URL, rpcBody));
  
  // Check for business logic errors (like 409 Conflict) in the text response
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

  const prompt = `For the user with phone number ${phone}, I am planning a ${summary} celebration in a specific region of ${location}; provide detailed region-specific recommendations including the best hotels (with price range, capacity, ambience, suitability), top dining options (cuisine, cost for two, ambience, celebration features), nearby shopping options (malls, markets, boutiques), suitable celebration themes/venue types, suggestions across premium/mid-range/affordable budgets, and details on travel convenience, nearest metro, parking, and safety.`;

  const rpcBody = {
    "jsonrpc": "2.0",
    "id": "task124",
    "method": "tasks/send",
    "params": {
      "sessionId": "session456",
      "message": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": prompt
          }
        ]
      }
    }
  };

  return handleRequest(axios.post(PREFERENCE_QUERY_AGENT_URL, rpcBody));
};

exports.getGiftRecommendations = async (data) => {
  const { events, preferences, recommendations } = data;
  // Extract text from the previous recommendations (Agent response)
  // Use helper if available, otherwise fallback to stringify
  let recText = '';
  try {
    recText = getAgentResponseText(recommendations) || JSON.stringify(recommendations);
  } catch (e) {
    recText = JSON.stringify(recommendations);
  }

  // Extract user profile and family members
  const userProfile = preferences?.user_profiles || {};
  const familyMembers = preferences?.family_members || [];

  const prompt = `Based on the following details, suggest personalized gift ideas: Events: ${JSON.stringify(events)} User Profile: ${JSON.stringify(userProfile)} Family Members: ${JSON.stringify(familyMembers)} Provide a list of thoughtful and unique gift ideas that align with the user's interests and the nature of the events. Include brief descriptions and reasons why each gift would be suitable.`;
  const rpcBody = createRpcBody(prompt);
  
  console.log('Gift Recommendation Prompt:', prompt);

  const rawResponse = await handleRequest(axios.post(GIFT_RECOMMEND_AGENT_URL, rpcBody));

  const parsedData = parseAgentResponse(rawResponse);
  if (!parsedData) {
    console.warn('Failed to parse JSON from Gift Recommendation Agent response');
    return rawResponse;
  }
  return parsedData;
};
