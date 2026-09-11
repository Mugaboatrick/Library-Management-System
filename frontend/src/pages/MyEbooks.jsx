import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/layout/UserLayout';
import { ebookService, borrowService, publicUrl } from '../services';
import offlineCache from '../services/offlineCache';
import { toast } from 'react-toastify';

const MyEbooks = () => {
  const [ebooks, setEbooks] = useState([]);
  const [borrowedIds, setBorrowedIds] = useState(new Set());
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ebRes, borrowRes, cachedRecords] = await Promise.all([
        ebookService.list({ limit: 100 }),
        borrowService.mine().catch(() => ({ data: { data: [] } })),
        offlineCache.list()
      ]);
      setEbooks(ebRes.data.data);
      const ids = new Set(borrowRes.data.data
        .filter(b => (b.status === 'BORROWED' || b.status === 'OVERDUE') && b.copy_code && b.copy_code.startsWith('EBK'))
        .map(b => { const m = b.copy_code.match(/^EBK(\d+)-/); return m ? parseInt(m[1]) : null; })
        .filter(Boolean));
      setBorrowedIds(ids);
      setDownloadedIds(new Set(cachedRecords.map(r => r.ebookId).filter(Boolean)));
    } catch (err) {
      toast.error('Failed to load e-books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const downloadBook = async (id, title) => {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      const token = localStorage.getItem('token');
      await offlineCache.save(id, title, `${ebookService.download(id)}?token=${token}`);
      setDownloadedIds(prev => new Set(prev).add(id));
      toast.success('Book saved to this device — readable offline');
    } catch (err) {
      toast.error(err.message || 'Failed to download book');
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const filtered = ebooks.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.author && e.author.toLowerCase().includes(search.toLowerCase())) ||
    (e.subject && e.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My E-Books</h1>
        <p className="text-gray-500 text-sm">Access digital learning resources online</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search e-books by title, author, or subject..."
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((eb) => {
            const isBorrowed = borrowedIds.has(eb.id);
            return (
            <div key={eb.id} className="card-hover bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
              {eb.cover_image ? (
                <div className="h-36 bg-slate-100 overflow-hidden">
                  <img
                    src={publicUrl(eb.cover_image)}
                    alt={eb.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('bg-gradient-to-br', 'from-primary-100', 'to-blue-100', 'flex', 'items-center', 'justify-center', 'text-4xl'); e.currentTarget.parentElement.innerHTML = '📖'; }}
                  />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center text-4xl">📖</div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{eb.format}</span>
                  {isBorrowed && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Borrowed</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mt-2">{eb.title}</h3>
                <p className="text-sm text-gray-500">{eb.author || 'Unknown'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {eb.subject && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{eb.subject}</span>}
                  {eb.grade_level && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Grade {eb.grade_level}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-2">{(eb.file_size / 1024 / 1024).toFixed(1)} MB</p>
                {isBorrowed ? (
                  downloadedIds.has(eb.id) ? (
                    <span className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm text-center cursor-default">
                      ✓ Downloaded — read offline
                    </span>
                  ) : (
                    <button
                      onClick={() => downloadBook(eb.id, eb.title)}
                      disabled={loadingIds.has(eb.id)}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm text-center hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {loadingIds.has(eb.id) ? 'Downloading...' : '⬇ Download to device'}
                    </button>
                  )
                ) : (
                  <Link to={`/reader/${eb.id}`} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm text-center hover:bg-primary-700">
                    Read Now
                  </Link>
                )}
              </div>
            </div>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No e-books available</div>}
        </div>
      )}
    </UserLayout>
  );
};

export default MyEbooks;
