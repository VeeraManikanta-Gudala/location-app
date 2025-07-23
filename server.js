// backend/server.js
const express = require('express');
//const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const { Pool } = require('pg');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_HgyflU0YOxM3@ep-broad-sea-a79991m5-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

// Create table if not exists
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      ip VARCHAR(45),
      country VARCHAR(50),
      region VARCHAR(50),
      city VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
initDB();

// Get IP and location
app.get('/api/track', async (req, res) => {
  try {
    const ip = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip);

    const geo = await fetch(`http://ip-api.com/json/${ip}`).then(r => r.json());

    await pool.query(
      'INSERT INTO visitors (ip, country, region, city) VALUES ($1, $2, $3, $4)',
      [ip, geo.country, geo.regionName, geo.city]
    );

    res.json({
      ip,
      country: geo.country,
      region: geo.regionName,
      city: geo.city,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching geolocation.' });
  }
});

// Show history
app.get('/api/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT ip, country, region, city, timestamp FROM visitors ORDER BY timestamp DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching history.' });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
