const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authController = require('../controllers/authController');

// Define routes mapping to the controller functions

// 0. Auth
router.post('/signup', authController.signupUser);

// 1. Public Data Agent
router.post('/public-data', agentController.getPublicData);

// 2. Preference Create Agent
router.post('/preferences', agentController.savePreferences);

// 3. Calendar Agent
router.post('/calendar/events', agentController.getCalendarEvents);

// 3c. Preference Query Agent
router.post('/recommendations/query', agentController.getRecommendations);

// 4. Gift Recommendation Agent
router.post('/recommendations/gifts', agentController.getGiftIdeas);

module.exports = router;
