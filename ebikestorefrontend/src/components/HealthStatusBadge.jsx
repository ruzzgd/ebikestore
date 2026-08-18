import React from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export function HealthStatusBadge({ healthData, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="health-badge">
        <RefreshCw size={14} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Connecting...</span>
      </div>
    );
  }

  const status = healthData?.status || 'error';
  const isOk = status === 'ok';
  const isDegraded = status === 'degraded';

  return (
    <div className="health-badge" id="system-health-badge">
      <span className={`status-dot ${isOk ? 'ok' : isDegraded ? 'degraded' : 'error'}`}></span>
      <span>API: {isOk ? 'Healthy' : isDegraded ? 'Degraded' : 'Offline'}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="btn-refresh"
          title="Refresh Health Status"
          id="btn-refresh-health"
        >
          <RefreshCw size={12} />
        </button>
      )}
    </div>
  );
}

export default HealthStatusBadge;
