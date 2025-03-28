const express = require('express');
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const app = express();
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

app.get('/', async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    const { version } = result[0];
    res.status(200).send(`PostgreSQL Version: ${version}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/categories', require('./routes/categoryRoutes'));
app.use('/products', require('./routes/productsRoutes'));

module.exports = app;
