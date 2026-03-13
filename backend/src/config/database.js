const { Pool } = require('pg');
require('dotenv').config();

// Increased pool size to handle concurrent requests and background services
// Default to 50, allow override via env var
const poolSize = parseInt(process.env.DB_POOL_SIZE || '50', 10);
const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10);

// Support DATABASE_URL (Neon, Heroku) or individual DB_* vars
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: connectionTimeout,
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: connectionTimeout,
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  pool
};