const axios = require('axios');

const SUPABASE_URL = 'https://bpcpgzvqyaasjnssbslq.supabase.co/rest/v1/users';
const SUPABASE_KEY = 'sb_secret_6JgBFL2pG2z8r9jguBzXyA_yl_VxU8b';

exports.signupUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Construct the request body for Supabase
    // User requested body format: [{ "full_name": ..., "email": ..., "phone": ..., "password": ... }]
    const userData = [{
      full_name: name,
      email: email,
      phone: phone,
      password: password
    }];

    const response = await axios.post(SUPABASE_URL, userData, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (response.status === 201) {
      res.status(201).json({ message: 'User created successfully', user: response.data });
    } else {
      res.status(response.status).json({ message: 'Failed to create user', details: response.data });
    }
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('Signup Error:', errorData);

    // Handle duplicate email error (Supabase/Postgres unique constraint violation)
    if (errorData && (errorData.code === '23505' || (errorData.message && errorData.message.includes('duplicate key')))) {
      return res.status(409).json({ message: 'User already exists', details: errorData });
    }

    res.status(500).json({ error: 'Signup failed', details: errorData });
  }
};
