const { pool } = require('../models/User');

// Controller function to get user details by user ID
const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM users WHERE userId = $1', [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'Not found',
        message: 'User not found',
        statusCode: 404,
      });
    }

    const user = result.rows[0];
    res.status(200).json({
      status: 'success',
      message: 'User fetched successfully',
      data: {
        userId: user.userid,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not fetch user',
      statusCode: 400,
    });
  }
};

module.exports = {
  getUser,
};
