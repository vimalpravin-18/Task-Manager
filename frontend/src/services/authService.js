import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Set auth token for all requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
    const response = await axios.get(`${API_URL}/me`);
    return response;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// Register user
const register = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password,
    });
    return response;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Login user
const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
  
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setAuthToken(response.data.token);
    }
  
    return response;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// Social login
const socialLogin = async (name, email) => {
  try {
    const response = await axios.post(`${API_URL}/social-login`, {
      name,
      email,
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setAuthToken(response.data.token);
    }
    
    return response;
  } catch (error) {
    console.error('Error with social login:', error);
    throw error;
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenTimestamp');
  setAuthToken(null);
};

// Get user preferences
const getPreferences = async () => {
  try {
    const response = await axios.get(`${API_URL}/preferences`);
    return response;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    throw error;
  }
};

// Save user preferences
const savePreferences = async (preferences) => {
  try {
    const response = await axios.put(`${API_URL}/preferences`, preferences);
    return response;
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};
// Update profile
const updateProfile = async (userData) => {
  try {
    const response = await axios.put(`${API_URL}/profile`, userData);
    return response;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Update password
const updatePassword = async (passwordData) => {
  try {
    const response = await axios.put(`${API_URL}/password`, passwordData);
    return response;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Delete account
const deleteAccount = async () => {
  try {
    const response = await axios.delete(`${API_URL}/account`);
    return response;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

const authService = {
  getCurrentUser,
  register,
  login,
  socialLogin,
  logout,
  setAuthToken,
  getPreferences,
  savePreferences,
  updateProfile,
  updatePassword,
  deleteAccount,
};

export default authService;
