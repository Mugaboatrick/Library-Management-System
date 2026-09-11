import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { ebookService, reportService, publicUrl } from '../../services';
import { toast } from 'react-toastify';

const AdminEbooks = () => {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', subject: '', grade_level: '' });
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ebookService.list({ limit: 100 });
      setEbooks(res.data.data);
    } catch (err) {
      toast.error('Failed to load e-books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF or EPUB file');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    if (cover) fd.append('cover', cover);
    fd.append('title', form.title);
    if (form.author) fd.append('author', form.author);
    if (form.subject) fd.append('subject', form.subject);
    if (form.grade_level) fd.append('grade_level', form.grade_level);

    try {
      const res = await ebookService.upload(fd);
      toast.success(res.data.message);
      setUploadModal(false);
      setForm({ title: '', author: '', subject: '', grade_level: '' });
      setFile(null);
      setCover(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed (max 100MB, PDF/EPUB only)');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this e-book?')) return;
    try {
      const res = await ebookService.remove(id);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleCron = async () => {
    try {
      const res = await reportService.runFineCron();
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to run cron');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">E-Book Management</h1>
          <p className="text-gray-500 text-sm">Upload and manage digital learning resources</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCron} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50" title="Manually run fine calculation cron">
            ⚙️ Run Fine Cron
          </button>
          <button onClick={() => setUploadModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            + Upload E-Book
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ebooks.map((eb) => (
            <div key={eb.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
              {eb.cover_image ? (
                <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={publicUrl(eb.cover_image)}
                    alt={eb.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('bg-gradient-to-br', 'from-primary-100', 'to-blue-100'); e.currentTarget.parentElement.innerHTML = '📖'; }}
                  />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center text-5xl">📖</div>
              )}
              <div className="p-5 flex flex-col flex-1">
              <h3 className="font-semibold text-gray-800">{eb.title}</h3>
              <p className="text-sm text-gray-500">{eb.author || 'Unknown author'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {eb.subject && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{eb.subject}</span>}
                {eb.grade_level && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Grade {eb.grade_level}</span>}
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{eb.format}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">{(eb.file_size / 1024 / 1024).toFixed(1)} MB</p>
              <div className="mt-4 flex gap-2 justify-end">
                <a
                  href={`${ebookService.read(eb.id)}?token=${localStorage.getItem('token')}`}
                  target="_blank"
                  rel="noreferrer"
                  className=" px-3 py-1.5 bg-primary-600 text-white rounded-md text-xs hover:bg-primary-700"
                >
                  Read
                </a>
                <button onClick={() => handleDelete(eb.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700">
                  Delete
                </button>
              </div>
              </div>
            </div>
          ))}
          {ebooks.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 border rounded-lg bg-white">
              No e-books uploaded yet
            </div>
          )}
        </div>
      )}

      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload E-Book">
        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Grade Level</label>
            <input value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 6" />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">File (PDF or EPUB) *</label>
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Cover Image (optional, jpg/png)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files[0])}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setUploadModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Upload</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminEbooks;
