const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const { verifyToken } = require('../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', verifyToken, userController.getProfile);
router.get('/', verifyToken, userController.getUsers);

module.exports = router;