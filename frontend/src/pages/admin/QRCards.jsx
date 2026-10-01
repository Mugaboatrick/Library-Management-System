import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import UserAvatar from '../../components/common/UserAvatar';
import { userService } from '../../services';
import { buildLibraryCardDataUrl, downloadCardImage } from '../../utils/cardRenderer';
import { toast } from 'react-toastify';

const roleBadge = (role) => {
  const map = {
    LIBRARIAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    STUDENT: 'bg-blue-50 text-blue-700 border-blue-200',
    TEACHER: 'bg-purple-50 text-purple-700 border-purple-200',
    GUEST: 'bg-gray-50 text-gray-600 border-gray-200'
  };
  return `px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[role] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

const statusClasses = {
  ACTIVE: 'bg-green-100 text-green-700',
  REPLACED: 'bg-amber-100 text-amber-700',
  BLOCKED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-gray-100 text-gray-500'
};

const statusBadge = (status) => `px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusClasses[status] || 'bg-gray-100 text-gray-500'}`;

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500';

const AdminQRCards = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [qrImages, setQrImages] = useState({});
  const [regenerating, setRegenerating] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(null);
  const [selected, setSelected] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserId, setCreateUserId] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [editInfo, setEditInfo] = useState(null);
  const [editForm, setEditForm] = useState({ card_number: '', status: '', first_name: '', last_name: '', email: '', phone: '', role: '', member_status: '', class_name: '', physical_card_no: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.list({ limit: 100 });

      const usersWithCards = await Promise.all(
        res.data.data.map(async (u) => {
          try {
            const detail = await userService.get(u.id);
            const cardsRes = await userService.getQRCards(u.id);
            return { ...u, card: detail.data.card, allCards: cardsRes.data.data || [] };
          } catch {
            return { ...u, card: null, allCards: [] };
          }
        })
      );

      setUsers(usersWithCards);

      const images = {};
      for (const u of usersWithCards) {
        if (u.card?.qr_code_data) {
          try {
            images[u.id] = await QRCode.toDataURL(u.card.qr_code_data, {
              width: 480, margin: 2,
              color: { dark: '#000000', light: '#ffffff' },
              errorCorrectionLevel: 'H'
            });
          } catch {
            images[u.id] = null;
          }
        }
      }
      setQrImages(images);
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
        ((u.class_name || '') + '').toLowerCase().includes(q) ||
        (u.card?.card_number || '').toLowerCase().includes(q) ||
        (u.allCards || []).some((c) => (c.card_number || '').toLowerCase().includes(q))
      );
    }
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    if (statusFilter === 'NONE') list = list.filter((u) => !u.card);
    else if (statusFilter) list = list.filter((u) => u.card?.status === statusFilter);
    return list;
  }, [users, search, roleFilter, statusFilter]);

  const issuedCards = users.reduce((n, u) => n + (u.allCards?.length || 0), 0);
  const activeCards = users.reduce((n, u) => n + (u.allCards || []).filter((c) => c.status === 'ACTIVE').length, 0);
  const membersWithCards = users.filter((u) => (u.allCards?.length || 0) > 0).length;
  const noCardCount = users.length - membersWithCards;

  const handleCreateQR = async (userId) => {
    if (!window.confirm('A new QR access card will be created for this user. The user can then present this card to sign in at the library. Continue?')) return;
    setGeneratingQR(userId);
    try {
      await userService.regenerateQR(userId);
      toast.success('QR card created');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create QR card');
    } finally {
      setGeneratingQR(null);
    }
  };

  const handleRegenerateQR = async (userId) => {
    if (!window.confirm("You are about to regenerate this user's QR access card. Please note that the current card will stop working immediately once the new one is created. Continue?")) return;
    setRegenerating(userId);
    try {
      await userService.regenerateQR(userId);
      toast.success('QR card regenerated');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate QR card');
    } finally {
      setRegenerating(null);
    }
  };

  const handleDeleteCard = async (userId, cardId) => {
    if (!window.confirm('Are you sure you want to permanently delete this QR access card? The user will no longer be able to sign in by scanning this card until a new one is issued. This action cannot be undone.')) return;
    try {
      await userService.deleteQRCard(userId, cardId);
      toast.success('Card deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete card');
    }
  };

  const handleUpdateCard = async (userId, cardId) => {
    setSavingEdit(true);
    try {
      const cardData = {};
      if (editForm.status) cardData.status = editForm.status;
      if (editForm.card_number) cardData.card_number = editForm.card_number;
      await userService.updateQRCard(userId, cardId, cardData);

      const userData = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.member_status,
        class_name: editForm.class_name,
        physical_card_no: editForm.physical_card_no
      };
      const user = users.find(u => u.id === userId);
      const changed = user && (user.first_name !== editForm.first_name || user.last_name !== editForm.last_name || user.email !== editForm.email || user.phone !== editForm.phone || user.role !== editForm.role || user.status !== editForm.member_status || user.class_name !== editForm.class_name || user.physical_card_no !== editForm.physical_card_no);
      if (user && changed) {
        await userService.update(userId, userData);
      }

      toast.success('Card updated');
      setEditInfo(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update card');
    } finally {
      setSavingEdit(false);
    }
  };

  const openEditCard = (user, card) => {
    setEditInfo({ userId: user.id, cardId: card.id });
    setEditForm({
      card_number: card.card_number,
      status: card.status,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      member_status: user.status,
      class_name: user.class_name || '',
      physical_card_no: user.physical_card_no || ''
    });
  };

  const handleDownload = async (user) => {
    const img = qrImages[user.id];
    if (!img) return;
    const roleLabel = user.role?.charAt(0) + user.role?.slice(1).toLowerCase();
    try {
      setGeneratingQR(user.id);
      const dataUrl = await buildLibraryCardDataUrl({
        qrUrl: img,
        customerId: user.customer_id,
        name: `${user.first_name} ${user.last_name}`,
        roleLabel,
        cardNumber: user.card?.card_number,
        // Printed on the card face, never encoded into the QR. The password is
        // deliberately not passed: a credential must not sit on a card image.
        email: user.email,
        phone: user.phone,
        className: user.class_name
      });
      downloadCardImage(dataUrl, `${user.customer_id}_library_card.png`);
      toast.success('Library card image downloaded');
    } catch {
      toast.error('Failed to export card image');
    } finally {
      setGeneratingQR(null);
    }
  };

  const handleCreateForUser = async () => {
    if (!createUserId) { toast.error('Select a user'); return; }
    const uid = parseInt(createUserId);
    const user = users.find(u => u.id === uid);
    if (!user) return;
    const msg = user.card
      ? 'This user already has an active QR access card. Generating a new one will immediately deactivate the current card. Do you wish to continue?'
      : `A new QR access card will be issued to ${user.first_name} ${user.last_name}, allowing them to sign in to the library. Continue?`;
    if (!window.confirm(msg)) return;
    setGeneratingQR(uid);
    try {
      await userService.regenerateQR(uid);
      toast.success('QR card created');
      setShowCreateModal(false);
      setCreateUserId('');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setGeneratingQR(null);
    }
  };

  const toggleSelect = (userId) => {
    setSelected(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const selectAll = () => {
    const cardsWithQR = users.filter(u => qrImages[u.id]);
    const allSelected = cardsWithQR.length > 0 && cardsWithQR.every(u => selected[u.id]);
    const newSel = {};
    if (!allSelected) cardsWithQR.forEach(u => { newSel[u.id] = true; });
    setSelected(newSel);
  };

  const selectedIds = Object.keys(selected).filter(id => selected[id]);

  const buildCardHTML = (user) => {
    const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();
    const imgSrc = qrImages[user.id] || '';
    const cardNum = user.card?.card_number || 'N/A';
    return `
      <div class="qr-card">
        <img src="/hope-logo.png" style="height:40px;margin:0 auto 10px" />
        <div class="card-header">Hope Haven School Library</div>
        <div class="card-sub">Smart Library Access Card</div>
        <img src="${imgSrc}" class="qr-img" />
        <div class="member-id">${user.customer_id}</div>
        <div class="member-name">${user.first_name} ${user.last_name}</div>
        <div class="member-role">${roleLabel}</div>
        <div class="card-number">Card: ${cardNum}</div>
      </div>`;
  };

  const printSingle = (user) => {
    const html = `<!DOCTYPE html><html><head><title>QR Card - ${user.customer_id}</title>
      <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;font-family:Arial}
      .qr-card{text-align:center;border:2px solid #334155;background:#ffffff;padding:25px;border-radius:12px;width:420px}
      .card-header{font-size:18px;font-weight:bold;color:#1e293b}.card-sub{font-size:11px;color:#64748b;margin-bottom:15px}
      .qr-img{width:340px;height:340px;margin:10px 0}.member-id{font-family:monospace;font-size:18px;font-weight:bold;margin:8px 0 4px;color:#1e293b}
      .member-name{font-size:14px}.member-role{font-size:12px;color:#64748b}.card-number{font-size:11px;color:#64748b;margin-top:8px;font-family:monospace}</style></head><body>${buildCardHTML(user)}</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  const printAll = () => {
    const selectedUsers = users.filter(u => selected[u.id] && qrImages[u.id]);
    if (selectedUsers.length === 0) { toast.error('Select at least one card with QR'); return; }
    const cards = selectedUsers.map(u => buildCardHTML(u)).join('');
    const html = `<!DOCTYPE html><html><head><title>QR Cards</title>
      <style>@media print{body{margin:0}}body{font-family:Arial;padding:10px}
      .qr-card{text-align:center;border:2px solid #334155;background:#ffffff;padding:20px;border-radius:12px;width:380px;display:inline-block;margin:8px;page-break-inside:avoid;vertical-align:top}
      .card-header{font-size:16px;font-weight:bold;color:#1e293b}.card-sub{font-size:10px;color:#64748b;margin-bottom:10px}
      .qr-img{width:280px;height:280px;margin:8px 0}.member-id{font-family:monospace;font-size:16px;font-weight:bold;margin:6px 0 3px;color:#1e293b}
      .member-name{font-size:13px}.member-role{font-size:11px;color:#64748b}.card-number{font-size:10px;color:#64748b;margin-top:6px;font-family:monospace}</style></head><body>
      <h2 style="text-align:center;margin:10px 0">Hope Haven School Library - QR Cards (${selectedUsers.length})</h2>${cards}</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  const allSelected = users.filter(u => qrImages[u.id]).length > 0 && users.filter(u => qrImages[u.id]).every(u => selected[u.id]);

  const statCards = [
    { label: 'Cards Issued', value: issuedCards, icon: '', tile: 'bg-green-50 border-green-200', text: 'text-[#2d6f2d]' },
    { label: 'Active Cards', value: activeCards, icon: '', tile: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600' },
    { label: 'Members with Cards', value: membersWithCards, icon: '', tile: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
    { label: 'No Card Yet', value: noCardCount, icon: '', tile: 'bg-amber-50 border-amber-200', text: 'text-amber-600' }
  ];

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">QR Cards</h1>
          <p className="text-gray-500 text-base mt-1">Create, edit, delete, download and print library QR access cards</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button onClick={printAll} className="px-4 py-2.5 bg-[#2d6f2d] text-white rounded-lg text-sm font-semibold hover:bg-green-700 shadow transition flex items-center gap-2">               Print Selected ({selectedIds.length})</button>
          )}
          <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-[#2d6f2d] text-white rounded-lg hover:bg-green-700 shadow font-semibold transition">            + Create QR Card</button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50/60 border-b border-green-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-800">QR Access Cards</h2>
              <p className="text-xs text-gray-500">
                {search ? `Results for "${search}"` : 'Every member card — searchable by member or card number'}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white ring-1 ring-green-200 text-[#2d6f2d] rounded-full text-xs font-semibold">{filteredUsers.length} members</span>
          </div>
        </div>

        {/* Research space */}
        <div className="flex flex-col lg:flex-row gap-2 px-4 py-3 bg-gray-50/60 border-b border-gray-100">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=" Search member or card number..."
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
            <option value="">All Card Status</option>
            <option value="ACTIVE">Active</option>
            <option value="REPLACED">Replaced</option>
            <option value="BLOCKED">Blocked</option>
            <option value="INACTIVE">Inactive</option>
            <option value="NONE">No card</option>
          </select>
          {users.filter(u => qrImages[u.id]).length > 0 && (
            <button
              onClick={selectAll}
              className={`px-3 py-2 rounded-lg text-sm border transition ${
                allSelected ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-10"></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">QR Card</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cards</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-gray-400">Loading cards...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    {search || roleFilter || statusFilter ? 'No cards match your search.' : 'No members found yet.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <React.Fragment key={u.id}>
                    <tr className={`transition ${expandedUser === u.id ? 'bg-green-50/40' : 'hover:bg-green-50/30'}`}>
                      <td className="px-4 py-3">
                        {qrImages[u.id] ? (
                          <input
                            type="checkbox"
                            checked={!!selected[u.id]}
                            onChange={() => toggleSelect(u.id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            title="Select to print"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={u} size="sm" />
                          <div>
                            <div className="font-medium">{u.first_name} {u.last_name}</div>
                            <div className="text-xs text-gray-400 font-mono">{u.customer_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {qrImages[u.id] ? (
                          <div className="flex items-center gap-3">
                            <img src={qrImages[u.id]} alt="QR" className="w-14 h-14 rounded-lg border border-gray-200 bg-white object-contain" />
                            <div>
                              <div className="font-mono text-xs font-semibold">{u.card?.card_number}</div>
                              <span className={statusBadge(u.card?.status)}>{u.card?.status}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-[10px]">No QR</div>
                        )}
                      </td>
                      <td className="px-4 py-3"><span className={roleBadge(u.role)}>{u.role}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                            {u.allCards?.length || 0} card{(u.allCards?.length || 0) === 1 ? '' : 's'}
                          </span>
                          {u.allCards?.length > 0 && (
                            <button
                              onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                              className="text-[11px] font-medium text-[#2d6f2d] hover:underline"
                            >
                              {expandedUser === u.id ? 'Hide' : 'View all'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end flex-wrap gap-1.5">
                          {u.card && qrImages[u.id] && (
                            <>
                              <button
                                onClick={() => handleDownload(u)}
                                disabled={generatingQR === u.id}
                                className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition disabled:opacity-50"
                                title="Download card image"
                              >
                                {generatingQR === u.id ? '...' : 'Download'}
                              </button>
                              <button
                                onClick={() => printSingle(u)}
                                className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                                title="Print single card"
                              >
                                Print
                              </button>
                            </>
                          )}
                          {/* Issue / regenerate */}
                          <button
                            onClick={() => (u.card ? handleRegenerateQR(u.id) : handleCreateQR(u.id))}
                            disabled={generatingQR === u.id || regenerating === u.id}
                            className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-200 transition disabled:opacity-50"
                            title={u.card ? 'Issue a replacement card' : 'Create QR card'}
                          >
                            {generatingQR === u.id || regenerating === u.id
                              ? '...'
                              : u.card ? 'Reissue' : 'Create'}
                          </button>
                          {/* Edit primary card */}
                          {u.card && (
                            <button
                              onClick={() => openEditCard(u, u.card)}
                              className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                              title="Edit card"
                            >
                              Edit
                            </button>
                          )}
                          {/* Delete primary card */}
                          {u.card && (
                            <button
                              onClick={() => handleDeleteCard(u.id, u.card.id)}
                              className="px-2.5 py-1 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition"
                              title="Delete card"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedUser === u.id && (
                      <tr>
                        <td colSpan="6" className="px-4 py-4 bg-green-50/30">
                          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50/60 border-b border-blue-100">
                              <h4 className="text-sm font-bold text-gray-800">All cards — {u.first_name} {u.last_name}</h4>
                              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white ring-1 ring-blue-200 text-blue-700">{u.allCards?.length || 0} cards</span>
                            </div>
                            <div className="table-wrap">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Card Number</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Issued</th>
                                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {u.allCards.map((card) => (
                                    <tr key={card.id} className="hover:bg-gray-50 transition">
                                      <td className="px-4 py-2.5 font-mono text-xs font-semibold">{card.card_number}</td>
                                      <td className="px-4 py-2.5"><span className={statusBadge(card.status)}>{card.status}</span></td>
                                      <td className="px-4 py-2.5 text-xs text-gray-500">{card.created_at ? new Date(card.created_at).toLocaleDateString() : '-'}</td>
                                      <td className="px-4 py-2.5">
                                        <div className="flex justify-end gap-1.5">
                                          <button
                                            onClick={() => openEditCard(u, card)}
                                            className="px-2 py-1 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCard(u.id, card.id)}
                                            className="px-2 py-1 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create QR Card Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create QR Card" size="md">
        <p className="text-sm text-gray-500 mb-4">Select a user to create a QR card for. If they already have one, a new card replaces it.</p>
        <select
          value={createUserId}
          onChange={(e) => setCreateUserId(e.target.value)}
          className={`${inputCls} mb-4`}
        >
          <option value="">-- Select user --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.customer_id} — {u.first_name} {u.last_name} ({u.role}) {u.card ? ' Has card' : ' No card'}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button
            onClick={handleCreateForUser}
            disabled={!createUserId || generatingQR}
            className="px-4 py-2 bg-[#2d6f2d] text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
          >
            {generatingQR ? 'Creating...' : ' Create QR Card'}
          </button>
        </div>
      </Modal>

      {/* Edit card modal */}
      <Modal
        open={!!editInfo}
        onClose={() => setEditInfo(null)}
        title={`Edit QR card — ${editForm.first_name || ''} ${editForm.last_name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
              <input value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
              <input value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
              <input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
              <select value={editForm.role || 'STUDENT'} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className={inputCls}>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Member Status</label>
              <select value={editForm.member_status || 'ACTIVE'} onChange={(e) => setEditForm({ ...editForm, member_status: e.target.value })} className={inputCls}>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>
          {editForm.role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Class / Grade</label>
              <input value={editForm.class_name || ''} onChange={(e) => setEditForm({ ...editForm, class_name: e.target.value })} placeholder="e.g. S1" className={inputCls} />
            </div>
          )}
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Card Number</label>
                <input value={editForm.card_number || ''} onChange={(e) => setEditForm({ ...editForm, card_number: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Card Status</label>
                <select value={editForm.status || 'ACTIVE'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={inputCls}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="REPLACED">Replaced</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Physical Card Serial (vendor QR number)</label>
              <input value={editForm.physical_card_no || ''} onChange={(e) => setEditForm({ ...editForm, physical_card_no: e.target.value })} placeholder="e.g. 19848518" className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => setEditInfo(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button
              onClick={() => editInfo && handleUpdateCard(editInfo.userId, editInfo.cardId)}
              disabled={savingEdit}
              className="px-4 py-2 bg-[#2d6f2d] text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
            >
              {savingEdit ? 'Saving...' : ' Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminQRCards;