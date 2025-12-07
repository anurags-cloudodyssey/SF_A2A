const agentService = require('../services/agentService');

// 1. Public Data Agent
exports.getPublicData = async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and Name are required' });
    }
    
    const data = await agentService.getPublicData(email, name, phone);
    res.json(data);
  } catch (error) {
    console.error('Error fetching public data:', error);
    res.status(500).json({ error: 'Failed to fetch public data', details: error.message });
  }
};

// 2. Preference Create Agent
exports.savePreferences = async (req, res) => {
  try {
    const preferenceData = req.body;
    const result = await agentService.savePreferences(preferenceData);
    res.json(result);
  } catch (error) {
    console.error('Error saving preferences:', error.message);
    // If the record already exists (Conflict/409), we treat it as a success for the user flow
    if (error.message.includes('Conflict') || error.message.includes('409')) {
        console.log('Record already exists, proceeding as success.');
        return res.json({ status: 'success', message: 'Preferences already saved.' });
    }
    res.status(500).json({ error: 'Failed to save preferences', details: error.message });
  }
};

// 3. Calendar Agent
exports.getCalendarEvents = async (req, res) => {
  try {
    const rpcBody = req.body;
    const events = await agentService.fetchCalendarEvents(rpcBody);
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events', details: error.message });
  }
};

// 3c. Preference Query Agent
exports.getRecommendations = async (req, res) => {
  try {
    const { phone, event_summary, event_location } = req.body;
    const data = {
        phone,
        eventSummary: event_summary,
        eventLocation: event_location
    };
    const recommendations = await agentService.queryPreferences(data);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations', details: error.message });
  }
};

// 4. Gift Recommendation Agent
exports.getGiftIdeas = async (req, res) => {
  try {
    const { events, preferences, recommendations } = req.body;
    const giftIdeas = await agentService.getGiftRecommendations({ events, preferences, recommendations });
    res.json(giftIdeas);
  } catch (error) {
    console.error('Error getting gift ideas:', error);
    res.status(500).json({ error: 'Failed to get gift ideas', details: error.message });
  }
};
