const User = require('../models/user');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'deliveryhub_default_secret_key_123';

async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;
        const existing = await User.getUserByEmail(email);
        if (existing) 
            return res.status(400).json({ message: 'Email already exists' });

        const userRole = role === 'admin' ? 'admin' : 'user';
        const newId = await User.createUser(name, email, password, userRole);
        res.status(201).json({ id: newId, message: 'User registered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await User.checkPassword(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Wrong password' });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getProfile(req, res) {
    try {
        const user = await User.getUserById(req.user.userId);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getUsers(req, res) {
    try {
        const users = await User.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { register, login, getProfile, getUsers };