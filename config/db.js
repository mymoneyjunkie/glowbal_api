// db.js

import mysql from 'mysql2';

import { 
  HOST,
  USER,
  PASSWORD,
  DATABASE 
} from './env.js';

const pool = mysql.createPool({
  host: HOST, // The public IP or domain of your MySQL server
  user: USER,
  password: PASSWORD, // Your database password
  database: DATABASE,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

pool.on('error', (err) => {
  console.error('Database Pool Error: ', err.message || err);
});

// Optional: Retry logic could be added to handle flaky connections in production
async function testConnection() {
  try {
    const connection = await promisePool.getConnection();
    console.log('MySQL DB connected successfully');
    connection.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    // Optional: alert or trigger fallback here
    setTimeout(testConnection, 5000); // Retry
  }
}

testConnection();

export default promisePool;