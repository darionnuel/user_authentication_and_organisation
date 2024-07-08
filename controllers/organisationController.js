const { pool } = require('../models/Organisation');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Utility function to validate schema
const validateSchema = (schema, data) => {
  const { error } = schema.validate(data);
  if (error) {
    return error.details.map((e) => ({
      field: e.context.key,
      message: e.message,
    }));
  }
  return null;
};

// Controller function to get all organisations for the logged-in user
const getOrganisations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM organisations WHERE userId = $1',
      [req.user.userId]
    );
    res.status(200).json({
      status: 'success',
      message: 'Organisations fetched successfully',
      data: { organisations: result.rows },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not fetch organisations',
      statusCode: 400,
    });
  }
};

// Controller function to get a single organisation by ID
const getOrganisationById = async (req, res) => {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM organisations WHERE orgId = $1 AND userId = $2',
      [orgId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        status: 'Forbidden',
        message: 'You do not have access to this organisation',
        statusCode: 403,
      });
    }

    const organisation = result.rows[0];
    res.status(200).json({
      status: 'success',
      message: 'Organisation fetched successfully',
      data: {
        orgId: organisation.orgid,
        name: organisation.name,
        description: organisation.description,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not fetch organisation',
      statusCode: 400,
    });
  }
};

// Controller function to create a new organisation
const createOrganisation = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
  });

  const errors = validateSchema(schema, req.body);
  if (errors) {
    return res.status(422).json({ errors });
  }

  const { name, description } = req.body;

  try {
    const orgId = uuidv4();
    await pool.query(
      'INSERT INTO organisations (orgId, name, description, userId) VALUES ($1, $2, $3, $4)',
      [orgId, name, description, req.user.userId]
    );

    res.status(201).json({
      status: 'success',
      message: 'Organisation created successfully',
      data: { orgId, name, description },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not create organisation',
      statusCode: 400,
    });
  }
};

// Controller function to add a user to an organisation
const addUserToOrganisation = async (req, res) => {
  const { userId } = req.body;
  const { orgId } = req.params;

  try {
    await pool.query(
      'INSERT INTO organisations_users (userId, orgId) VALUES ($1, $2)',
      [userId, orgId]
    );

    res.status(200).json({
      status: 'success',
      message: 'User added to organisation successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not add user to organisation',
      statusCode: 400,
    });
  }
};

module.exports = {
  getOrganisations,
  getOrganisationById,
  createOrganisation,
  addUserToOrganisation,
};
