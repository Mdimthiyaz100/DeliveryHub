import axios from 'axios';

// Use environment variable if set, otherwise fallback to local server or deployed server
const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://deliveryhub-server.onrender.com/api');

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Do not immediately redirect on role-forbidden actions (e.g. 403 trying to delete admin)
            // Only redirect if it's token expiration/invalidity
            const msg = error.response.data?.message || '';
            const isInvalidToken = msg.toLowerCase().includes('token') || msg.toLowerCase().includes('unauthorized');
            
            if (isInvalidToken && localStorage.getItem('token')) {
                const role = (localStorage.getItem('role') || '').toLowerCase();
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('user');
                if (role === 'admin' || role === 'super_admin') {
                    window.location.href = '/admin/login';
                } else {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
