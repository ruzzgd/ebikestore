import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, KeyRound, Lock, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import authService from '../../services/authService.js';

const imageUrl = (key) => key ? `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/uploads/images/${key}` : null;

export function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const fileInput = useRef(null);
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [password, setPassword] = useState({ code: '', next: '', confirm: '' });
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);

  React.useEffect(() => setProfile({ name: user?.name || '', email: user?.email || '' }), [user]);
  const show = (type, message) => setNotice({ type, message });

  const saveProfile = async (event) => {
    event.preventDefault(); setBusy('profile'); setNotice(null);
    try { await authService.updateProfile(profile); await checkAuth(); show('success', 'Your profile details were updated.'); }
    catch (error) { show('error', error.message); } finally { setBusy(''); }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy('avatar'); setNotice(null);
    try { await authService.updateAvatar(file); await checkAuth(); show('success', 'Your profile photo was updated.'); }
    catch (error) { show('error', error.message); } finally { setBusy(''); event.target.value = ''; }
  };

  const sendCode = async () => {
    setBusy('code'); setNotice(null);
    try { const result = await authService.requestPasswordChangeCode(); setCodeSent(true); show('success', result.message); }
    catch (error) { show('error', error.message); } finally { setBusy(''); }
  };

  const changePassword = async (event) => {
    event.preventDefault(); setNotice(null);
    if (password.next !== password.confirm) return show('error', 'New passwords do not match.');
    setBusy('password');
    try { const result = await authService.changePassword({ code: password.code, password: password.next }); setPassword({ code: '', next: '', confirm: '' }); setCodeSent(false); show('success', result.message); }
    catch (error) { show('error', error.message); } finally { setBusy(''); }
  };

  const initials = user?.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
  return <div className="profile-page">
    <div className="profile-heading"><div><span className="section-eyebrow">ACCOUNT SETTINGS</span><h1>My Profile</h1><p>Manage your identity, account details, and password security.</p></div><span className="profile-security-badge"><ShieldCheck size={17} /> Verified account</span></div>
    {notice && <div className={`profile-notice ${notice.type}`}>{notice.type === 'success' && <CheckCircle2 size={18} />}{notice.message}</div>}
    <div className="profile-layout">
      <aside className="profile-identity-card">
        <div className="profile-avatar-large">{user?.avatar_key ? <img src={imageUrl(user.avatar_key)} alt={`${user.name}'s avatar`} /> : <span>{initials}</span>}<button onClick={() => fileInput.current?.click()} disabled={busy === 'avatar'} aria-label="Change profile photo"><Camera size={18} /></button></div>
        <input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} />
        <h2>{user?.name}</h2><p>{user?.email}</p><span className="profile-role">{user?.role?.replaceAll('_', ' ')}</span>
        {user?.location_name && <div className="profile-location"><small>Assigned location</small><strong>{user.location_name}</strong></div>}
        <button className="btn secondary" onClick={() => fileInput.current?.click()} disabled={busy === 'avatar'}><Camera size={16} />{busy === 'avatar' ? 'Uploading…' : 'Change photo'}</button><small className="upload-help">JPEG, PNG, or WebP · Maximum 3 MB</small>
      </aside>
      <div className="profile-settings">
        <section className="profile-panel"><div className="profile-panel-heading"><span><UserRound size={20} /></span><div><h2>Personal information</h2><p>This information appears in the workspace and activity records.</p></div></div>
          <form onSubmit={saveProfile} className="profile-form"><label><span>Full name</span><div><UserRound size={17} /><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required minLength={2} maxLength={100} /></div></label><label><span>Email address</span><div><Mail size={17} /><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></div></label><div className="profile-form-actions"><button className="btn primary" disabled={busy === 'profile'}><Save size={16} />{busy === 'profile' ? 'Saving…' : 'Save changes'}</button></div></form>
        </section>
        <section className="profile-panel"><div className="profile-panel-heading"><span><Lock size={20} /></span><div><h2>Change password</h2><p>For security, we’ll send a six-digit confirmation code to your email.</p></div></div>
          {!codeSent ? <div className="password-code-prompt"><div><Mail size={20} /><span><strong>Send code to</strong><small>{user?.email}</small></span></div><button className="btn secondary" onClick={sendCode} disabled={busy === 'code'}>{busy === 'code' ? 'Sending…' : 'Send confirmation code'}</button></div> : <form onSubmit={changePassword} className="profile-form"><label><span>Confirmation code</span><div><KeyRound size={17} /><input value={password.code} onChange={(e) => setPassword({ ...password, code: e.target.value.replace(/\D/g, '') })} inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="6-digit code" required /></div></label><div className="profile-form-row"><label><span>New password</span><div><Lock size={17} /><input type="password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} minLength={8} required /></div></label><label><span>Confirm password</span><div><Lock size={17} /><input type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} minLength={8} required /></div></label></div><div className="profile-form-actions split"><button type="button" className="auth-text-button" onClick={sendCode}>Resend code</button><button className="btn primary" disabled={busy === 'password'}>{busy === 'password' ? 'Changing…' : 'Change password'}</button></div></form>}
        </section>
      </div>
    </div>
  </div>;
}

export default ProfilePage;
