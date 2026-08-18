import { checkDatabaseHealth } from '../../db/health.js';

export const getHealthRepository = async () => {
  const dbHealth = await checkDatabaseHealth();
  return {
    database: dbHealth,
  };
};

export default {
  getHealthRepository,
};
