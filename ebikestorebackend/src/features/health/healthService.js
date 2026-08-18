import { getHealthRepository } from './healthRepository.js';

export const getSystemHealth = async () => {
  const repoResult = await getHealthRepository();
  const uptimeSeconds = process.uptime();

  const isHealthy = repoResult.database.isHealthy;

  return {
    status: isHealthy ? 'ok' : 'degraded',
    system: 'Fidelo E-Bike Store API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptimeSeconds)}s`,
    database: {
      connected: repoResult.database.isHealthy,
      latency: `${repoResult.database.latencyMs}ms`,
      message: repoResult.database.message,
    },
  };
};

export default {
  getSystemHealth,
};
