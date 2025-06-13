import http from 'http';
import io from './config/socket.js';
import app from './app.js';
import db from './config/db.js';
import {
  PORT,
  BASE_URL,
  NODE_ENV
} from './config/env.js';

let server;

try {
  // Create HTTP server with Express app
  server = http.createServer(app);

  // Initialize Socket.IO with the server
  io.init(server);

  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${BASE_URL || 'http://localhost'}:${PORT} [${NODE_ENV}]`);
  });

} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} signal received. Closing server...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      if (db.end) {
        db.end().catch((err) => console.error('Error closing DB:', err));
      }
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
