import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import UserLayout from '../components/layout/UserLayout';
import UserAvatar from '../components/common/UserAvatar';
import Modal from '../components/common/Modal';
import { authService, userService, settingsService, accountRequestService } from '../services';
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

const MEMBERS_MENU_ITEM = { key: 'members', icon: '🧑‍🎓', label: 'Members & Login', desc: 'Create accounts & login options' };

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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'STUDENT', password: '' });
  const [allowEmailLogin, setAllowEmailLogin] = useState(false);
  const [savingLogin, setSavingLogin] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'STUDENT', status: 'ACTIVE' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [savingReset, setSavingReset] = useState(false);
  const [qrUser, setQrUser] = useState(null);
  const [qrCards, setQrCards] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [justCreated, setJustCreated] = useState(null);

  const isLibrarian = user?.role === 'LIBRARIAN';
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await accountRequestService.list();
      setRequests(res.data.requests);
    } catch (err) {
      // ignore — only the librarian can load these
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await userService.list({ limit: 100 });
      setMembers((res.data.data || []).filter((u) => u.role !== 'LIBRARIAN'));
    } catch (err) {
      // ignore
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    authService.getMe()
      .then((res) => setMe(res.data))
      .catch(() => {});
    settingsService.getEmailLogin()
      .then((res) => setAllowEmailLogin(res.data.allowEmailLogin === true))
      .catch(() => {});
    if (isLibrarian) {
      loadRequests();
      loadMembers();
    }
  }, [isLibrarian]);

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
    navigate('/');
  };

  const openCreateModal = () => {
    setPendingRequestId(null);
    setCreateForm({ first_name: '', last_name: '', email: '', phone: '', role: 'STUDENT', password: '' });
    setShowCreate(true);
  };

  const openCreateFromRequest = (req) => {
    setPendingRequestId(req.id);
    setCreateForm({
      first_name: req.first_name,
      last_name: req.last_name,
      email: req.email,
      phone: req.phone || '',
      role: req.role,
      password: ''
    });
    setShowCreate(true);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setCreating(true);
    try {
      const res = await userService.create({
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        email: createForm.email,
        phone: createForm.phone || null,
        role: createForm.role,
        password: createForm.password
      });
      toast.success(`Account created for ${createForm.first_name} ${createForm.last_name} — QR card issued.`);
      setShowCreate(false);
      if (pendingRequestId) {
        try {
          await accountRequestService.updateStatus(pendingRequestId, { status: 'APPROVED' });
        } catch (err) {}
        setPendingRequestId(null);
        await loadRequests();
      }
      await loadMembers();
      // Immediately hand over full control of the account that was just created
      try {
        const detail = await userService.get(res.user.id);
        setJustCreated({ ...detail.user, _card: detail.card });
      } catch (err) {};
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await accountRequestService.updateStatus(id, { status: 'REJECTED' });
      toast.success('Request rejected');
      await loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await accountRequestService.remove(id);
      toast.success('Request removed');
      await loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove request');
    }
  };

  const filteredMembers = memberSearch.trim()
    ? members.filter((m) =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.customer_id || '').toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

  const openEditMember = (m) => {
    setEditUser(m);
    setEditForm({ first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone || '', role: m.role, status: m.status });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await userService.update(editUser.id, editForm);
      toast.success(res.data.message || 'Account updated');
      setEditUser(null);
      await loadMembers();
      if (justCreated?.id === editUser.id) {
        try {
          const d = await userService.get(editUser.id);
          setJustCreated({ ...d.user, _card: d.card });
        } catch (err) {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingReset(true);
    try {
      const res = await userService.resetPassword(resetUser.id, { password: resetPw });
      toast.success(res.data.message);
      setResetUser(null);
      setResetPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSavingReset(false);
    }
  };

  const handleToggleBlock = async (m) => {
    const next = m.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    try {
      const res = await userService.block(m.id, {
        status: next,
        reason: next === 'BLOCKED' ? 'Blocked by the library manager' : null
      });
      toast.success(res.data.message);
      await loadMembers();
      if (justCreated?.id === m.id) {
        try {
          const d = await userService.get(m.id);
          setJustCreated({ ...d.user, _card: d.card });
        } catch (err) {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const openQRCards = async (m) => {
    setQrUser(m);
    setQrCards([]);
    setQrLoading(true);
    try {
      const res = await userService.getQRCards(m.id);
      setQrCards(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load QR cards');
    } finally {
      setQrLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!qrUser) return;
    setRegenerating(true);
    try {
      const res = await userService.regenerateQR(qrUser.id);
      toast.success(`New card ${res.data.card.card_number} issued — old cards deactivated.`);
      const cards = await userService.getQRCards(qrUser.id);
      setQrCards(cards.data.data || []);
      await loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate QR');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteMember = async (m) => {
    const ok = window.confirm(`Delete the account of ${m.first_name} ${m.last_name} (${m.customer_id || m.email})?\n\nThis cannot be undone.`);
    if (!ok) return;
    try {
      const res = await userService.remove(m.id);
      toast.success(res.data.message);
      if (justCreated?.id === m.id) setJustCreated(null);
      await loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const toggleEmailLogin = async () => {
    setSavingLogin(true);
    const next = !allowEmailLogin;
    try {
      const res = await settingsService.setEmailLogin({ allowEmailLogin: next });
      setAllowEmailLogin(res.data.allowEmailLogin === true);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSavingLogin(false);
    }
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

  const MembersTab = (
    <div className="space-y-6">
      {/* Just-created account — full control right away */}
      {justCreated && (
        <div className="rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                {justCreated.first_name?.[0]}{justCreated.last_name?.[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-800">Account created — now under your control</h3>
                  <span className="px-2 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold uppercase">New</span>
                </div>
                <p className="text-sm text-gray-600">
                  {justCreated.first_name} {justCreated.last_name} · {justCreated.role} ·{' '}
                  <span className="font-mono">{justCreated.customer_id}</span> ·{' '}
                  <span className={justCreated.status === 'ACTIVE' ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>{justCreated.status}</span>
                </p>
              </div>
            </div>
            <button onClick={() => setJustCreated(null)} className="text-xs text-gray-400 hover:text-green-700">✓ Done</button>
          </div>

          {justCreated._card && (
            <div className="flex flex-wrap items-center gap-4 bg-white/70 rounded-xl p-4 mb-4">
              <img src={justCreated._card.qr_code_url} alt="QR card" className="w-20 h-20 rounded-lg border border-gray-200 object-contain bg-white" />
              <div className="text-sm">
                <div className="text-xs text-gray-500">QR access card issued</div>
                <div className="font-mono font-bold text-gray-800">{justCreated._card.card_number}</div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  justCreated._card.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{justCreated._card.status}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openEditMember(justCreated)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => { setResetUser(justCreated); setResetPw(''); }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
            >
              🔑 Reset Password
            </button>
            <button
              onClick={() => openQRCards(justCreated)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
            >
              🎫 QR Cards
            </button>
            <button
              onClick={() => handleToggleBlock(justCreated)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                justCreated.status === 'BLOCKED'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {justCreated.status === 'BLOCKED' ? '✓ Unblock' : '🚫 Block'}
            </button>
            <button
              onClick={() => handleDeleteMember(justCreated)}
              className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 text-xs font-medium hover:bg-red-50 transition"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}

      {/* Account requests from members */}
      <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              ✉️ Account Requests <span className="text-xs text-gray-400 font-normal">from students, teachers &amp; guests</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Members ask for an account from the sign-in page when they need another way to enter the library.
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="shrink-0 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>

        {requestsLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="bg-white/70 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-gray-500">No account requests yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              When a student, teacher or guest needs an account, their request will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {requests.map((r) => (
              <div key={r.id} className="bg-white/70 rounded-xl p-4 border border-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800">{r.first_name} {r.last_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 text-primary-700">{r.role}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{r.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                      <span>{r.email}</span>
                      {r.phone && <span>{r.phone}</span>}
                      <span>{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    {r.message && <p className="text-xs text-gray-600 mt-2 italic">"{r.message}"</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openCreateFromRequest(r)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-semibold hover:opacity-90 transition"
                        >
                          ✓ Approve &amp; Create
                        </button>
                        <button
                          onClick={() => handleRejectRequest(r.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteRequest(r.id)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 text-gray-400 text-xs hover:text-red-500 hover:border-red-200 transition"
                      title="Remove request"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create account */}
      <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">🧑‍🎓 Create a new account</h3>
            <p className="text-sm text-gray-500 mt-1">
              Register a student, teacher or guest with their names, email and password. A QR access card is issued automatically.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-hero px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500 shrink-0"
          >
            + Create Account
          </button>
        </div>
      </div>

      {/* Managed accounts — full control after creation */}
      <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">🎛️ Managed Accounts</h3>
            <p className="text-sm text-gray-500 mt-1">
              Full control over every student, teacher and guest account you created.
            </p>
          </div>
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search name, email or customer id..."
            className="w-full sm:w-72 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
          />
        </div>

        {membersLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading accounts...</p>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white/70 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🗂️</div>
            <p className="text-sm text-gray-500">No accounts found.</p>
            <p className="text-xs text-gray-400 mt-1">
              {members.length === 0 ? 'Accounts you create will be listed here and stay under your control.' : 'Try a different search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredMembers.map((m) => (
              <div key={m.id} className={`bg-white/70 rounded-xl p-4 border ${justCreated?.id === m.id ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-100'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {m.first_name?.[0]}{m.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-800">{m.first_name} {m.last_name}</span>
                        {justCreated?.id === m.id && (
                          <span className="px-1.5 py-0.5 rounded bg-green-600 text-white text-[9px] font-bold uppercase">NEW</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 text-primary-700">{m.role}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{m.status}</span>
                        {m.active_borrowings > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">📚 {m.active_borrowings} active</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                        <span className="font-mono">{m.customer_id}</span>
                        <span>{m.email}</span>
                        {m.phone && <span>{m.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => openEditMember(m)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
                      title="Edit account info"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => { setResetUser(m); setResetPw(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
                      title="Reset password"
                    >
                      🔑 Reset Password
                    </button>
                    <button
                      onClick={() => openQRCards(m)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
                      title="View QR cards"
                    >
                      🎫 QR Card
                    </button>
                    <button
                      onClick={() => handleToggleBlock(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        m.status === 'BLOCKED'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {m.status === 'BLOCKED' ? '✓ Unblock' : '🚫 Block'}
                    </button>
                    <button
                      onClick={() => handleDeleteMember(m)}
                      className="px-2 py-1.5 rounded-lg border border-red-200 text-red-400 text-xs hover:bg-red-50 transition"
                      title="Delete account"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email & password login permission */}
      <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">🔑 Email & Password login</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Members normally sign in by scanning their QR card. When QR scanning is not available, the manager can
              allow members to sign in with their email & password instead.
            </p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
              allowEmailLogin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {allowEmailLogin ? 'Members CAN use email & password' : 'Members use QR scanning only'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleEmailLogin}
            disabled={savingLogin}
            className={`relative w-12 h-7 rounded-full transition shrink-0 disabled:opacity-50 ${
              allowEmailLogin ? 'bg-green-500' : 'bg-gray-300'
            }`}
            aria-label="Toggle email & password login"
          >
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${allowEmailLogin ? 'left-[22px]' : 'left-0.5'}`}></span>
          </button>
        </div>
      </div>
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
  if (isLibrarian) tabs.members = MembersTab;

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
          {[...(isLibrarian ? [MEMBERS_MENU_ITEM] : []), ...MENU].map((item) => (
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
              {item.key === 'members' && pendingCount > 0 && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold ${active === item.key ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div key={active} className="lg:col-span-3 animate-fade-up min-w-0">
          {active ? (
            tabs[active]
          ) : (
            <div className="glass-card rounded-2xl border border-white/60 p-8 shadow-sm text-center">
              <div className="text-5xl mb-3 inline-block animate-bounce-soft">⚙️</div>
              <h3 className="text-xl font-bold text-gray-800">Choose an option from the menu</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                Pick a section on the left to see or update it — Account Information, Activity Snapshot,
                {isLibrarian ? ' Members & Login,' : ''} Appearance, Security and more.
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a new account" size="sm">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="text"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="GUEST">Guest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
              required
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="btn-hero w-full px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500 disabled:opacity-50"
          >
            {creating ? 'Creating...' : '🧑‍🎓 Create Account'}
          </button>
        </form>
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit account — ${editUser?.first_name || ''} ${editUser?.last_name || ''}`} size="sm">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={savingEdit}
            className="btn-hero w-full px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500 disabled:opacity-50"
          >
            {savingEdit ? 'Saving...' : '💾 Save Changes'}
          </button>
        </form>
      </Modal>

      <Modal open={!!resetUser} onClose={() => setResetUser(null)} title={`Reset password — ${resetUser?.first_name || ''} ${resetUser?.last_name || ''}`} size="sm">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70"
              required
            />
          </div>
          <p className="text-xs text-gray-400">The member will use this new password to sign in with email &amp; password.</p>
          <button
            type="submit"
            disabled={savingReset}
            className="btn-hero w-full px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500 disabled:opacity-50"
          >
            {savingReset ? 'Resetting...' : '🔑 Reset Password'}
          </button>
        </form>
      </Modal>

      <Modal open={!!qrUser} onClose={() => setQrUser(null)} title={`QR cards — ${qrUser?.first_name || ''} ${qrUser?.last_name || ''} (${qrUser?.customer_id || ''})`} size="sm">
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="w-full px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 disabled:opacity-50 text-sm"
          >
            {regenerating ? 'Generating new card...' : '🔄 Issue a New Card'}
          </button>
          {qrLoading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading cards...</p>
          ) : qrCards.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No QR cards on this account.</p>
          ) : (
            qrCards.map((c) => (
              <div key={c.id} className="bg-white/70 rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                <img src={c.qr_code_url} alt="QR card" className="w-24 h-24 rounded-lg border border-gray-200 object-contain bg-white" />
                <div className="text-sm min-w-0 flex-1 text-center sm:text-left">
                  <div className="font-mono font-semibold">{c.card_number}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    c.status === 'REPLACED' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'
                  }`}>{c.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};

export default Settings;