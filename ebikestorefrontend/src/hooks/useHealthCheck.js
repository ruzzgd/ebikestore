import { useState, useEffect, useCallback } from 'react';
import { getHealthStatus } from '../services/healthService.js';

export function useHealthCheck() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealthStatus();
      setHealthData(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
      setHealthData({
        status: 'error',
        system: 'Fidelo E-Bike Store API',
        database: { connected: false, message: 'Backend unreachable' },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { healthData, loading, error, refetch: fetchHealth };
}
