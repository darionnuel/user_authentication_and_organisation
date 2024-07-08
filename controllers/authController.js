const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/User');
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

// Controller function to handle user registration
const register = async (req, res) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    phone: Joi.string().optional(),
  });

  const errors = validateSchema(schema, req.body);
  if (errors) {
    return res.status(422).json({ errors });
  }

  const { firstName, lastName, email, password, phone } = req.body;

  try {
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(422).json({
        errors: [{ field: 'email', message: 'Email already in use' }],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      'INSERT INTO users (userId, firstName, lastName, email, password, phone) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, firstName, lastName, email, hashedPassword, phone]
    );

    const orgId = uuidv4();
    const orgName = `${firstName}'s Organisation`;

    await pool.query(
      'INSERT INTO organisations (orgId, name, userId) VALUES ($1, $2, $3)',
      [orgId, orgName, userId]
    );

    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        accessToken: token,
        user: { userId, firstName, lastName, email, phone },
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Registration unsuccessful',
      statusCode: 400,
    });
  }
};

// Controller function to handle user login
const login = async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const errors = validateSchema(schema, req.body);
  if (errors) {
    return res.status(422).json({ errors });
  }

  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'Bad request',
        message: 'Authentication failed',
        statusCode: 401,
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        status: 'Bad request',
        message: 'Authentication failed',
        statusCode: 401,
      });
    }

    const token = jwt.sign(
      { userId: user.userid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken: token,
        user: {
          userId: user.userid,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Authentication failed',
      statusCode: 401,
    });
  }
};

module.exports = {
  register,
  login,
};
