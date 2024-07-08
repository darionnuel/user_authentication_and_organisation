const express = require('express');
const {
  getOrganisations,
  getOrganisationById,
  createOrganisation,
  addUserToOrganisation,
} = require('../controllers/organisationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router(); // Create a new router instance

// Define the route to get all organisations
router.get('/', authMiddleware, getOrganisations);

router.get('/:orgId', authMiddleware, getOrganisationById);

// Define the route to create a new organisation
router.post('/', authMiddleware, createOrganisation);

// Define the route to add a user to an organisation
router.post('/:orgId/users', authMiddleware, addUserToOrganisation);

module.exports = router;
