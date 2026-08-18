import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, Warehouse, ArrowLeft, RefreshCw } from 'lucide-react';
import locationService from '../../services/locationService.js';

export function AdminLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const data = await locationService.getLocations();
        setLocations(data);
      } catch (err) {
        console.warn('Failed to load locations:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/admin" className="btn-refresh">
          <ArrowLeft size={16} />
          <span>Back to Admin Dashboard</span>
        </Link>
        <h2 style={{ fontSize: '1.75rem' }}>Operating Locations &amp; Facilities</h2>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <MapPin size={28} color="#0d9488" />
          <h3>Fidelo E-Bike Store Operating Facilities</h3>
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Master directory of retail branches and central fulfillment warehouse. Staff members are assigned to these locations.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-light)' }} />
        </div>
      ) : (
        <div className="grid-cols-3">
          {locations.map((loc) => {
            const isWarehouse = loc.type === 'warehouse';
            return (
              <div key={loc.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  {isWarehouse ? <Warehouse size={28} color="#0d9488" /> : <Store size={28} color="#3b82f6" />}
                  <span className="tech-tag" style={{ background: isWarehouse ? 'rgba(13,148,136,0.2)' : 'rgba(59,130,246,0.2)', color: isWarehouse ? '#2dd4bf' : '#60a5fa' }}>
                    {loc.type.toUpperCase()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{loc.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginBottom: '1rem' }}>
                  Facility Code: {loc.code}
                </p>

                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  &bull; Inventory quantities and stock transactions will be linked to this location in Phase 4.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminLocationsPage;
