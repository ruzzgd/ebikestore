import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CarFront, CheckCircle2, ClipboardList, Clock3, Package, ShieldCheck, Tag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import applicationService from '../../services/applicationService.js';
import categoryService from '../../services/categoryService.js';

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', completed: 'Completed', cancelled: 'Cancelled' };
const avatarUrl = (key) => key ? `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/uploads/images/${key}` : null;

export function CustomerAccount() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([applicationService.getMyApplications(), categoryService.getCategories(true)])
      .then(([applicationResult, categoryResult]) => {
        setApplications(applicationResult || []);
        setCategories(categoryResult || []);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: applications.length,
    active: applications.filter((item) => ['submitted', 'under_review', 'approved'].includes(item.status)).length,
    completed: applications.filter((item) => item.status === 'completed').length,
  }), [applications]);
  const recentApplications = applications.slice(0, 3);
  const initials = user?.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C';

  return <div className="customer-dashboard">
    <section className="customer-welcome-card">
      <div><span className="section-eyebrow">CUSTOMER WORKSPACE</span><h1>Welcome back, {user?.name?.split(/\s+/)[0] || 'Rider'}.</h1><p>Track your applications, explore available products, and keep your account details up to date.</p></div>
      <Link className="btn-refresh primary" to="/account/products"><CarFront size={17} /> Browse Products</Link>
    </section>

    {error && <div className="inventory-alert error">Unable to load application summary: {error}</div>}

    <section className="customer-stat-grid" aria-label="Account summary">
      <article className="customer-stat-card"><span><ClipboardList size={20} /></span><div><small>Total applications</small><strong>{loading ? '—' : stats.total}</strong><p>All submitted requests</p></div></article>
      <article className="customer-stat-card"><span><Clock3 size={20} /></span><div><small>In progress</small><strong>{loading ? '—' : stats.active}</strong><p>Awaiting or under review</p></div></article>
      <article className="customer-stat-card"><span><CheckCircle2 size={20} /></span><div><small>Completed</small><strong>{loading ? '—' : stats.completed}</strong><p>Finished transactions</p></div></article>
    </section>

    <section className="customer-category-section" aria-labelledby="customer-category-title">
      <header><div><span className="section-eyebrow">SHOP BY CATEGORY</span><h2 id="customer-category-title">Find what you need</h2></div><Link to="/account/products">View all products <ArrowRight size={15} /></Link></header>
      <div className="customer-category-grid">
        {categories.map((category) => {
          const Icon = category.name === 'E-Bikes' ? CarFront : category.name === 'Accessories' ? Tag : Package;
          return <Link key={category.id} to={`/account/products?category=${category.id}`} className="customer-category-card"><span><Icon size={22} /></span><div><strong>{category.name}</strong><small>{Number(category.active_product_count || 0)} active product{Number(category.active_product_count || 0) === 1 ? '' : 's'}</small></div><ArrowRight size={17} /></Link>;
        })}
      </div>
    </section>

    <div className="customer-dashboard-grid">
      <section className="customer-panel customer-account-panel">
        <header className="customer-panel-heading"><span><UserRound size={20} /></span><div><h2>Account Overview</h2><p>Your verified Fidelo customer identity.</p></div></header>
        <div className="customer-profile-summary">
          <div className="customer-avatar">{user?.avatar_key ? <img src={avatarUrl(user.avatar_key)} alt="" /> : initials}</div>
          <div className="customer-profile-name"><h3>{user?.name}</h3><p>{user?.email}</p><span><ShieldCheck size={14} /> Verified customer</span></div>
        </div>
        <dl className="customer-details">
          <div><dt>Full name</dt><dd>{user?.name}</dd></div>
          <div><dt>Email address</dt><dd>{user?.email}</dd></div>
          <div><dt>Account role</dt><dd>Customer</dd></div>
          <div><dt>Email verification</dt><dd className="verified"><CheckCircle2 size={15} /> Verified</dd></div>
        </dl>
        <Link className="btn-refresh customer-profile-link" to="/profile"><UserRound size={16} /> Manage Profile <ArrowRight size={15} /></Link>
      </section>

      <section className="customer-panel customer-applications-panel">
        <header className="customer-panel-heading"><span><ClipboardList size={20} /></span><div><h2>Recent Applications</h2><p>Your latest product application activity.</p></div><Link to="/account/applications">View all <ArrowRight size={14} /></Link></header>
        <div className="customer-recent-list">
          {loading ? <div className="customer-empty-state">Loading your applications…</div> : recentApplications.length === 0 ? <div className="customer-empty-state"><ClipboardList size={32} /><strong>No applications yet</strong><p>Browse the catalog and choose a product to get started.</p><Link className="btn-refresh primary" to="/account/products">Browse Products</Link></div> : recentApplications.map((application) => <Link className="customer-application-row" to={`/applications/${application.id}`} key={application.id}><div><span className={`application-status ${application.status}`}>{STATUS_LABELS[application.status]}</span><strong>{application.product_name}</strong><small>{application.application_reference} · {application.location_name}</small></div><ArrowRight size={17} /></Link>)}
        </div>
      </section>
    </div>
  </div>;
}

export default CustomerAccount;
