require('dotenv').config();

module.exports = {
  PUBLIC_DATA_AGENT_URL: process.env.PUBLIC_DATA_AGENT_URL || 'https://openai-agent-app-tb5gn1.7g6hwo.usux.e2.cloudhub.io/public-data-agent',
  PREFERENCE_CREATE_AGENT_URL: process.env.PREFERENCE_CREATE_AGENT_URL || 'https://preference-agent-app-tb5gn1.7g6hwo.usux.e2.cloudhub.io/preference-agent',
  CALENDAR_AGENT_URL: process.env.CALENDAR_AGENT_URL || 'https://calendar-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/calendar-agent',
  PREFERENCE_QUERY_AGENT_URL: process.env.PREFERENCE_QUERY_AGENT_URL || 'https://preference-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/preference-agent',
  GIFT_RECOMMEND_AGENT_URL: process.env.GIFT_RECOMMEND_AGENT_URL || 'https://open-ai-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/public-data-agent',
  LOGIN_API_URL: process.env.LOGIN_API_URL || 'https://demojam-login-management-api-bt5gn1.7y6hwo.usa-e2.cloudhub.io/check/login',
};