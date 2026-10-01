import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import UserLayout from '../components/layout/UserLayout';
import Modal from '../components/common/Modal';
import { messageService, userService } from '../services';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { toast } from 'react-toastify';

const roleLabel = (role) =>
  ({ LIBRARIAN: 'Librarian', STUDENT: 'Student', TEACHER: 'Teacher', GUEST: 'Guest' }[role] || role);

const roleBadge = (role) => {
  const styles = {
    LIBRARIAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    STUDENT: 'bg-blue-50 text-blue-700 border-blue-200',
    TEACHER: 'bg-violet-50 text-violet-700 border-violet-200',
    GUEST: 'bg-gray-50 text-gray-600 border-gray-200'
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[role] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
};

const Messages = () => {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'LIBRARIAN';
  const [tab, setTab] = useState('inbox');
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [unread, setUnread] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState(null);
  const [compose, setCompose] = useState(null);
  const [form, setForm] = useState({ recipient_id: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);

  const loadInbox = useCallback(async () => {
    try {
      const res = await messageService.inbox();
      setInbox(res.data.data);
      setUnread(res.data.unread || 0);
    } catch (err) {
      toast.error('Failed to load inbox');
    }
  }, []);

  const loadSent = useCallback(async () => {
    try {
      const res = await messageService.sent();
      setSent(res.data.data);
    } catch (err) {
      toast.error('Failed to load sent messages');
    }
  }, []);

  const load = async () => {
    setLoading(true);
    await Promise.all([loadInbox(), loadSent()]);
    try {
      if (isLibrarian) {
        const res = await userService.list({ limit: 500 });
        setUsers(res.data.data || []);
      } else {
        // Members contact the System Administrator (LIB0001). We always have a
        // static fallback so the recipient picker is never empty, even if the
        // API call fails or returns nothing.
        const ADMINS = [
          // Privacy guard: the System Administrator's email is never shipped to a
          // member — it is only returned by GET /users/librarian when the caller's
          // role is LIBRARIAN. This member-side fallback therefore omits the email
          // entirely; the recipient picker only needs id, name and customer_id.
          { id: 1, first_name: 'System', last_name: 'Administrator', customer_id: 'LIB0001', role: 'LIBRARIAN' }
        ];
        try {
          const res = await userService.librarian();
          const lib = res.data.data;
          setUsers(lib ? [lib] : ADMINS);
        } catch (err) {
          // The static System Administrator fallback below is unconditional, so the
          // recipient picker is always populated. The /users/librarian call here
          // is a best-effort nicety — no need to alert the member about it.
          console.debug('Member librarian probe failed (fallback System Administrator used):', err);
          setUsers(ADMINS);
        }
      }
    } catch (err) {
      // recipient picker is optional; ignore failures
    }
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live refresh when a new message arrives
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {
      loadInbox();
    };
    socket.on('new_message', handler);
    return () => { socket.off('new_message', handler); };
  }, [loadInbox]);

  const recipients = (users || []).filter(u => u.id !== user?.id && (isLibrarian ? u.role !== 'LIBRARIAN' : true));
  const librarian = (users || []).find(u => u.role === 'LIBRARIAN');

  const openMessage = async (m) => {
    setSelected(m);
    if (!m.is_read && tab === 'inbox') {
      try {
        await messageService.markRead(m.id);
        setInbox(prev => prev.map(x => x.id === m.id ? { ...x, is_read: 1 } : x));
        setUnread(u => Math.max(0, u - 1));
      } catch (err) { /* ignore */ }
    }
  };

  const openCompose = (preset = {}) => {
    setForm({
      recipient_id: preset.recipient_id || (!isLibrarian ? (librarian?.id || '') : ''),
      subject: preset.subject || '',
      body: ''
    });
    setCompose(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.recipient_id) return toast.error(isLibrarian ? 'Please select a member' : 'No librarian available');
    if (!form.body.trim()) return toast.error('Please write a message');
    setSending(true);
    try {
      const res = await messageService.send(form);
      toast.success(res.data.message);
      setCompose(false);
      setForm({ recipient_id: '', subject: '', body: '' });
      loadSent();
      if (tab === 'inbox') loadInbox();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messageService.remove(m.id);
      toast.success('Message deleted');
      setSelected(null);
      loadInbox();
      loadSent();
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const list = tab === 'inbox' ? inbox : sent;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => {
      const other = tab === 'inbox'
        ? `${m.sender_first_name} ${m.sender_last_name} ${m.sender_customer_id} ${(m.sender_role || '')}`
        : `${m.recipient_first_name} ${m.recipient_last_name} ${m.recipient_customer_id} ${(m.recipient_role || '')}`;
      const haystack = `${m.subject || ''} ${m.body || ''} ${other} ${(m.created_at || '')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [list, search, tab]);

  const Layout = isLibrarian ? AdminLayout : UserLayout;

  const totalUnread = unread;
  const totalInbox = inbox.length;
  const totalSent = sent.length;
  const matches = filtered.length;

  return (
    <Layout>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Messages</h1>
          <p className="text-gray-500 text-base mt-1">Talk to the library {isLibrarian ? 'team and members' : 'team'}</p>
        </div>
        <button onClick={() => openCompose()} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow font-semibold">
           New Message
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unread</p>
            <p className="text-2xl font-bold text-[#2d6f2d]">{totalUnread}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Inbox</p>
            <p className="text-2xl font-bold text-blue-600">{totalInbox}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Sent</p>
            <p className="text-2xl font-bold text-violet-600">{totalSent}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Results</p>
            <p className="text-2xl font-bold text-amber-600">{matches}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <button onClick={() => setTab('inbox')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === 'inbox' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white bg-white/60'}`}>
             Inbox {unread > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">{unread}</span>}
          </button>
          <button onClick={() => setTab('sent')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === 'sent' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white bg-white/60'}`}>
             Sent
          </button>
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab === 'inbox' ? 'inbox' : 'sent'} messages…`}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          {unread > 0 && tab === 'inbox' && (
            <button onClick={async () => { try { await messageService.markAllRead(); setInbox(prev => prev.map(x => ({ ...x, is_read: 1 }))); setUnread(0); } catch (err) { /* ignore */ } }} className="ml-auto text-xs text-green-600 hover:underline whitespace-nowrap">
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {search.trim()
              ? 'No messages match your search.'
              : `No messages yet${tab === 'inbox' ? ' — click "New Message" to start a conversation.' : '.'}`}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((m) => {
              const other = tab === 'inbox'
                ? { name: `${m.sender_first_name} ${m.sender_last_name}`, id: m.sender_customer_id, role: m.sender_role }
                : { name: `${m.recipient_first_name} ${m.recipient_last_name}`, id: m.recipient_customer_id, role: m.recipient_role };
              const initials = (m.sender_first_name?.[0] || '?') + (m.sender_last_name?.[0] || (tab === 'sent' ? m.recipient_first_name?.[0] : ''));
              const avatar = tab === 'sent'
                ? (m.recipient_first_name?.[0] || '?') + (m.recipient_last_name?.[0] || '')
                : initials;
              return (
                <li key={m.id}>
                  <button onClick={() => openMessage(m)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${!m.is_read && tab === 'inbox' ? 'bg-green-50/60' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {!m.is_read && tab === 'inbox' && <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-none ring-4 ring-green-100"></span>}
                        <span className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold flex-none ${!m.is_read && tab === 'inbox' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {avatar.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${!m.is_read && tab === 'inbox' ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{m.body}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                            <span className={`font-medium truncate ${tab === 'sent' ? 'text-violet-600' : 'text-green-700'}`}>
                              {tab === 'sent' ? 'To: ' : 'From: '}{other.name}
                            </span>
                            <span className="font-mono text-gray-400">{other.id}</span>
                            <span className={roleBadge(other.role)}>{roleLabel(other.role)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs flex-none ${!m.is_read && tab === 'inbox' ? 'text-green-700 font-semibold' : 'text-gray-400'}`} title={new Date(m.created_at).toLocaleString()}>
                        {timeAgo(m.created_at)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Read / view message */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Message" size="lg">
        {selected && (
          <div>
            <p className="text-sm text-gray-500">
              {tab === 'inbox'
                ? `From: ${selected.sender_first_name} ${selected.sender_last_name} (${selected.sender_customer_id} · ${roleLabel(selected.sender_role)})`
                : `To: ${selected.recipient_first_name} ${selected.recipient_last_name} (${selected.recipient_customer_id} · ${roleLabel(selected.recipient_role)})`}
              <span className="ml-2 text-gray-400">{new Date(selected.created_at).toLocaleString()}</span>
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm text-gray-700">{selected.body}</div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => handleDelete(selected)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
              {tab === 'inbox' && (
                <button
                  onClick={() => {
                    const other = selected.sender_id;
                    setSelected(null);
                    openCompose({ recipient_id: other, subject: `Re: ${selected.subject}` });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Compose */}
      <Modal open={!!compose} onClose={() => setCompose(false)} title="New Message" size="xl">
        <form onSubmit={handleSend}>
          {/* Recipient */}
          <div className="rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-800">Recipient</h4>
            </div>
            <div className="p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {isLibrarian ? 'Member *' : 'Librarian / Administrator *'}
              </label>
              <select value={form.recipient_id} onChange={(e) => setForm({ ...form, recipient_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none" required>
                <option value="">{isLibrarian ? 'Select a member…' : 'Select a librarian account…'}</option>
                {!isLibrarian && (
                  <option key="sysadmin-static" value="1">
                    System Administrator (LIB0001 · Librarian) — system
                  </option>
                )}
                {recipients.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.customer_id} · {roleLabel(u.role)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-sky-50/60 border-b border-blue-100 flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-800">Subject</h4>
            </div>
            <div className="p-4">
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Renewal of borrowed books"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Message */}
          <div className="rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50/60 border-b border-violet-100 flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-800">Message</h4>
            </div>
            <div className="p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Write your message *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                required
                placeholder="Type your message here…"
                autoFocus
              />
              <div className="flex justify-end mt-1">
                <span className="text-[11px] text-gray-400 font-medium">{form.body.length} characters</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 mt-1 border-t border-gray-100">
            <button type="button" onClick={() => setCompose(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={sending} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 shadow-sm disabled:opacity-60">
              {sending ? 'Sending…' : ' Send Message'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Messages;