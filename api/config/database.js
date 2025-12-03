const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database connection configuration
// Uses environment variables if .env file exists, otherwise uses hardcoded values
const dbConfig = {
  host: process.env.DB_HOST || 'a07yd3a6okcidwap.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'cz8hofyynu7rfd0k',
  password: process.env.DB_PASSWORD || 'jfm4lwn3t2s78r0q',
  database: process.env.DB_NAME || 'ayau90a9k33ttyyq',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Log connection details (without password) for debugging
console.log('Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  hasPassword: !!dbConfig.password
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

module.exports = pool;

