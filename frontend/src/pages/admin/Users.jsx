import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import UserAvatar from '../../components/common/UserAvatar';
import { userService } from '../../services';
import { toast } from 'react-toastify';

const STRONG_PASSWORD_RE = /.{4,}/;

const passwordStrengthError = (p) => {
  if (!p || p.length < 4) return 'Password must be at least 4 characters';
  return null;
};

const roleBadge = (role) => {
  const map = {
    LIBRARIAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    STUDENT: 'bg-blue-50 text-blue-700 border-blue-200',
    TEACHER: 'bg-purple-50 text-purple-700 border-purple-200',
    GUEST: 'bg-gray-50 text-gray-600 border-gray-200'
  };
  return `px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[role] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-amber-100 text-amber-700'
};

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500';

// Staff lead the list, then students, teachers and guests. Anyone holding a
// role outside this list still appears, under "Other", rather than vanishing.
const ROLE_GROUPS = [
  {
    role: 'LIBRARIAN',
    label: 'Library Staff',
    hint: 'Administrators and librarians',
    row: 'bg-emerald-50/70',
    text: 'text-emerald-800',
    count: 'bg-emerald-200/70 text-emerald-900'
  },
  {
    role: 'STUDENT',
    label: 'Students',
    hint: 'Borrow and read library materials',
    row: 'bg-blue-50/70',
    text: 'text-blue-800',
    count: 'bg-blue-200/70 text-blue-900'
  },
  {
    role: 'TEACHER',
    label: 'Teachers',
    hint: 'Staff with borrowing privileges',
    row: 'bg-purple-50/70',
    text: 'text-purple-800',
    count: 'bg-purple-200/70 text-purple-900'
  },
  {
    role: 'GUEST',
    label: 'Guests',
    hint: 'Visitors without a class',
    row: 'bg-gray-100/80',
    text: 'text-gray-800',
    count: 'bg-gray-200/80 text-gray-900'
  }
];

const OTHER_GROUP = {
  role: '__OTHER__',
  label: 'Other',
  hint: 'Accounts with an unrecognised role',
  row: 'bg-amber-50/70',
  text: 'text-amber-800',
  count: 'bg-amber-200/70 text-amber-900'
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'STUDENT', class_name: '' });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'STUDENT', status: 'ACTIVE', class_name: '' });
  const [showEdit, setShowEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [regeneratingQR, setRegeneratingQR] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.list({ limit: 200 });
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.customer_id || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        ((u.class_name || '') + '').toLowerCase().includes(q)
      );
    }
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    if (statusFilter) list = list.filter((u) => (u.status || 'ACTIVE') === statusFilter);
    return list;
  }, [users, search, roleFilter, statusFilter]);

  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const teacherCount = users.filter((u) => u.role === 'TEACHER').length;
  const guestCount = users.filter((u) => u.role === 'GUEST').length;
  const librarianCount = users.filter((u) => u.role === 'LIBRARIAN').length;
  const blockedCount = users.filter((u) => (u.status || 'ACTIVE') === 'BLOCKED').length;

  // Split the filtered list into per-role sections, skipping empty groups so a
  // role nobody uses does not leave an empty heading behind.
  const groupedUsers = useMemo(() => {
    const buckets = new Map(ROLE_GROUPS.map((g) => [g.role, []]));
    const orphans = [];
    for (const u of filteredUsers) {
      const bucket = buckets.get(u.role);
      if (bucket) bucket.push(u);
      else orphans.push(u);
    }
    const groups = ROLE_GROUPS.map((g) => ({ ...g, users: buckets.get(g.role) })).filter((g) => g.users.length > 0);
    if (orphans.length) groups.push({ ...OTHER_GROUP, users: orphans });
    return groups;
  }, [filteredUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const pwError = passwordStrengthError(createForm.password);
    if (pwError) {
      toast.error(pwError);
      return;
    }
    try {
      const res = await userService.create(createForm);
      toast.success(res.data.message);
      setShowModal(false);
      setCreateForm({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'STUDENT', class_name: '' });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const loadDetail = async (id) => {
    try {
      const res = await userService.get(id);
      setDetailUser(res.data);
    } catch (err) {
      toast.error('Failed to load user details');
    }
  };

  const handleBlock = async (id, action) => {
    try {
      const status = action === 'block' ? 'BLOCKED' : 'ACTIVE';
      await userService.block(id, { status });
      toast.success(`User ${action === 'block' ? 'blocked' : 'activated'}`);
      loadUsers();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Permanently delete this account? All their cards, borrowings and fines will be removed. This cannot be undone.')) return;
    try {
      await userService.remove(id);
      toast.success('User deleted permanently');
      loadUsers();
      if (detailUser?.user?.id === id) setDetailUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRegenerateQR = async (userId) => {
    if (!window.confirm('Generate a new QR card? The old card will stop working.')) return;
    setRegeneratingQR(userId);
    try {
      await userService.regenerateQR(userId);
      toast.success('QR card regenerated');
      loadDetail(userId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate QR card');
    } finally {
      setRegeneratingQR(null);
    }
  };

  const openEdit = (user) => {
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'STUDENT',
      status: user.status || 'ACTIVE',
      class_name: user.class_name || '',
      physical_card_no: user.physical_card_no || ''
    });
    setEditUser(user);
    setShowEdit(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await userService.update(editUser.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.status,
        class_name: editForm.class_name,
        physical_card_no: editForm.physical_card_no
      });
      toast.success('User updated successfully');
      setShowEdit(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: users.length, icon: '', tile: 'bg-green-50 border-green-200', text: 'text-[#2d6f2d]', role: '' },
    { label: 'Library Staff', value: librarianCount, icon: '', tile: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', role: 'LIBRARIAN' },
    { label: 'Students', value: studentCount, icon: '', tile: 'bg-blue-50 border-blue-200', text: 'text-blue-600', role: 'STUDENT' },
    { label: 'Teachers', value: teacherCount, icon: '', tile: 'bg-purple-50 border-purple-200', text: 'text-purple-600', role: 'TEACHER' },
    { label: 'Guests', value: guestCount, icon: '', tile: 'bg-gray-50 border-gray-200', text: 'text-gray-600', role: 'GUEST' },
    { label: 'Blocked', value: blockedCount, icon: '', tile: 'bg-red-50 border-red-200', text: 'text-red-600', role: '' }
  ];

  // Print a single member's record. Kept dependency-free so it works even for
  // accounts that have no QR card yet.
  const handlePrintUser = (u) => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rows = [
      ['Member ID', u.customer_id],
      ['Name', name],
      ['Email', u.email],
      ['Phone', u.phone],
      ['Role', u.role],
      ['Class', u.class_name || u.class],
      ['Status', u.status],
      ['Registered', u.created_at ? new Date(u.created_at).toLocaleDateString() : '']
    ];
    const body = rows
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join('');

    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Allow pop-ups to print this member');
      return;
    }
    w.document.write(`
      <html><head><title>${esc(name)} - Member Record</title>
      <style>
        body { font-family: system-ui, sans-serif; color:#1f2937; margin:32px; }
        h1 { font-size:20px; margin:0 0 2px; }
        p.sub { color:#6b7280; margin:0 0 20px; font-size:13px; }
        table { border-collapse:collapse; width:100%; max-width:520px; }
        th { text-align:left; width:150px; padding:8px 10px; background:#f3f4f6;
             border:1px solid #e5e7eb; font-size:12px; text-transform:uppercase; color:#4b5563; }
        td { padding:8px 10px; border:1px solid #e5e7eb; font-size:14px; }
      </style></head>
      <body>
        <h1>${esc(name)}</h1>
        <p class="sub">Hope Haven School Library - Member Record</p>
        <table>${body}</table>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Users</h1>
          <p className="text-gray-500 text-base mt-1">Manage students, teachers, guests & library accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-[#2d6f2d] text-white rounded-lg hover:bg-green-700 shadow font-semibold transition"
        >
          + Add User
        </button>
      </div>

      {/* Stats cards. The role tiles double as quick group filters. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {statCards.map((c) => {
          const selectable = !!c.role;
          const active = selectable && roleFilter === c.role;
          return (
            <button
              key={c.label}
              type="button"
              disabled={!selectable}
              onClick={() => setRoleFilter(active ? '' : c.role)}
              title={selectable ? `Show only ${c.label.toLowerCase()}` : undefined}
              className={`${c.tile} rounded-xl border p-4 flex items-center gap-3 shadow-sm text-left transition ${
                selectable ? 'cursor-pointer hover:shadow-md hover:brightness-[0.98]' : 'cursor-default'
              } ${active ? 'ring-2 ring-[#2d6f2d] ring-offset-1' : ''}`}
            >
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
                <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-800">
                {roleFilter
                  ? ROLE_GROUPS.find((g) => g.role === roleFilter)?.label || 'Filtered'
                  : 'All Users'}
              </h2>
              <p className="text-xs text-gray-500">
                {search
                  ? `Results for "${search}"`
                  : roleFilter
                    ? 'Showing one group only — click the tile again to see everyone'
                    : `Grouped by role · ${groupedUsers.length} group${groupedUsers.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white ring-1 ring-green-200 text-[#2d6f2d] rounded-full text-xs font-semibold">{filteredUsers.length} users</span>
          </div>
        </div>

        {/* Research space */}
        <div className="flex flex-col lg:flex-row gap-2 px-4 py-3 bg-gray-50/60 border-b border-gray-100">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=" Search any user by name, email, phone, class or customer ID..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="GUEST">Guests</option>
            <option value="LIBRARIAN">Librarians</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Borrowing</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12 text-gray-400">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    {search || roleFilter || statusFilter ? 'No users match your search.' : 'No users found yet.'}
                  </td>
                </tr>
              ) : (
                groupedUsers.map((group) => (
                  <React.Fragment key={group.role}>
                    {/* Group heading: which kind of account these rows are */}
                    <tr className={group.row}>
                      <td colSpan="7" className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wide ${group.text}`}>
                            {group.label}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${group.count}`}>
                            {group.users.length}
                          </span>
                          <span className="text-[11px] text-gray-500 font-normal normal-case tracking-normal">
                            {group.hint}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {group.users.map((u) => (
                      <tr key={u.id} className="hover:bg-green-50/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={u} size="sm" />
                        <div>
                          <div className="font-medium">{u.first_name} {u.last_name}</div>
                          <div className="text-xs text-gray-400 font-mono">{u.customer_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {u.email || '-'}
                      {u.phone && <span className="block text-gray-400">{u.phone}</span>}
                    </td>
                    <td className="px-4 py-3"><span className={roleBadge(u.role)}>{u.role}</span></td>
                    <td className="px-4 py-3 text-xs">{u.role === 'STUDENT' ? (u.class_name || '-') : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[u.status || 'ACTIVE'] || 'bg-gray-100 text-gray-500'}`}>{u.status || 'ACTIVE'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.active_borrowings > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700"> {u.active_borrowings} active</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end flex-wrap gap-1.5">
                        <button
                          onClick={() => loadDetail(u.id)}
                          title="View details"
                          className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit user"
                          className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePrintUser(u)}
                          title="Print member record"
                          className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                        >
                          Print
                        </button>
                        {u.role !== 'LIBRARIAN' && (
                          <button
                            onClick={() => handleBlock(u.id, u.status === 'BLOCKED' ? 'activate' : 'block')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              u.status === 'BLOCKED'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title={u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          >
                            {u.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete user"
                          className="px-2.5 py-1 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User detail modal */}
      <Modal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title={`User details — ${detailUser?.user?.first_name || ''} ${detailUser?.user?.last_name || ''}`}
        size="lg"
      >
        {detailUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/40 border border-green-100 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Account</h3>
              <div className="flex items-center gap-3 mb-3">
                <UserAvatar user={detailUser.user} />
                <div>
                  <div className="font-bold text-gray-800">{detailUser.user.first_name} {detailUser.user.last_name}</div>
                  <div className="font-mono text-xs text-gray-400">{detailUser.user.customer_id}</div>
                </div>
              </div>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-700">{detailUser.user.email || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium text-gray-700">{detailUser.user.phone || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd><span className={roleBadge(detailUser.user.role)}>{detailUser.user.role}</span></dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[detailUser.user.status || 'ACTIVE']}`}>{detailUser.user.status || 'ACTIVE'}</span></dd></div>
                {detailUser.user.role === 'STUDENT' && (
                  <div className="flex justify-between"><dt className="text-gray-500">Class</dt><dd className="font-medium text-gray-700">{detailUser.user.class_name || '-'}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd className="font-medium text-gray-700">{detailUser.user.created_at ? new Date(detailUser.user.created_at).toLocaleDateString() : '-'}</dd></div>
              </dl>
              {detailUser.user.blocked_reason && (
                <p className="text-xs text-red-600 mt-3 bg-red-50 border border-red-100 rounded-lg p-2">Blocked: {detailUser.user.blocked_reason}</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">QR Card</h3>
              {detailUser.card ? (
                <>
                  <img src={`http://localhost:5000${detailUser.card.qr_code_url}`} alt="QR" className="w-28 h-28 rounded-lg border border-gray-200 object-contain bg-white mb-3" />
                  <p className="text-xs text-gray-500">Card: <span className="font-mono font-semibold text-gray-700">{detailUser.card.card_number}</span></p>
                  <p className="text-xs text-gray-500 mt-1">Status: <span className="text-green-600 font-medium">{detailUser.card.status}</span></p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-3">No QR card on this account yet.</p>
                  <button
                    onClick={() => handleRegenerateQR(detailUser.user.id)}
                    disabled={regeneratingQR === detailUser.user.id}
                    className="px-3 py-1.5 bg-[#2d6f2d] text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {regeneratingQR === detailUser.user.id ? 'Generating...' : ' Create QR Card'}
                  </button>
                </>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Recent Borrowings</h3>
              {detailUser.borrowings.length === 0 ? (
                <p className="text-xs text-gray-400">No borrowings.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {detailUser.borrowings.slice(0, 6).map((b) => (
                    <li key={b.id} className="py-2 flex justify-between gap-2">
                      <span className="text-xs text-gray-600 truncate">{b.title} <span className="font-mono text-gray-400">({b.copy_code})</span></span>
                      <span className={`text-[10px] shrink-0 px-2 py-0.5 rounded-full font-semibold ${b.status === 'RETURNED' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create user modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New User" size="lg">
        <form onSubmit={handleCreate} autoComplete="off" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
              <input value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
              <input value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input type="email" autoComplete="off" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className={inputCls}>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
              <input type="password" autoComplete="new-password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 4 characters" pattern={STRONG_PASSWORD_RE.source} title="At least 4 characters" className={inputCls} required />
            </div>
          </div>
          {createForm.role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Class / Grade</label>
              <input value={createForm.class_name} onChange={(e) => setCreateForm({ ...createForm, class_name: e.target.value })} placeholder="e.g. Senior 4 or P6" className={inputCls} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#2d6f2d] text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"> Create User</button>
          </div>
        </form>
      </Modal>

      {/* Edit user modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit User — ${editUser?.first_name || ''} ${editUser?.last_name || ''}`} size="lg">
        <form onSubmit={handleSaveEdit} autoComplete="off" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
              <input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
              <input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input type="email" autoComplete="off" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className={inputCls}>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={inputCls}>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
          {editForm.role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Class / Grade</label>
              <input value={editForm.class_name} onChange={(e) => setEditForm({ ...editForm, class_name: e.target.value })} placeholder="e.g. Senior 4 or P6" className={inputCls} />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Physical Card Serial (vendor QR number)</label>
            <input value={editForm.physical_card_no} onChange={(e) => setEditForm({ ...editForm, physical_card_no: e.target.value })} placeholder="e.g. 19848518" className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={savingEdit} className="px-4 py-2 bg-[#2d6f2d] text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition">              {savingEdit ? 'Saving...' : ' Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminUsers;