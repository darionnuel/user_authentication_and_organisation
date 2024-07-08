const express = require('express');
const { getUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router(); // Create a new router instance

// Define the route to get user details by ID
router.get('/:id', authMiddleware, getUser);

module.exports = router;
