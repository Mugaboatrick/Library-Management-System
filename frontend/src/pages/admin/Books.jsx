import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { bookService, ebookService } from '../../services';
import { toast } from 'react-toastify';

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [retireModal, setRetireModal] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [form, setForm] = useState({ book_id: '', copies: 1 });

  const loadBooks = async () => {
    setLoading(true);
    try {
      const [b, e] = await Promise.all([
        bookService.list({ limit: 300, search }),
        ebookService.list({ limit: 300, search })
      ]);
      setBooks(b.data.data.filter(bk => (bk.category || '').toLowerCase() !== 'digital'));
      setEbooks(e.data.data);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadBooks, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { loadBooks(); }, []);

  const handleAddCopiesSubmit = async (e) => {
    e.preventDefault();
    if (!form.book_id) {
      toast.error('Select a book');
      return;
    }
    try {
      const res = await bookService.addCopies(form.book_id, { copies: parseInt(form.copies) });
      toast.success(res.data.message);
      setAddModal(false);
      setForm({ book_id: '', copies: 1 });
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add copies');
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await bookService.get(id);
      setDetail(res.data);
    } catch (err) {
      toast.error('Failed to load book');
    }
  };

  const handleRetire = async (e) => {
    e.preventDefault();
    try {
      // copyId set = a single copy; book set = retire every copy of the book.
      const res = retireModal.book
        ? await bookService.retireAll(retireModal.book.id, { reason: retireModal.reason, notes: retireModal.notes })
        : await bookService.retire(retireModal.copyId, { reason: retireModal.reason, notes: retireModal.notes });
      toast.success(res.data.message);
      setRetireModal(null);
      if (detail) { setDetail(null); }
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retire copy');
    }
  };

  const handleDeleteBook = async (book) => {
    const copies = book.total_copies ?? 0;
    const ok = window.confirm(
      `Delete "${book.title}"?\n\n` +
      `This permanently removes the book and ${copies} cop${copies === 1 ? 'y' : 'ies'}. ` +
      `This cannot be undone.`
    );
    if (!ok) return;
    try {
      const res = await bookService.remove(book.id);
      toast.success(res.data.message);
      if (detail?.book?.id === book.id) setDetail(null);
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete book');
    }
  };

  const openEditSection = (type, item) => {
    setEditSection({ type, item, value: item.section || '' });
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    const { type, item, value } = editSection;
    try {
      const section = value.trim();
      if (type === 'book') {
        await bookService.update(item.id, { section });
      } else {
        await ebookService.update(item.id, { section });
      }
      toast.success('Section updated');
      setEditSection(null);
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update section');
    }
  };

  const handleAddCopies = async (bookId) => {
    const num = prompt('How many copies to add?', '1');
    if (!num) return;
    try {
      const res = await bookService.addCopies(bookId, { copies: parseInt(num) });
      toast.success(res.data.message);
      if (detail && detail.book.id === bookId) openDetail(bookId);
      loadBooks();
    } catch (err) {
      toast.error('Failed to add copies');
    }
  };

  const copyStatusColor = {
    AVAILABLE: 'bg-green-100 text-green-700',
    BORROWED: 'bg-amber-100 text-amber-700',
    RETIRED: 'bg-red-100 text-red-700'
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Book Inventory</h1>
          <p className="text-[#2d6f2d]/80 text-base mt-1">Manage physical & digital book collection</p>
        </div>
        <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          + Add Copies
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Hard Copy Books */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="relative px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-800 leading-tight">Hard Copy Books</h2>
                  <p className="text-xs text-gray-500">Physical copies kept in the library</p>
                </div>
                <span className="px-2.5 py-1 bg-white ring-1 ring-amber-200 text-amber-700 rounded-full text-xs font-semibold">{books.length} hard copy</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 text-xs text-gray-600">
              <span className="flex items-center gap-1">{''} <b>{books.reduce((n, b) => n + (b.available || 0), 0)}</b> available now</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">{''} <b>{new Set(books.filter(b => b.section).map(b => b.section.trim().toLowerCase())).size}</b> sections</span>
            </div>
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Author</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Section</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Available</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-amber-50/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{book.title}</p>
                        <p className="text-[11px] text-gray-400">{book.category}</p>
                      </td>
                      <td className="px-4 py-3">{book.author || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-violet-50 text-violet-700 ring-1 ring-violet-100 rounded-md text-xs font-medium">{book.section || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 bg-green-50 text-green-700 ring-1 ring-green-100 rounded-md text-xs font-semibold">{book.available}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{book.total_copies}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{book.shelf_location || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => openDetail(book.id)} className="text-xs text-primary-700 hover:underline">View Copies</button>
                        <button onClick={() => openEditSection('book', book)} className="ml-2 text-xs text-violet-600 hover:underline">Edit Section</button>
                        {book.has_loan_history ? (
                          // Borrowed once, so the loan/return rows are the audit
                          // trail. Offer Retire rather than a Delete that can only
                          // fail with a 409.
                          <>
                            <button
                              onClick={() => setRetireModal({ copyId: null, book, reason: 'DAMAGED', notes: '' })}
                              title="This book has been borrowed, so it cannot be deleted. Retire its copies to keep the lending history."
                              className="ml-2 text-xs text-amber-600 hover:underline"
                            >
                              Retire
                            </button>
                            {/* This used to be a bare <span>, so clicking "Delete"
                                did nothing at all and looked like a broken
                                button. It is a real <button> now: the server
                                would reject the delete anyway, so it explains
                                the reason instead of failing silently. */}
                            <button
                              type="button"
                              onClick={() => toast.info(
                                `"${book.title}" has been borrowed before, so it cannot be deleted. `
                                + 'Use Retire to take its copies out of circulation and keep the lending history.'
                              )}
                              title="This book has been borrowed, so it cannot be deleted. Retire its copies to keep the lending history."
                              className="ml-2 text-xs text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleDeleteBook(book)} title="Delete this book and all its copies" className="ml-2 text-xs text-red-500 hover:underline">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && <tr><td colSpan="7" className="text-center py-10 text-gray-400">No hard copy books found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* E-Books Online */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="relative px-5 py-4 bg-gradient-to-r from-indigo-50 to-violet-50/60 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-800 leading-tight">E-Books Online</h2>
                  <p className="text-xs text-gray-500">Digital titles readable on this system</p>
                </div>
                <span className="px-2.5 py-1 bg-white ring-1 ring-indigo-200 text-indigo-700 rounded-full text-xs font-semibold">{ebooks.length} e-book</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 text-xs text-gray-600">
              <span className="flex items-center gap-1">{''} <b>{ebooks.length}</b> titles online</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">{''} <b>{new Set(ebooks.filter(e => e.format).map(e => e.format.toUpperCase())).size}</b> formats</span>
            </div>
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Author</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Format</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ebooks.map((eb) => (
                    <tr key={`eb-${eb.id}`} className="hover:bg-indigo-50/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-gray-800">{eb.title}</span>
                          {eb.format && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 rounded text-[10px] font-semibold">{eb.format.toUpperCase()}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">{eb.author || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{eb.subject || 'Digital'}</td>
                      <td className="px-4 py-3 text-gray-600">{eb.format}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">Online</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => openEditSection('ebook', eb)} className="text-xs text-violet-600 hover:underline">Edit Section</button>
                      </td>
                    </tr>
                  ))}
                  {ebooks.length === 0 && <tr><td colSpan="6" className="text-center py-10 text-gray-400">No digital e-books found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Copies Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Copies of Book">
        <form onSubmit={handleAddCopiesSubmit}>
          <p className="text-xs text-gray-500 mb-4">
            Add new copies to an existing book already in the library. Each copy gets its own code automatically.
          </p>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Select Book *</label>
            <select
              value={form.book_id}
              onChange={(e) => setForm({ ...form, book_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            >
              <option value="">-- Select a book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} · {b.author || '-'} ({b.total_copies || 0} copies currently)
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Number of New Copies *</label>
            <input type="number" min="1" value={form.copies} onChange={(e) => setForm({ ...form, copies: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Add Copies</button>
          </div>
        </form>
      </Modal>

      {/* Book Detail / Copies Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Copies: ${detail?.book?.title}`} size="lg">
        {detail && (
          <>
            <p className="text-sm text-gray-500 mb-3">{detail.book.author} · {detail.book.category} · Shelf {detail.book.shelf_location}</p>
            <div className="flex justify-end mb-3">
              <button onClick={() => handleAddCopies(detail.book.id)} className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-xs">+ Add Copies</button>
            </div>
            <div className="table-wrap">
              <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Copy Code</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Retired Reason</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.copies.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 font-mono text-xs">{c.copy_code}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${copyStatusColor[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-2 text-xs">{c.retired_reason || '-'}</td>
                    <td className="px-4 py-2">
                      {c.status === 'AVAILABLE' && (
                        <button onClick={() => setRetireModal({ copyId: c.id, copyCode: c.copy_code, reason: 'DAMAGED', notes: '' })} className="text-red-600 hover:underline text-xs">
                          Retire
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </Modal>

      {/* Retire Modal */}
      <Modal
        open={!!retireModal}
        onClose={() => setRetireModal(null)}
        title={retireModal?.book ? `Retire "${retireModal.book.title}"` : `Retire Copy ${retireModal?.copyCode || ''}`}
      >
        {retireModal && (
          <form onSubmit={handleRetire}>
            {retireModal.book && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This book has been borrowed, so it cannot be deleted. Retiring takes all{' '}
                {retireModal.book.total_copies ?? 0} cop{(retireModal.book.total_copies ?? 0) === 1 ? 'y' : 'ies'} out of
                circulation and keeps the lending history. It can still be found under Retired.
              </p>
            )}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
              <select value={retireModal.reason} onChange={(e) => setRetireModal({ ...retireModal, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="DAMAGED">Damaged</option>
                <option value="LOST">Lost</option>
                <option value="DECOMMISSIONED">Decommissioned</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input value={retireModal.notes} onChange={(e) => setRetireModal({ ...retireModal, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setRetireModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                {retireModal.book ? 'Retire All Copies' : 'Retire Copy'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Section Modal */}
      <Modal open={!!editSection} onClose={() => setEditSection(null)} title={`Edit Section`}>
        {editSection && (
          <form onSubmit={handleEditSection}>
            <p className="text-xs text-gray-500 mb-4">
              Set the library section where this book is kept (e.g. Kinyarwanda, Maths, Biology...). Students see this when borrowing so they know where to find the book.
            </p>
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Book</label>
              <div className="px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700">{editSection.item.title} {editSection.type === 'ebook' ? `(${editSection.item.format})` : ''}</div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Section *</label>
              <input
                value={editSection.value}
                onChange={(e) => setEditSection({ ...editSection, value: e.target.value })}
                placeholder="e.g. Kinyarwanda"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditSection(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Save Section</button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminBooks;
