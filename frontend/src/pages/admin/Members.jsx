import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import UserAvatar from '../../components/common/UserAvatar';
import { userService, settingsService, accountRequestService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const STRONG_PASSWORD_RE = /.{4,}/;

const passwordStrengthError = (p) => {
  if (!p || p.length < 4) return 'Password must be at least 4 characters';
  return null;
};

const roleBadge = (role) => {
  const map = {
    STUDENT: 'bg-green-50 text-green-700 border-green-200',
    TEACHER: 'bg-purple-50 text-purple-700 border-purple-200',
    GUEST: 'bg-blue-50 text-blue-700 border-blue-200',
    LIBRARIAN: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  return `px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[role] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

const statusBadge = (status) => {
  const map = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    BLOCKED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    REPLACED: 'bg-gray-100 text-gray-500'
  };
  return `px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] || 'bg-gray-100 text-gray-500'}`;
};

const AdminMembers = () => {
  const { user } = useAuth();
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
    settingsService.getEmailLogin()
      .then((res) => setAllowEmailLogin(res.data.allowEmailLogin === true))
      .catch(() => {});
    if (isLibrarian) {
      loadRequests();
      loadMembers();
    }
  }, [isLibrarian]);

  const filteredMembers = memberSearch.trim()
    ? members.filter((m) =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.customer_id || '').toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

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
    const pwError = passwordStrengthError(createForm.password);
    if (pwError) {
      toast.error(pwError);
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
    const pwError = passwordStrengthError(resetPw);
    if (pwError) {
      toast.error(pwError);
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

  const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
  const blockedCount = members.filter((m) => m.status === 'BLOCKED').length;
  const studentCount = members.filter((m) => m.role === 'STUDENT').length;
  const teacherCount = members.filter((m) => m.role === 'TEACHER').length;
  const guestCount = members.length - studentCount - teacherCount;

  const breakdown = [
    { label: ' Students', count: studentCount, color: 'bg-blue-500', tile: 'bg-blue-50 border-blue-200 text-blue-600' },
    { label: ' Teachers', count: teacherCount, color: 'bg-purple-500', tile: 'bg-purple-50 border-purple-200 text-purple-600' },
    { label: ' Guests', count: guestCount, color: 'bg-teal-500', tile: 'bg-teal-50 border-teal-200 text-teal-600' },
    { label: ' Total', count: members.length, color: 'bg-[#2d6f2d]', tile: 'bg-green-50 border-green-200 text-[#2d6f2d]' }
  ];
  const totalMembers = members.length || 1;

  const sectionCard = (title, icon, gradient, children) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className={`px-4 py-2.5 ${gradient} border-b border-gray-100 flex items-center gap-2`}>
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Members &amp; Login</h1>
          <p className="text-gray-500 text-base mt-1">Create accounts, manage members and control login options</p>
        </div>
        <button onClick={openCreateModal} className="px-5 py-2.5 bg-[#2d6f2d] text-white rounded-lg hover:bg-green-700 shadow font-semibold transition">          + Create Account</button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pending Requests</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Members</p>
            <p className="text-2xl font-bold text-[#2d6f2d]">{members.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Blocked</p>
            <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Just-created account — full control right away */}
        {justCreated && (
          <div className="bg-white rounded-xl border-2 border-green-300 shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <UserAvatar user={justCreated} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-800">Account created — now under your control</h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold uppercase">New</span>
                  </div>
                  <p className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                    {justCreated.first_name} {justCreated.last_name} · {justCreated.role} ·{' '}
                    <span className="font-mono">{justCreated.customer_id}</span> ·{' '}
                    <span className={statusBadge(justCreated.status)}>{justCreated.status}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setJustCreated(null)} className="text-xs text-gray-400 hover:text-green-700 font-medium"> Done</button>
            </div>

            {justCreated._card && (
              <div className="flex flex-wrap items-center gap-4 bg-green-50/60 border border-green-100 rounded-xl p-4 mb-4">
                <img src={justCreated._card.qr_code_url} alt="QR card" className="w-20 h-20 rounded-lg border border-gray-200 object-contain bg-white" />
                <div className="text-sm">
                  <div className="text-xs text-gray-500">QR access card issued</div>
                  <div className="font-mono font-bold text-gray-800">{justCreated._card.card_number}</div>
                  <span className={`inline-block mt-1 ${statusBadge(justCreated._card.status)}`}>{justCreated._card.status}</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openEditMember(justCreated)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
              >
                Edit
              </button>
              <button
                onClick={() => { setResetUser(justCreated); setResetPw(''); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
              >
                Reset Password
              </button>
              <button
                onClick={() => openQRCards(justCreated)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
              >
                QR Cards
              </button>
              <button
                onClick={() => handleToggleBlock(justCreated)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  justCreated.status === 'BLOCKED'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {justCreated.status === 'BLOCKED' ? ' Unblock' : ' Block'}
              </button>
              <button
                onClick={() => handleDeleteMember(justCreated)}
                className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-500 text-xs font-medium hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Account requests from members */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Account Requests</h2>
                <p className="text-xs text-gray-500">
                  Members ask for an account from the sign-in page when they need another way to enter the library.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <span className="px-2.5 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">{pendingCount} pending</span>
                )}
                <span className="px-2.5 py-1 bg-white ring-1 ring-amber-200 text-amber-700 rounded-full text-xs font-semibold">{requests.length} requests</span>
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Requested</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requestsLoading ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400">Loading requests...</td></tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-400">
                      No account requests yet.<br />
                      <span className="text-xs text-gray-400">When a student, teacher or guest needs an account, their request will appear here.</span>
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.first_name} {r.last_name}</div>
                        <div className="text-xs text-gray-400">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                      </td>
                      <td className="px-4 py-3"><span className={roleBadge(r.role)}>{r.role}</span></td>
                      <td className="px-4 py-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {r.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openCreateFromRequest(r)}
                                className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                              >
                                Approve &amp; Create
                              </button>
                              <button
                                onClick={() => handleRejectRequest(r.id)}
                                className="px-2.5 py-1 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(r.id)}
                            className="px-2 py-1 border border-gray-200 text-gray-400 rounded-lg text-xs hover:text-red-500 hover:border-red-200 transition"
                            title="Remove request"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create account */}
        {sectionCard('Create a New Account', '', 'bg-gradient-to-r from-green-50 to-emerald-50', (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Register a student, teacher or guest with their names, email and password. A QR access card is issued automatically.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="shrink-0 px-5 py-2.5 rounded-lg font-semibold text-white bg-[#2d6f2d] hover:bg-green-700 transition"
            >
              + Create Account
            </button>
          </div>
        ))}

        {/* Managed accounts — full control after creation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 border-b border-blue-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Managed Accounts</h2>
                <p className="text-xs text-gray-500">
                  {memberSearch ? `Results for "${memberSearch}"` : 'Full control over every student, teacher and guest account you created.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder=" Search name, email or id..."
                    className="w-full sm:w-64 pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <span className="px-2.5 py-1 bg-white ring-1 ring-blue-200 text-blue-700 rounded-full text-xs font-semibold">{filteredMembers.length} members</span>
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Borrowing</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {membersLoading ? (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-400">Loading accounts...</td></tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      No accounts found.<br />
                      <span className="text-xs text-gray-400">
                        {members.length === 0 ? 'Accounts you create will be listed here and stay under your control.' : 'Try a different search.'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className={`transition ${justCreated?.id === m.id ? 'bg-green-50/60 hover:bg-green-50' : 'hover:bg-blue-50/40'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={m} size="sm" />
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              {m.first_name} {m.last_name}
                              {justCreated?.id === m.id && (
                                <span className="px-1.5 py-0.5 rounded bg-green-600 text-white text-[9px] font-bold uppercase">NEW</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">{m.customer_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={roleBadge(m.role)}>{m.role}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {m.email}
                        {m.phone && <span className="block text-gray-400">{m.phone}</span>}
                      </td>
                      <td className="px-4 py-3"><span className={statusBadge(m.status)}>{m.status}</span></td>
                      <td className="px-4 py-3">
                        {m.active_borrowings > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700"> {m.active_borrowings} active</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEditMember(m)}
                            className="px-2 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                            title="Edit account info"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setResetUser(m); setResetPw(''); }}
                            className="px-2 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                            title="Reset password"
                          >
                            🔑
                          </button>
                          <button
                            onClick={() => openQRCards(m)}
                            className="px-2 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                            title="View QR cards"
                          >
                            🎫
                          </button>
                          <button
                            onClick={() => handleToggleBlock(m)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                              m.status === 'BLOCKED'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title={m.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          >
                            {m.status === 'BLOCKED' ? '✓' : '🚫'}
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m)}
                            className="px-2 py-1 border border-red-200 text-red-400 rounded-lg text-xs hover:bg-red-50 transition"
                            title="Delete account"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email & password login permission */}
        {sectionCard('Login Options', '', 'bg-gradient-to-r from-violet-50 to-purple-50', (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">Email &amp; Password login</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                Members normally sign in by scanning their QR card. When QR scanning is not available, the manager can
                allow members to sign in with their email &amp; password instead.
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
        ))}

        {/* Member breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">Member Breakdown</h2>
                <p className="text-xs text-gray-500">Who uses the library — by account type</p>
              </div>
              <span className="px-2.5 py-1 bg-white ring-1 ring-green-200 text-[#2d6f2d] rounded-full text-xs font-semibold">{members.length} members</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Account Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Count</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.map((b) => (
                  <tr key={b.label} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg border text-sm ${b.tile}`}> </span>
                      <span className="ml-2 font-medium">{b.label}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{b.count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[240px] h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.round((b.count / totalMembers) * 100)}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{Math.round((b.count / totalMembers) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a new account" size="lg">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First name</label>
              <input
                type="text"
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last name</label>
              <input
                type="text"
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Account type</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="GUEST">Guest</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
            <input
              type="password"
              autoComplete="new-password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Min 4 characters"
              pattern={STRONG_PASSWORD_RE.source}
              title="At least 4 characters"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full px-6 py-2.5 rounded-lg font-semibold text-white bg-[#2d6f2d] hover:bg-green-700 disabled:opacity-50 transition"
          >
            {creating ? 'Creating...' : ' Create Account'}
          </button>
        </form>
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit account — ${editUser?.first_name || ''} ${editUser?.last_name || ''}`} size="lg">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First name</label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last name</label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Account type</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            className="w-full px-6 py-2.5 rounded-lg font-semibold text-white bg-[#2d6f2d] hover:bg-green-700 disabled:opacity-50 transition"
          >
            {savingEdit ? 'Saving...' : ' Save Changes'}
          </button>
        </form>
      </Modal>

      <Modal open={!!resetUser} onClose={() => setResetUser(null)} title={`Reset password — ${resetUser?.first_name || ''} ${resetUser?.last_name || ''}`} size="sm">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
              placeholder="Min 4 characters"
              pattern={STRONG_PASSWORD_RE.source}
              title="At least 4 characters"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <p className="text-xs text-gray-400">The member will use this new password to sign in with email &amp; password.</p>
          <button
            type="submit"
            disabled={savingReset}
            className="w-full px-6 py-2.5 rounded-lg font-semibold text-white bg-[#2d6f2d] hover:bg-green-700 disabled:opacity-50 transition"
          >
            {savingReset ? 'Resetting...' : ' Reset Password'}
          </button>
        </form>
      </Modal>

      <Modal open={!!qrUser} onClose={() => setQrUser(null)} title={`QR cards — ${qrUser?.first_name || ''} ${qrUser?.last_name || ''} (${qrUser?.customer_id || ''})`} size="sm">
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="w-full px-4 py-2.5 rounded-lg font-semibold text-white bg-[#2d6f2d] hover:bg-green-700 disabled:opacity-50 text-sm transition"
          >
            {regenerating ? 'Generating new card...' : ' Issue a New Card'}
          </button>
          {qrLoading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading cards...</p>
          ) : qrCards.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No QR cards on this account.</p>
          ) : (
            qrCards.map((c) => (
              <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <img src={c.qr_code_url} alt="QR card" className="w-24 h-24 rounded-lg border border-gray-200 object-contain bg-white" />
                <div className="text-sm min-w-0 flex-1 text-center sm:text-left">
                  <div className="font-mono font-semibold text-gray-800">{c.card_number}</div>
                  <span className={`inline-block mt-1 ${statusBadge(c.status)}`}>{c.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminMembers;