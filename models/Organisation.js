const { Pool } = require('pg');

// Create a new pool instance with the database URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Function to create Organisation table if it doesn't exist
const createOrganisationTable = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS organisations (
      orgId VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      userId VARCHAR(50) REFERENCES users(userId) ON DELETE CASCADE
    );
  `;
    await pool.query(query); // Execute the query to create the table
    console.log('Organisation table created successfully');
  } catch (err) {
    console.error('Error creating organisation table:', err);
  }
};

module.exports = {
  pool,
  createOrganisationTable,
};
