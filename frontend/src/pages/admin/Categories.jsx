import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import { categoryService } from '../../services';
import { toast } from 'react-toastify';

const LEVELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
const LEVEL_COLORS = {
  S1: 'bg-emerald-100 text-emerald-700',
  S2: 'bg-teal-100 text-teal-700',
  S3: 'bg-sky-100 text-sky-700',
  S4: 'bg-indigo-100 text-indigo-700',
  S5: 'bg-violet-100 text-violet-700',
  S6: 'bg-fuchsia-100 text-fuchsia-700'
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  // Category modal state
  const [catModal, setCatModal] = useState(null); // { mode: 'add' } | { mode: 'edit', cat }
  const [catForm, setCatForm] = useState({ name: '', code: '', description: '' });
  const [savingCat, setSavingCat] = useState(false);

  // Subject modal state
  const [subModal, setSubModal] = useState(null); // { mode, cat, subject? }
  const [subForm, setSubForm] = useState({ name: '', level: 'S1' });
  const [savingSub, setSavingSub] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await categoryService.list();
      setCategories(res.data.data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ---------- Category handlers ---------- */

  const openAddCategory = () => {
    setCatForm({ name: '', code: '', description: '' });
    setCatModal({ mode: 'add' });
  };

  const openEditCategory = (cat) => {
    setCatForm({ name: cat.name || '', code: cat.code || '', description: cat.description || '' });
    setCatModal({ mode: 'edit', cat });
  };

  const closeCategory = () => {
    setCatModal(null);
    setSavingCat(false);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim() || !catForm.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSavingCat(true);
    try {
      if (catModal.mode === 'add') {
        await categoryService.create(catForm);
        toast.success('Category added');
      } else {
        await categoryService.update(catModal.cat.id, catForm);
        toast.success('Category updated');
      }
      closeCategory();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? All its subjects will also be removed. This cannot be undone.`)) return;
    try {
      await categoryService.remove(cat.id);
      toast.success('Category deleted');
      setExpanded(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  /* ---------- Subject handlers ---------- */

  const addSubjectTo = (cat) => {
    setSubForm({ name: '', level: 'S1' });
    setSubModal({ mode: 'add', cat });
  };

  const editSubject = (cat, subject) => {
    setSubForm({ name: subject.name || '', level: subject.level || 'S1' });
    setSubModal({ mode: 'edit', cat, subject });
  };

  const closeSubject = () => {
    setSubModal(null);
    setSavingSub(false);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subForm.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
    setSavingSub(true);
    try {
      const catId = subModal.cat.id;
      if (subModal.mode === 'add') {
        await categoryService.addSubject(catId, subForm);
        toast.success('Subject added');
      } else {
        await categoryService.updateSubject(catId, subModal.subject.id, subForm);
        toast.success('Subject updated');
      }
      closeSubject();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject');
      setSavingSub(false);
    }
  };

  const handleDeleteSubject = async (cat, subject) => {
    if (!window.confirm(`Delete subject "${subject.name} (${subject.level})"?`)) return;
    try {
      await categoryService.removeSubject(cat.id, subject.id);
      toast.success('Subject deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const groupedSubjects = (subjects) => {
    const groups = {};
    LEVELS.forEach(l => { groups[l] = (subjects || []).filter(s => (s.level || 'S1').toUpperCase() === l); });
    groups['OTHER'] = (subjects || []).filter(s => !LEVELS.includes((s.level || 'S1').toUpperCase()));
    return groups;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">Categories &amp; Subjects</h1>
          <p className="text-[#2d6f2d]/80 text-base mt-1">Organize the library catalog into professional categories with subjects at levels S1–S6</p>
        </div>
        <button onClick={openAddCategory} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">          + Add Category</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const isOpen = expanded === cat.id;
            const groups = groupedSubjects(cat.subjects);
            const totalSubjects = (cat.subjects || []).length;
            return (
              <div key={cat.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className={`px-4 py-3 ${isOpen ? 'bg-primary-50 border-b border-primary-100' : ''} flex items-center gap-3`}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : cat.id)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${
                      isOpen ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {isOpen ? '−' : '+'}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{cat.name}</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono uppercase">{cat.code}</span>
                    </div>
                    {cat.description && <p className="text-xs text-gray-500 truncate">{cat.description}</p>}
                  </div>
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{totalSubjects} subjects</span>
                </div>

                <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                  <button onClick={() => addSubjectTo(cat)} className="text-xs text-primary-600 hover:underline">+ Add Subject</button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => openEditCategory(cat)} className="text-xs text-violet-600 hover:underline">Edit</button>
                  <button onClick={() => handleDeleteCategory(cat)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>

                {isOpen && (
                  <div className="px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {LEVELS.map((level) => {
                        const subs = groups[level] || [];
                        return (
                          <div key={level} className={`rounded-lg border p-2 ${subs.length ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${LEVEL_COLORS[level]}`}>{level}</span>
                              <span className="text-[10px] text-gray-400">{subs.length}</span>
                            </div>
                            <div className="space-y-1">
                              {subs.map((s) => (
                                <div key={s.id} className="flex items-center justify-between gap-1 group">
                                  <span className="text-xs text-gray-700 truncate">{s.name}</span>
                                  <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                    <button onClick={() => editSubject(cat, s)} title="Edit" className="text-base text-violet-600 hover:text-violet-800 leading-none">✎</button>
                                    <button onClick={() => handleDeleteSubject(cat, s)} title="Delete" className="text-base text-red-600 hover:text-red-800 leading-none">🗑</button>
                                  </span>
                                </div>
                              ))}
                              {subs.length === 0 && <p className="text-[10px] text-gray-400 italic">(empty)</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {groups.OTHER.length > 0 && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                        <span className="text-[10px] font-bold text-amber-600">OTHER</span>
                        <div className="mt-1 space-y-1">
                          {groups.OTHER.map((s) => (
                            <div key={s.id} className="flex items-center justify-between">
                              <span className="text-xs">{s.name} (<span className="font-mono">{s.level}</span>)</span>
                              <span className="flex items-center gap-1">
                                <button onClick={() => editSubject(cat, s)} className="text-base text-violet-600 hover:text-violet-800 leading-none">✎</button>
                                <button onClick={() => handleDeleteSubject(cat, s)} className="text-base text-red-600 hover:text-red-800 leading-none">🗑</button>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 border rounded-lg bg-white">No categories yet. Add your first catalog category.</div>
          )}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Modal open={!!catModal} onClose={closeCategory} title={catModal?.mode === 'add' ? 'Add Category' : 'Edit Category'}>
        <form onSubmit={handleSaveCategory}>
          {catModal?.mode === 'edit' && catModal.cat && (
            <div className="mb-3 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700">
              Editing: <span className="font-semibold">{catModal.cat.name}</span>
            </div>
          )}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Category Name *</label>
            <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Classical Conversations Books" className="w-full px-3 py-2 border rounded-lg text-sm" required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Short Code *</label>
            <input value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} placeholder="e.g. CCB" className="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase" required />
            <p className="text-[10px] text-gray-400 mt-1">A short, unique label used when showing the category (auto uppercased).</p>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows="2" placeholder="What kind of books live in this category?" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeCategory} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={savingCat} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">              {savingCat ? 'Saving…' : 'Save Category'}</button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Subject Modal */}
      <Modal open={!!subModal} onClose={closeSubject} title={subModal?.mode === 'add' ? 'Add Subject' : 'Edit Subject'}>
        <form onSubmit={handleSaveSubject}>
          {subModal?.cat && (
            <div className="mb-3 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700">
              Category: <span className="font-semibold">{subModal.cat.name}</span>
            </div>
          )}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name *</label>
            <input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="" className="w-full px-3 py-2 border rounded-lg text-sm" required />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Level *</label>
            <select value={subForm.level} onChange={(e) => setSubForm({ ...subForm, level: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Pick the education level (S1–S6) this subject belongs to.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeSubject} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={savingSub} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">              {savingSub ? 'Saving…' : 'Save Subject'}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminCategories;