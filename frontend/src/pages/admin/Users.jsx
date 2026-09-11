import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { userService } from '../../services';
import { toast } from 'react-toastify';

const roleColors = {
  LIBRARIAN: 'bg-purple-100 text-purple-700',
  STUDENT: 'bg-blue-100 text-blue-700',
  TEACHER: 'bg-green-100 text-green-700',
  GUEST: 'bg-amber-100 text-amber-700'
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700'
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'STUDENT' });
  const [regeneratingQR, setRegeneratingQR] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userService.list(params);
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.create(createForm);
      toast.success(res.data.message);
      setShowModal(false);
      setCreateForm({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'STUDENT' });
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

  const toggleDetail = (user) => {
    if (detailUser && detailUser.user.id === user.id) {
      setDetailUser(null);
    } else {
      setDetailUser(null);
      loadDetail(user.id);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm">Manage students, teachers, guests & library accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Add User
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or customer ID..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="GUEST">Guest</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Borrowings</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{user.customer_id}</td>
                    <td className="px-4 py-3">{user.first_name} {user.last_name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100'}`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status] || 'bg-gray-100'}`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3">{user.active_borrowings || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleDetail(user)} className="text-primary-600 hover:underline text-xs">View</button>
                        {user.role !== 'LIBRARIAN' && (
                          user.status === 'BLOCKED'
                            ? <button onClick={() => handleBlock(user.id, 'activate')} className="text-green-600 hover:underline text-xs">Unblock</button>
                            : <button onClick={() => handleBlock(user.id, 'block')} className="text-red-600 hover:underline text-xs">Block</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {detailUser?.user?.id === user.id && (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Account</h3>
                            <p className="text-xs text-gray-500">Customer ID: <span className="font-mono">{detailUser.user.customer_id}</span></p>
                            <p className="text-xs text-gray-500">Phone: {detailUser.user.phone || '-'}</p>
                            <p className="text-xs text-gray-500">Created: {new Date(detailUser.user.created_at).toLocaleDateString()}</p>
                            {detailUser.user.blocked_reason && (
                              <p className="text-xs text-red-600 mt-1">Blocked: {detailUser.user.blocked_reason}</p>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-700 mb-2">QR Card</h3>
                            {detailUser.card ? (
                              <>
                                <p className="text-xs text-gray-500">Card: <span className="font-mono">{detailUser.card.card_number}</span></p>
                                <img src={`http://localhost:5000${detailUser.card.qr_code_url}`} alt="QR" className="w-20 h-20 mt-2 rounded border" />
                                <button
                                  onClick={() => handleRegenerateQR(detailUser.user.id)}
                                  disabled={regeneratingQR === detailUser.user.id}
                                  className="mt-2 text-xs text-red-600 hover:underline disabled:opacity-50"
                                >
                                  {regeneratingQR === detailUser.user.id ? 'Regenerating...' : 'Regenerate QR Card'}
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-gray-400 mb-2">No QR card</p>
                                <button
                                  onClick={() => handleRegenerateQR(detailUser.user.id)}
                                  disabled={regeneratingQR === detailUser.user.id}
                                  className="px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                  {regeneratingQR === detailUser.user.id ? 'Generating...' : 'Create QR Card'}
                                </button>
                              </>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Recent Borrowings</h3>
                            {detailUser.borrowings.length === 0 ? (
                              <p className="text-xs text-gray-400">No borrowings</p>
                            ) : (
                              <ul className="text-xs space-y-1">
                                {detailUser.borrowings.slice(0, 5).map((b) => (
                                  <li key={b.id} className="flex justify-between">
                                    <span className="text-gray-600">{b.title} ({b.copy_code})</span>
                                    <span className={`${b.status === 'RETURNED' ? 'text-gray-400' : 'text-amber-600'}`}>{b.status}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New User">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password (default: guest123)</label>
              <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Leave blank for default" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Create User</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminUsers;
