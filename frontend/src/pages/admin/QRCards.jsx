import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import AdminLayout from '../../components/layout/AdminLayout';
import { userService } from '../../services';
import { buildLibraryCardDataUrl, downloadCardImage } from '../../utils/cardRenderer';
import { toast } from 'react-toastify';

const AdminQRCards = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [qrImages, setQrImages] = useState({});
  const [regenerating, setRegenerating] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(null);
  const [selected, setSelected] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserId, setCreateUserId] = useState('');
  const [userCards, setUserCards] = useState({});
  const [expandedUser, setExpandedUser] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [editForm, setEditForm] = useState({ card_number: '', status: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await userService.list(params);

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
              width: 200, margin: 1,
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
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

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
    if (!window.confirm('You are about to regenerate this user\'s QR access card. Please note that the current card will stop working immediately once the new one is created. Continue?')) return;
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
    try {
      const data = {};
      if (editForm.status) data.status = editForm.status;
      if (editForm.card_number) data.card_number = editForm.card_number;
      await userService.updateQRCard(userId, cardId, data);
      toast.success('Card updated');
      setEditCard(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update card');
    }
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
        cardNumber: user.card?.card_number
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
      ? `This user already has an active QR access card. Generating a new one will immediately deactivate the current card. Do you wish to continue?`
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
    const allSelected = cardsWithQR.every(u => selected[u.id]);
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
      .qr-card{text-align:center;border:2px solid #334155;background:#ffffff;padding:25px;border-radius:12px;width:300px}
      .card-header{font-size:18px;font-weight:bold;color:#1e293b}.card-sub{font-size:11px;color:#64748b;margin-bottom:15px}
      .qr-img{width:180px;height:180px;margin:10px 0}.member-id{font-family:monospace;font-size:18px;font-weight:bold;margin:8px 0 4px;color:#1e293b}
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
      .qr-card{text-align:center;border:2px solid #334155;background:#ffffff;padding:20px;border-radius:12px;width:280px;display:inline-block;margin:8px;page-break-inside:avoid;vertical-align:top}
      .card-header{font-size:16px;font-weight:bold;color:#1e293b}.card-sub{font-size:10px;color:#64748b;margin-bottom:10px}
      .qr-img{width:160px;height:160px;margin:8px 0}.member-id{font-family:monospace;font-size:16px;font-weight:bold;margin:6px 0 3px;color:#1e293b}
      .member-name{font-size:13px}.member-role{font-size:11px;color:#64748b}.card-number{font-size:10px;color:#64748b;margin-top:6px;font-family:monospace}</style></head><body>
      <h2 style="text-align:center;margin:10px 0">Hope Haven School Library - QR Cards (${selectedUsers.length})</h2>${cards}</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  const usersWithQR = users.filter(u => qrImages[u.id]);
  const allSelected = usersWithQR.length > 0 && usersWithQR.every(u => selected[u.id]);

  const statusColors = { ACTIVE: 'bg-green-100 text-green-700', REPLACED: 'bg-yellow-100 text-yellow-700', BLOCKED: 'bg-red-100 text-red-700', INACTIVE: 'bg-gray-100 text-gray-500' };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">QR Card Management</h1>
          <p className="text-gray-500 text-sm">Create, edit, delete, download, and print library QR access cards</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
            + Create QR Card
          </button>
          {selectedIds.length > 0 && (
            <button onClick={printAll} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center gap-2">
              🖨 Print Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or customer ID..." className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none">
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="GUEST">Guest</option>
        </select>
        {usersWithQR.length > 0 && (
          <button onClick={selectAll} className={`px-4 py-2 rounded-lg text-sm border ${allSelected ? 'bg-primary-100 text-primary-700 border-primary-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((u) => (
            <div key={u.id} className={`card-hover bg-white border rounded-lg p-4 flex flex-col items-center transition ${selected[u.id] ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'}`}>
              {qrImages[u.id] && (
                <label className="self-start mb-2 flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={!!selected[u.id]} onChange={() => toggleSelect(u.id)} className="rounded" />
                  Select to print
                </label>
              )}

              <img src="/hope-logo.png" alt="Hope Haven Library" className="w-10 h-10 object-contain mb-2" />

              <div className="text-center mb-2">
                <p className="font-mono text-sm font-bold">{u.customer_id}</p>
                <p className="text-gray-600 text-sm">{u.first_name} {u.last_name}</p>
                <p className="text-gray-400 text-xs">{u.role}</p>
              </div>

              {qrImages[u.id] ? (
                <img src={qrImages[u.id]} alt="QR" className="w-28 h-28 rounded-lg border bg-white mb-3" />
              ) : (
                <div className="w-28 h-28 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-xs mb-3">No QR Card</div>
              )}

              {/* Action buttons */}
              <div className="flex gap-1.5 w-full mb-2">
                {u.card ? (
                  <>
                    <button onClick={() => handleDownload(u)} disabled={!qrImages[u.id] || generatingQR === u.id} className="flex-1 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50">
                          {generatingQR === u.id ? '...' : 'Download'}
                        </button>
                    <button onClick={() => printSingle(u)} disabled={!qrImages[u.id]} className="flex-1 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50">Print</button>
                    <button onClick={() => handleRegenerateQR(u.id)} disabled={regenerating === u.id} className="flex-1 py-1.5 bg-amber-100 text-amber-700 text-xs rounded-lg hover:bg-amber-200 disabled:opacity-50">
                      {regenerating === u.id ? '...' : 'New QR'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleCreateQR(u.id)} disabled={generatingQR === u.id} className="w-full py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {generatingQR === u.id ? 'Creating...' : 'Create QR Card'}
                  </button>
                )}
              </div>

              {/* Delete current card */}
              {u.card && (
                <button
                  onClick={() => handleDeleteCard(u.id, u.card.id)}
                  className="w-full py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 mb-1"
                >
                  Delete QR Card
                </button>
              )}

              {/* View all cards / Delete */}
              {u.allCards.length > 0 && (
                <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} className="w-full text-xs text-gray-500 hover:text-primary-600 mb-1">
                  {expandedUser === u.id ? 'Hide cards' : `View all cards (${u.allCards.length})`}
                </button>
              )}

              {/* Expanded card list */}
              {expandedUser === u.id && (
                <div className="w-full border-t border-gray-100 pt-2 mt-1 space-y-2">
                  {u.allCards.map((card) => (
                    <div key={card.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-mono">{card.card_number}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[card.status] || 'bg-gray-100'}`}>{card.status}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditCard(card.id); setEditForm({ card_number: card.card_number, status: card.status }); }} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteCard(u.id, card.id)} className="text-red-600 hover:underline">Delete</button>
                        </div>
                      </div>

                      {/* Edit form */}
                      {editCard === card.id && (
                        <div className="bg-white border rounded-lg p-2 mt-1 space-y-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Card Number</label>
                            <input value={editForm.card_number} onChange={(e) => setEditForm({ ...editForm, card_number: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Status</label>
                            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-2 py-1 border rounded text-xs">
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="REPLACED">Replaced</option>
                              <option value="BLOCKED">Blocked</option>
                            </select>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdateCard(u.id, card.id)} className="flex-1 py-1 bg-primary-600 text-white text-[10px] rounded">Save</button>
                            <button onClick={() => setEditCard(null)} className="flex-1 py-1 bg-gray-200 text-gray-600 text-[10px] rounded">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {users.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">No users found</div>
          )}
        </div>
      )}
      {/* Create QR Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create QR Card</h2>
            <p className="text-sm text-gray-500 mb-4">Select a user to create a QR card for. If they already have one, a new card replaces it.</p>
            <select
              value={createUserId}
              onChange={(e) => setCreateUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Select user --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.customer_id} — {u.first_name} {u.last_name} ({u.role}) {u.card ? '✓ Has card' : '✗ No card'}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button
                onClick={handleCreateForUser}
                disabled={!createUserId || generatingQR}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {generatingQR ? 'Creating...' : 'Create QR Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminQRCards;
