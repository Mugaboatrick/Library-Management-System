import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import UserLayout from '../components/layout/UserLayout';
import UserAvatar from '../components/common/UserAvatar';
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';
import { authStorage } from '../services/authStorage';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const MENU = [
  { key: 'account', icon: '', label: 'Account Information', desc: 'Profile details & photo' },
  { key: 'activity', icon: '', label: 'Activity Snapshot', desc: 'Borrowings & fines' },
  { key: 'library', icon: '', label: 'Hope Haven School Library', desc: 'About the system' },
  { key: 'appearance', icon: '', label: 'Appearance', desc: 'Day or Night mode' },
  // Librarian-only. Students and teachers must ask a librarian to reset it,
  // so the section is withheld from them rather than just disabled.
  { key: 'security', icon: '', label: 'Change Password', desc: 'Update your password', roles: ['LIBRARIAN'] },
  { key: 'session', icon: '', label: 'Session', desc: 'Signing out & session info' }
];

const STRONG_PASSWORD_RE = /.{4,}/;

const passwordStrengthError = (p) => {
  if (!p || p.length < 4) return 'Password must be at least 4 characters';
  return null;
};

const Settings = () => {
  const { user, logout, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [me, setMe] = useState(null);
  const [active, setActive] = useState('');
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
      authStorage.setUser(updated);
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
      authStorage.setUser(updated);
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
    const pwError = passwordStrengthError(passwordForm.new_password);
    if (pwError) {
      toast.error(pwError);
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
    navigate('/');
  };

  /* ===== Section contents ===== */
  const sectionCard = (title, icon, gradient, children) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className={`px-4 py-2.5 ${gradient} border-b border-gray-100 flex items-center gap-2`}>
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );

  const AccountTab = (
    <div className="space-y-6">
      {sectionCard('Account Information', '', 'bg-gradient-to-r from-green-50 to-emerald-50', (
        <>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase w-44">Profile Picture</th>
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <UserAvatar user={user || me?.user} size="lg" />
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-3 py-1.5 rounded-lg bg-[#2d6f2d] text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-60"
                        >
                          {uploading ? 'Uploading...' : ' Change photo'}
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
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-sm">{user?.customer_id || me?.user?.customer_id || '-'}</span>
                  </td>
                </tr>
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Email Address</th>
                  <td className="px-4 py-3 font-semibold text-gray-800">{user?.email || '-'}</td>
                </tr>
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Phone</th>
                  <td className="px-4 py-3 font-semibold text-gray-800">{user?.phone || me?.user?.phone || '-'}</td>
                </tr>
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Role</th>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">{roleLabel || '-'}</span>
                  </td>
                </tr>
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">Member Since</th>
                  <td className="px-4 py-3 font-semibold text-gray-800">{memberSince}</td>
                </tr>
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase">QR Card</th>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {me?.card ? (
                      <>
                        <span className="font-mono text-[#2d6f2d]">{me.card.card_number}</span>
                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${me.card.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
        </>
      ))}
    </div>
  );

  const ActivityTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-blue-600">{me?.activeBorrowings ?? 0}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active borrowings</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-red-600">{me?.unpaidFines ?? 0} <span className="text-sm">RWF</span></p>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Unpaid fines</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400">These numbers update live from your library account.</p>
    </div>
  );

  const LibraryTab = (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
      <h3 className="text-2xl font-extrabold text-[#2d6f2d]">Hope Haven School Library</h3>
      <p className="text-sm text-gray-500 mt-1">Smart Library Management System</p>
      <p className="text-sm text-gray-600 max-w-md mx-auto mt-4 leading-relaxed">
        A complete digital solution for modern school libraries: QR access cards, instant borrowing,
        automatic fines, digital e-books and live reports.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {['QR Login', 'Auto Fines', 'E-Book Reader', 'Live Reports'].map((f) => (
          <span key={f} className="px-3 py-1 rounded-full bg-green-50 text-[#2d6f2d] text-xs font-semibold border border-green-200">{f}</span>
        ))}
      </div>
      <div className="mt-5 text-[11px] text-gray-400">Kept safe &amp; up to date for your library.</div>
    </div>
  );

  const SecurityTab = (
    <div className="space-y-6">
      {sectionCard('Change Password', '', 'bg-gradient-to-r from-green-50 to-emerald-50', (
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Current password</label>
            <input
              type="password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">New password</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              placeholder="At least 4 characters"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm new password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full px-6 py-2.5 rounded-lg font-semibold text-white bg-[#2d6f2d] hover:bg-green-700 disabled:opacity-50 transition"
          >
            {saving ? 'Updating...' : ' Update Password'}
          </button>
        </form>
      ))}
    </div>
  );

  const AppearanceTab = (
    <div className="space-y-6">
      {sectionCard('Appearance', '', 'bg-gradient-to-r from-green-50 to-emerald-50', (
        <>
          <p className="text-sm text-gray-500 mb-5">
            Choose how the whole system looks. Day mode is bright white, Night mode is dark for better visibility at night.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`rounded-2xl p-6 text-left border-2 transition ${
                theme === 'light' ? 'border-green-600 ring-2 ring-green-200 bg-green-50/40' : 'border-gray-200 hover:border-green-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                {theme === 'light' && <span className="px-2 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-semibold">ACTIVE</span>}
              </div>
              <div className="font-bold text-gray-800">Day Mode</div>
              <div className="text-xs text-gray-500 mt-1">Bright white background, perfect for daytime.</div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`rounded-2xl p-6 text-left border-2 transition ${
                theme === 'dark' ? 'border-green-600 ring-2 ring-green-200 bg-green-50/40' : 'border-gray-200 hover:border-green-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                {theme === 'dark' && <span className="px-2 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-semibold">ACTIVE</span>}
              </div>
              <div className="font-bold text-gray-800">Night Mode</div>
              <div className="text-xs text-gray-500 mt-1">Dark black background, easy on the eyes at night.</div>
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-4">Your choice is saved and applies to the whole system.</p>
        </>
      ))}
    </div>
  );

  const SessionTab = (
    <div className="space-y-6">
      {sectionCard('Session', '', 'bg-gradient-to-r from-green-50 to-emerald-50', (
        <>
          <dl className="space-y-3 mb-6 bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Signed in as</span>
              <span className="font-semibold text-gray-800">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Account type</span>
              <span className="font-semibold text-gray-800">{roleLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Your QR Card</span>
              <span className="font-semibold text-[#2d6f2d]">{me?.card?.card_number || '—'}</span>
            </div>
          </dl>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-sm"
          >
             Logout from the system
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Logging out will end your session and return you to the sign-in page.
          </p>
        </>
      ))}
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

  // Role-gated sections are dropped from the visible menu and from the
  // rendered tab, so a non-librarian cannot reach the password form even by
  // setting the active key directly.
  const menu = MENU.filter((item) => !item.roles || item.roles.includes(user?.role));
  const allowedKeys = new Set(menu.map((item) => item.key));
  const activeKey = allowedKeys.has(active) ? active : '';

  const content = (
    <div className="space-y-6">
      {/* ===== Profile hero ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2d6f2d] via-[#35804a] to-green-600 text-white p-6 sm:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-green-300/30"></div>
          <div className="absolute -bottom-10 left-1/4 w-48 h-48 rounded-full bg-emerald-400/20"></div>
        </div>
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="rounded-full shadow-lg">
            <UserAvatar user={user || me?.user} size="lg" className="ring-4 ring-white/30" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold">{user?.first_name} {user?.last_name}</h1>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold border border-white/30">
                {roleLabel}
              </span>
            </div>
            <p className="text-green-50 text-sm mt-1">
              {user?.email} {user?.phone ? `• ${user.phone}` : ''}
            </p>
          </div>
          <span className="ml-auto hidden md:flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            {me?.user?.status || user?.status || 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* ===== Settings menu + content ===== */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Menu buttons */}
        <nav className="lg:col-span-1 space-y-2">
          {menu.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition border ${
                activeKey === item.key
                  ? 'bg-[#2d6f2d] text-white border-[#2d6f2d] shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50/50'
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold truncate">{item.label}</span>
                <span className={`block text-[11px] truncate ${activeKey === item.key ? 'text-green-100' : 'text-gray-400'}`}>
                  {item.desc}
                </span>
              </span>
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div key={activeKey} className="lg:col-span-3 min-w-0">
          {activeKey ? (
            tabs[activeKey]
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
              <h3 className="text-xl font-bold text-gray-800">Choose an option from the menu</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                Pick a section on the left to see or update it — Account Information, Activity Snapshot,
                Appearance, Security and more.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isLibrarian ? (
        <AdminLayout>{content}</AdminLayout>
      ) : (
        <UserLayout>{content}</UserLayout>
      )}
    </>
  );
};

export default Settings;