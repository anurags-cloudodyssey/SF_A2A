const authService = require('../services/authService');

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // 1. Call External Login API
    const loginResponse = await authService.login(username, password);

    if (loginResponse && loginResponse.message && loginResponse.message.includes('Login successful')) {
      
      // 2. Retrieve User Data from Supabase
      try {
        const userProfiles = await authService.getUserProfile(username);

        if (userProfiles && userProfiles.length > 0) {
          const userProfile = userProfiles[0];
          
          const { family_members, ...userFields } = userProfile;
          
          const formattedData = {
            user_profiles: userFields,
            family_members: family_members || []
          };

          res.status(200).json({
            message: 'Login successful',
            user: {
              name: userFields.full_name || userFields.name,
              email: userFields.email,
              phone: userFields.phone
            },
            preferences: formattedData
          });
        } else {
          // Login successful but no profile found
          res.status(200).json({
            message: 'Login successful',
            user: { email: username },
            preferences: null
          });
        }
      } catch (supabaseError) {
        console.error('Supabase Fetch Error:', supabaseError.message);
        // Return success for login even if profile fetch fails, but warn client
        res.status(200).json({
            message: 'Login successful',
            user: { email: username },
            preferences: null,
            warning: 'Could not fetch user profile'
        });
      }

    } else {
      res.status(401).json({ message: loginResponse.message || 'Login failed' });
    }

  } catch (error) {
    console.error('Login Controller Error:', error.message);
    res.status(500).json({ message: 'Login failed', details: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const userProfiles = await authService.getUserProfile(email);

    if (userProfiles && userProfiles.length > 0) {
      const userProfile = userProfiles[0];
      const { family_members, ...userFields } = userProfile;
      
      const formattedData = {
        user_profiles: userFields,
        family_members: family_members || []
      };

      res.status(200).json(formattedData);
    } else {
      res.status(404).json({ message: 'User profile not found' });
    }
  } catch (error) {
    console.error('Get User Profile Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch user profile', details: error.message });
  }
};

exports.signupUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const userData = [{
      full_name: name,
      email: email,
      phone: phone,
      password: password
    }];

    const response = await authService.signup(userData);

    if (response.status === 201) {
      res.status(201).json({ message: 'User created successfully', user: response.data });
    } else {
      res.status(response.status).json({ message: 'Failed to create user', details: response.data });
    }
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('Signup Error:', errorData);

    if (errorData && (errorData.code === '23505' || (errorData.message && errorData.message.includes('duplicate key')))) {
      return res.status(409).json({ message: 'User already exists', details: errorData });
    }

    res.status(500).json({ error: 'Signup failed', details: errorData });
  }
};
