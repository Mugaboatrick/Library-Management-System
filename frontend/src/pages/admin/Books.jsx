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
  const [form, setForm] = useState({
    title: '', author: '', category: '', publisher: '', publish_year: '', shelf_location: '', copies: 1, description: ''
  });

  const loadBooks = async () => {
    setLoading(true);
    try {
      const [b, e] = await Promise.all([
        bookService.list({ limit: 100, search }),
        ebookService.list({ limit: 100, search })
      ]);
      setBooks(b.data.data);
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

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await bookService.create(form);
      toast.success(res.data.message);
      setAddModal(false);
      setForm({ title: '', author: '', category: '', publisher: '', publish_year: '', shelf_location: '', copies: 1, description: '' });
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add book');
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
      const res = await bookService.retire(retireModal.copyId, { reason: retireModal.reason, notes: retireModal.notes });
      toast.success(res.data.message);
      setRetireModal(null);
      if (detail) { setDetail(null); }
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retire copy');
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
          <h1 className="text-2xl font-bold text-gray-800">Book Inventory</h1>
          <p className="text-gray-500 text-sm">Manage physical & digital book collection</p>
        </div>
        <button onClick={() => setAddModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          + Add Book
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="table-wrap">
              <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Available</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{book.title}</td>
                  <td className="px-4 py-3">{book.author || '-'}</td>
                  <td className="px-4 py-3">{book.category}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">{book.available}</td>
                  <td className="px-4 py-3">{book.total_copies}</td>
                  <td className="px-4 py-3 font-mono text-xs">{book.shelf_location || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(book.id)} className="text-primary-600 hover:underline">View Copies</button>
                  </td>
                </tr>
              ))}
              {books.length === 0 && ebooks.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-gray-400">No books found</td></tr>}
              {books.length > 0 && ebooks.length > 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Digital E-Books</td>
                </tr>
              )}
              {ebooks.map((eb) => (
                <tr key={`eb-${eb.id}`} className="hover:bg-gray-50 bg-indigo-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{eb.title}</span>
                      {eb.format && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{eb.format}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{eb.author || '-'}</td>
                  <td className="px-4 py-3">{eb.subject || 'Digital'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">Digital</span>
                  </td>
                  <td className="px-4 py-3">{eb.format}</td>
                  <td className="px-4 py-3 font-mono text-xs">Online</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${ebookService.read(eb.id)}?token=${localStorage.getItem('token')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      Read
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
        </div>
      )}

      {/* Add Book Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Book" size="lg">
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Publisher</label>
              <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <input type="number" value={form.publish_year} onChange={(e) => setForm({ ...form, publish_year: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shelf Location</label>
              <input value={form.shelf_location} onChange={(e) => setForm({ ...form, shelf_location: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Number of Copies *</label>
              <input type="number" min="1" value={form.copies} onChange={(e) => setForm({ ...form, copies: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows="2"></textarea>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Add Book</button>
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
      <Modal open={!!retireModal} onClose={() => setRetireModal(null)} title={`Retire Copy ${retireModal?.copyCode}`}>
        {retireModal && (
          <form onSubmit={handleRetire}>
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
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retire Copy</button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminBooks;
