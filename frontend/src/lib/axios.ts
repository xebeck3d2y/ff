import axios from 'axios';
import { API_CONFIG } from '@/config/api';

const axiosInstance = axios.create({
  ...API_CONFIG,
  timeout: 10000, // 10 secondes timeout
  headers: {
    ...API_CONFIG.headers,
    'Accept': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      return Promise.reject(new Error('La requête a pris trop de temps, veuillez réessayer.'));
    }

    if (!error.response) {
      console.error('Network Error:', error);
      return Promise.reject(new Error('Erreur de connexion au serveur. Vérifiez que le serveur backend est en cours d\'exécution.'));
    }

    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Ne supprimer le token que si ce n'est pas une tentative de login/register
      const isAuthEndpoint = error.config.url.includes('/auth/login') || 
                            error.config.url.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        // Rediriger seulement si on n'est pas déjà sur la page de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


