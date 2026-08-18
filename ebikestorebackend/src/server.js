import app from './app.js';
import config from './config/index.js';
import { closePool } from './db/connection.js';

const server = app.listen(config.port, () => {
  console.log(`[SERVER] Fidelo E-Bike Store Backend running on port ${config.port} (${config.env})`);
  console.log(`[SERVER] Health check available at: http://localhost:${config.port}/api/v1/health`);
});

const gracefulShutdown = async (signal) => {
  console.log(`[SERVER] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[SERVER] HTTP server closed.');
    await closePool();
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
