const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const { createUserTable } = require('./models/User');
const { createOrganisationTable } = require('./models/Organisation');
const authRoutes = require('./routes/authRoutes');
const organisationRoutes = require('./routes/organisationRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(bodyParser.json());

createUserTable();
createOrganisationTable();

app.use('/auth', authRoutes); // Use auth routes for /auth paths
app.use('/api/organisations', organisationRoutes); // Use organisation routes for /api/organisations paths
app.use('/api/users', userRoutes); // Use user routes for /api/users paths

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
