import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied by Vite to localhost:5000
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
