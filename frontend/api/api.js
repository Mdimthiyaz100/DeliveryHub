import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || (
        import.meta.env.DEV
            ? 'http://localhost:5000/api'
            : 'https://deliveryhub-server.onrender.com/api'
    ),
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
            // Token is invalid or expired
            const role = (localStorage.getItem('role') || '').toLowerCase();
            if (localStorage.getItem('token')) {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('user');
                if (role === 'admin') {
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
