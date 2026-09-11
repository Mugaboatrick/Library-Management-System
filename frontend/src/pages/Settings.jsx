import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import UserLayout from '../components/layout/UserLayout';
import UserAvatar from '../components/common/UserAvatar';
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const MENU = [
  { key: 'account', icon: '👤', label: 'Account Information', desc: 'Profile details & photo' },
  { key: 'activity', icon: '📊', label: 'Activity Snapshot', desc: 'Borrowings & fines' },
  { key: 'library', icon: '📚', label: 'Hope Haven School Library', desc: 'About the system' },
  { key: 'appearance', icon: '🌗', label: 'Appearance', desc: 'Day or Night mode' },
  { key: 'security', icon: '🔒', label: 'Change Password', desc: 'Update your password' },
  { key: 'session', icon: '⚙️', label: 'Session', desc: 'Signing out & session info' }
];

const Settings = () => {
  const { user, logout, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [me, setMe] = useState(null);
  const [active, setActive] = useState('account');
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isLibrarian = user?.role === 'LIBRARIAN';

  useEffect(() => {
    authService.getMe()
      .then((res) => setMe(res.data))
      .catch(() => {});
  }, []);

  const roleLabel = user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : '';
  const memberSince = me?.user?.created_at ? new Date(me.user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setUploading(true);
    try {
      const res = await authService.updateProfileImage(file);
      const updated = { ...user, profile_image: res.data.profile_image };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setMe((m) => (m ? { ...m, user: { ...m.user, profile_image: res.data.profile_image } } : m));
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    setUploading(true);
    try {
      await authService.removeProfileImage();
      const updated = { ...user, profile_image: null };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setMe((m) => (m ? { ...m, user: { ...m.user, profile_image: null } } : m));
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error('Could not remove picture');
    } finally {
      setUploading(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({ old_password: passwordForm.old_password, new_password: passwordForm.new_password });
      toast.success('Password changed successfully');
      setPasswordForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ===== Section contents ===== */
  const AccountTab = (
    <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
      <div className="bg-white/70 rounded-xl overflow-hidden">
        <div className="table-wrap">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase w-44">Profile Picture</th>
              <td className="px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <UserAvatar user={user || me?.user} size="lg" />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-blue-500 text-white text-xs font-medium hover:opacity-90 transition disabled:opacity-60"
                    >
                      {uploading ? 'Uploading...' : '📷 Change photo'}
                    </button>
                    {(user?.profile_image || me?.user?.profile_image) && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Customer ID</th>
              <td className="px-4 py-3 font-mono font-semibold">{user?.customer_id || me?.user?.customer_id || '-'}</td>
            </tr>
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Email Address</th>
              <td className="px-4 py-3 font-semibold">{user?.email || '-'}</td>
            </tr>
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Phone</th>
              <td className="px-4 py-3 font-semibold">{user?.phone || me?.user?.phone || '-'}</td>
            </tr>
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Role</th>
              <td className="px-4 py-3 font-semibold">{roleLabel || '-'}</td>
            </tr>
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Member Since</th>
              <td className="px-4 py-3 font-semibold">{memberSince}</td>
            </tr>
            <tr>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">QR Card</th>
              <td className="px-4 py-3 font-semibold">
                {me?.card ? (
                  <>
                    <span className="text-primary-700">{me.card.card_number}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${me.card.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {me.card.status}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">No card</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  const ActivityTab = (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/70 rounded-xl p-5 text-center card-hover">
            <div className="text-3xl mb-2 inline-block animate-float">📋</div>
            <div className="text-4xl font-extrabold text-blue-700">{me?.activeBorrowings ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Active borrowings</div>
          </div>
          <div className="bg-white/70 rounded-xl p-5 text-center card-hover">
            <div className="text-3xl mb-2 inline-block animate-float" style={{ animationDelay: '-1.5s' }}>💰</div>
            <div className="text-4xl font-extrabold text-red-600">{me?.unpaidFines ?? 0} <span className="text-base">RWF</span></div>
            <div className="text-xs text-gray-500 mt-1">Unpaid fines</div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400">These numbers update live from your library account.</p>
    </div>
  );

  const LibraryTab = (
    <div className="glass-card rounded-2xl border border-white/60 p-8 shadow-sm text-center">
      <div className="text-5xl mb-3 inline-block animate-bounce-soft">📚</div>
      <h3 className="text-2xl font-extrabold text-primary-800">Hope Haven School Library</h3>
      <p className="text-sm text-gray-500 mt-1">Smart Library Management System</p>
      <p className="text-sm text-gray-600 max-w-md mx-auto mt-4 leading-relaxed">
        A complete digital solution for modern school libraries: QR access cards, instant borrowing,
        automatic fines, digital e-books and live reports.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {['QR Login', 'Auto Fines', 'E-Book Reader', 'Live Reports'].map((f) => (
          <span key={f} className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">{f}</span>
        ))}
      </div>
      <div className="mt-5 text-[11px] text-gray-400">Kept safe & up to date for your library.</div>
    </div>
  );

  const SecurityTab = (
    <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
      <form onSubmit={handlePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
          <input
            type="password"
            value={passwordForm.old_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            placeholder="At least 6 characters"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <input
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-hero w-full px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500 disabled:opacity-50"
        >
          {saving ? 'Updating...' : '🔒 Update Password'}
        </button>
      </form>
    </div>
  );

  const AppearanceTab = (
    <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
      <p className="text-sm text-gray-500 mb-5">
        Choose how the whole system looks. Day mode is bright white, Night mode is dark for better visibility at night.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`card-hover rounded-2xl p-6 text-left border-2 transition ${
            theme === 'light' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-primary-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl animate-float inline-block">☀️</span>
            {theme === 'light' && <span className="px-2 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-semibold">ACTIVE</span>}
          </div>
          <div className="font-bold text-gray-800">Day Mode</div>
          <div className="text-xs text-gray-500 mt-1">Bright white background, perfect for daytime.</div>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`card-hover rounded-2xl p-6 text-left border-2 transition ${
            theme === 'dark' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-primary-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl animate-float inline-block" style={{ animationDelay: '-2s' }}>🌙</span>
            {theme === 'dark' && <span className="px-2 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-semibold">ACTIVE</span>}
          </div>
          <div className="font-bold text-gray-800">Night Mode</div>
          <div className="text-xs text-gray-500 mt-1">Dark black background, easy on the eyes at night.</div>
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-4">Your choice is saved and applies to the whole system.</p>
    </div>
  );

  const SessionTab = (
    <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
      <dl className="space-y-3 mb-6 bg-white/70 rounded-xl p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Signed in as</span>
          <span className="font-semibold">{user?.email || '-'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Account type</span>
          <span className="font-semibold">{roleLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Your QR Card</span>
          <span className="font-semibold text-primary-700">{me?.card?.card_number || '—'}</span>
        </div>
      </dl>
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold hover:from-red-600 hover:to-rose-600 transition shadow-lg"
      >
        🚪 Logout from the system
      </button>
      <p className="text-xs text-gray-400 mt-3 text-center">
        Logging out will end your session and return you to the sign-in page.
      </p>
    </div>
  );

  const tabs = {
    account: AccountTab,
    activity: ActivityTab,
    library: LibraryTab,
    appearance: AppearanceTab,
    security: SecurityTab,
    session: SessionTab
  };

  const content = (
    <div className="space-y-6">
      {/* ===== Profile hero ===== */}
      <div className="relative overflow-hidden rounded-3xl animate-gradient bg-gradient-to-br from-primary-800 via-primary-700 to-blue-600 text-white p-6 sm:p-8">
        <div className="absolute inset-0">
          <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-cyan-300/25 animate-blob"></div>
          <div className="absolute -bottom-10 left-1/4 w-48 h-48 rounded-full bg-indigo-400/25 animate-blob-slow"></div>
        </div>
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="rounded-full shadow-lg animate-bounce-soft">
            <UserAvatar user={user || me?.user} size="lg" className="ring-4 ring-white/30" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 animate-fade-up">
              <h1 className="text-2xl sm:text-3xl font-extrabold">{user?.first_name} {user?.last_name}</h1>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-xs font-semibold shadow">
                {roleLabel}
              </span>
            </div>
            <p className="text-blue-100/90 text-sm mt-1 animate-fade-up" style={{ animationDelay: '80ms' }}>
              {user?.email} {user?.phone ? `• ${user.phone}` : ''}
            </p>
          </div>
          <span className="ml-auto hidden md:flex items-center gap-2 glass-card-dark rounded-full px-4 py-2 text-sm animate-pulse-soft">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {me?.user?.status || user?.status || 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* ===== Settings menu + content ===== */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Menu buttons */}
        <nav className="lg:col-span-1 space-y-2 stagger-children">
          {MENU.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(item.key)}
              className={`card-hover w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                active === item.key
                  ? 'nav-link-active bg-gradient-to-r from-primary-600 to-blue-500 text-white'
                  : 'glass-card border border-white/60 text-gray-700 hover:bg-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold truncate">{item.label}</span>
                <span className={`block text-[11px] truncate ${active === item.key ? 'text-blue-100/80' : 'text-gray-400'}`}>
                  {item.desc}
                </span>
              </span>
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div key={active} className="lg:col-span-3 animate-fade-up min-w-0">
          {tabs[active]}
        </div>
      </div>
    </div>
  );

  return isLibrarian ? <AdminLayout>{content}</AdminLayout> : <UserLayout>{content}</UserLayout>;
};

export default Settings;