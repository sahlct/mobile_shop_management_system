const express = require('express');
require("dotenv").config();
const { Pool } = require('@neondatabase/serverless');

const app = express();
app.use(express.json());

// Use environment variable for the database connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', async (req, res) => {
  try {
    // Execute a sample query
    const { rows } = await pool.query('SELECT version()');
    const version = rows[0].version;
    res.status(200).send(`PostgreSQL Version: ${version}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/categories', require('./routes/categoryRoutes'));
app.use('/products', require('./routes/productsRoutes'));

module.exports = app;
