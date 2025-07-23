const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: 'your_neondb_url'
});

// 👉 Save location (no reverse geocode here)
app.post('/api/save-location', async (req, res) => {
  const { ip, lat, lon, location } = req.body;

  try {
    await pool.query(
      'INSERT INTO visitors (ip, lat, lon, city) VALUES ($1, $2, $3, $4)',
      [ip, lat, lon, location]
    );
    res.status(200).json({ message: "Location saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save" });
  }
});

// 👉 Get history
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitors ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
