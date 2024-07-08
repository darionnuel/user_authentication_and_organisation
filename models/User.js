const { Pool } = require('pg');

// Log the connection string to verify it's correct
//console.log('Connecting to database:', process.env.DATABASE_URL);

// Create a new pool instance with the database URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Function to create User table if it doesn't exist
const createUserTable = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS users (
      userId VARCHAR(50) PRIMARY KEY,
      firstName VARCHAR(100) NOT NULL,
      lastName VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20)
    );
  `;
    await pool.query(query); // Execute the query to create the table
    console.log('User table created successfully');
  } catch (err) {
    console.error('Error creating user table:', err);
  }
};

module.exports = {
  pool,
  createUserTable,
};
