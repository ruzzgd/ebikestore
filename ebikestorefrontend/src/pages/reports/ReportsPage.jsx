import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import reportService from '../../services/reportService';
import locationService from '../../services/locationService';
import { downloadCSV } from '../../utils/csvExport';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Bike, Boxes, CheckCircle2, ClipboardCheck, Download, PackageCheck, RefreshCw, TriangleAlert } from 'lucide-react';
import './ReportsPage.css';

const TAB_OVERVIEW = 'overview';
const TAB_INVENTORY = 'inventory';
const TAB_MOVEMENTS = 'movements';
const TAB_TRANSACTIONS = 'transactions';
const TAB_TRANSFERS = 'transfers';
const TAB_APPLICATIONS = 'applications';

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isWarehouse = user?.role === 'warehouse_staff';

  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  
  // Filters
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  
  const today = new Date();
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  const [startDate, setStartDate] = useState(last30Days.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      locationService.getLocations()
        .then(res => setLocations(res.data.locations))
        .catch(err => console.error('Failed to load locations', err));
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    const filters = {
      locationId: isAdmin ? locationId : undefined,
      startDate,
      endDate
    };

    try {
      let res;
      switch (activeTab) {
        case TAB_OVERVIEW:
          res = await reportService.getOverviewStats(filters);
          break;
        case TAB_INVENTORY:
          res = await reportService.getInventoryReport(filters);
          break;
        case TAB_MOVEMENTS:
          res = await reportService.getMovementsReport(filters);
          break;
        case TAB_TRANSACTIONS:
          res = await reportService.getTransactionsReport(filters);
          break;
        case TAB_TRANSFERS:
          res = await reportService.getTransfersReport(filters);
          break;
        case TAB_APPLICATIONS:
          res = await reportService.getApplicationsReport(filters);
          break;
        default:
          break;
      }
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, locationId, startDate, endDate]);

  const handleExport = () => {
    if (!data || !Array.isArray(data)) return;
    downloadCSV(data, `report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const renderOverview = () => {
    if (!data) return null;
    return (
      <div className="reports-overview">
        <div className="overview-summary">
          <div><span className="report-kicker">REPORTING SNAPSHOT</span><h3>Operational summary</h3><p>Key activity for {startDate} through {endDate}{locationId ? ' at the selected location' : ' across all locations'}.</p></div>
          <button className="btn-refresh" onClick={loadData}><RefreshCw size={15} />Refresh data</button>
        </div>
        <section className="report-metric-group"><div className="report-group-heading"><span className="inventory"><Boxes size={17} /></span><div><h3>Inventory position</h3><p>Current catalog and stock readiness</p></div></div><div className="report-metric-grid three">
          <article className="report-metric-card primary"><span><PackageCheck size={20} /></span><div><small>Total inventory units</small><strong>{data.totalInventoryUnits}</strong><p>Physical units currently recorded</p></div></article>
          <article className="report-metric-card warning"><span><TriangleAlert size={20} /></span><div><small>Low-stock records</small><strong>{data.lowStockCount}</strong><p>At or below assigned thresholds</p></div></article>
          <article className="report-metric-card danger"><span><Bike size={20} /></span><div><small>Out of stock</small><strong>{data.outOfStockCount}</strong><p>Records requiring replenishment</p></div></article>
        </div></section>
        <section className="report-metric-group"><div className="report-group-heading"><span className="movement"><ArrowLeftRight size={17} /></span><div><h3>Movement activity</h3><p>Units handled during the selected period</p></div></div><div className="report-metric-grid four">
          <article className="report-compact-metric"><ArrowDownToLine size={18} /><span><small>Stock in</small><strong>{data.stockInUnits}</strong></span></article>
          <article className="report-compact-metric"><ArrowUpFromLine size={18} /><span><small>Stock out</small><strong>{data.stockOutUnits}</strong></span></article>
          <article className="report-compact-metric"><ArrowDownToLine size={18} /><span><small>Transfer in</small><strong>{data.transferInUnits}</strong></span></article>
          <article className="report-compact-metric"><ArrowUpFromLine size={18} /><span><small>Transfer out</small><strong>{data.transferOutUnits}</strong></span></article>
        </div></section>
        <section className="report-metric-group"><div className="report-group-heading"><span className="workflow"><ClipboardCheck size={17} /></span><div><h3>Workflow attention</h3><p>Items requiring action and completed work</p></div></div><div className={`report-metric-grid ${isWarehouse ? 'one' : 'three'}`}>
          <button className="report-action-card" onClick={() => setActiveTab(TAB_TRANSFERS)}><span><ArrowLeftRight size={19} /></span><div><small>Active transfers</small><strong>{data.activeTransfers}</strong><p>Open transfer workflows</p></div><b>View report →</b></button>
          {!isWarehouse && <button className="report-action-card" onClick={() => setActiveTab(TAB_APPLICATIONS)}><span><ClipboardCheck size={19} /></span><div><small>Awaiting review</small><strong>{data.applicationsAwaitingReview}</strong><p>Submitted customer applications</p></div><b>Review report →</b></button>}
          {!isWarehouse && <button className="report-action-card success" onClick={() => setActiveTab(TAB_TRANSACTIONS)}><span><CheckCircle2 size={19} /></span><div><small>Completed transactions</small><strong>{data.completedTransactions}</strong><p>Completed in selected period</p></div><b>View report →</b></button>}
        </div></section>
      </div>
    );
  };

  const renderTable = (columns) => {
    if (!data || !Array.isArray(data)) return <p>No data available</p>;
    if (data.length === 0) return <p>No records found for the selected period.</p>;

    return (
      <div className="table-responsive">
        <table className="reports-table">
          <thead>
            <tr>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="reports-page container">
      <header className="page-header">
        <div><span className="report-kicker">OPERATIONS</span><h1>Reports & Analytics</h1><p>Review inventory, movement, and workflow records.</p></div>
        {activeTab !== TAB_OVERVIEW && data && Array.isArray(data) && (
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export to CSV
          </button>
        )}
      </header>

      <div className="reports-filters card">
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        {isAdmin && (
          <div className="filter-group">
            <label>Location</label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)}>
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="reports-tabs">
        <button className={activeTab === TAB_OVERVIEW ? 'active' : ''} onClick={() => setActiveTab(TAB_OVERVIEW)}>Overview</button>
        <button className={activeTab === TAB_INVENTORY ? 'active' : ''} onClick={() => setActiveTab(TAB_INVENTORY)}>Inventory</button>
        <button className={activeTab === TAB_MOVEMENTS ? 'active' : ''} onClick={() => setActiveTab(TAB_MOVEMENTS)}>Stock Movements</button>
        {!isWarehouse && <button className={activeTab === TAB_TRANSACTIONS ? 'active' : ''} onClick={() => setActiveTab(TAB_TRANSACTIONS)}>Transactions</button>}
        <button className={activeTab === TAB_TRANSFERS ? 'active' : ''} onClick={() => setActiveTab(TAB_TRANSFERS)}>Transfers</button>
        {!isWarehouse && <button className={activeTab === TAB_APPLICATIONS ? 'active' : ''} onClick={() => setActiveTab(TAB_APPLICATIONS)}>Applications</button>}
      </div>

      <div className="reports-content card">
        {loading && <div className="loading">Loading report data...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && (
          <>
            {activeTab === TAB_OVERVIEW && renderOverview()}
            {activeTab === TAB_INVENTORY && renderTable([
              { key: 'location_name', label: 'Location' },
              { key: 'category_name', label: 'Category' },
              { key: 'product_name', label: 'Product' },
              { key: 'sku', label: 'SKU' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'low_stock_threshold', label: 'Threshold' },
              { key: 'availability', label: 'Status' }
            ])}
            {activeTab === TAB_MOVEMENTS && renderTable([
              { key: 'date', label: 'Date' },
              { key: 'location_name', label: 'Location' },
              { key: 'movement_type', label: 'Type' },
              { key: 'product_name', label: 'Product' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'performed_by', label: 'Performed By' },
              { key: 'reference_type', label: 'Ref Type' }
            ])}
            {activeTab === TAB_TRANSACTIONS && renderTable([
              { key: 'completed_at', label: 'Date' },
              { key: 'application_reference', label: 'Reference' },
              { key: 'location_name', label: 'Location' },
              { key: 'product_name', label: 'Product' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'catalog_value', label: 'Catalog Value' },
              { key: 'completed_for', label: 'Customer' }
            ])}
            {activeTab === TAB_TRANSFERS && renderTable([
              { key: 'requested_at', label: 'Requested Date' },
              { key: 'request_reference', label: 'Reference' },
              { key: 'source_name', label: 'Source' },
              { key: 'destination_name', label: 'Destination' },
              { key: 'status', label: 'Status' },
              { key: 'item_count', label: 'Items' },
              { key: 'total_units_requested', label: 'Units Req' }
            ])}
            {activeTab === TAB_APPLICATIONS && renderTable([
              { key: 'submitted_date', label: 'Date' },
              { key: 'application_reference', label: 'Reference' },
              { key: 'branch_name', label: 'Branch' },
              { key: 'customer', label: 'Customer' },
              { key: 'product_name', label: 'Product' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'status', label: 'Status' }
            ])}
          </>
        )}
      </div>
    </div>
  );
}
