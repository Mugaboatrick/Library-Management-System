import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
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

const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm';

const CategoryManager = ({ open, onClose, onSaved }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const [catModal, setCatModal] = useState(null); // { mode: 'add' } | { mode: 'edit', cat }
  const [catForm, setCatForm] = useState({ name: '', code: '', description: '' });
  const [savingCat, setSavingCat] = useState(false);

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

  useEffect(() => {
    if (open) {
      setExpanded(null);
      load();
    }
  }, [open]);

  const refresh = () => {
    if (typeof onSaved === 'function') onSaved();
  };

  /* ---------- Category CRUD ---------- */

  const openAddCategory = () => {
    setCatForm({ name: '', code: '', description: '' });
    setCatModal({ mode: 'add' });
  };

  const openEditCategory = (cat) => {
    setCatForm({ name: cat.name || '', code: cat.code || '', description: cat.description || '' });
    setCatModal({ mode: 'edit', cat });
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
      setCatModal(null);
      setSavingCat(false);
      refresh();
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
      refresh();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  /* ---------- Subject CRUD ---------- */

  const addSubjectTo = (cat) => {
    setSubForm({ name: '', level: 'S1' });
    setSubModal({ mode: 'add', cat });
  };

  const editSubject = (cat, subject) => {
    setSubForm({ name: subject.name || '', level: subject.level || 'S1' });
    setSubModal({ mode: 'edit', cat, subject });
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
      setSubModal(null);
      setSavingSub(false);
      refresh();
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
      refresh();
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
    <Modal open={open} onClose={onClose} title="Manage Categories & Subjects" size="xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <button onClick={openAddCategory} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">            + Add Category</button>
        </div>
        <p className="text-xs text-gray-400">Create, edit and delete categories and their subjects (S1–S6)</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Loading...</div>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-2">
          {categories.map((cat) => {
            const groups = groupedSubjects(cat.subjects);
            const total = (cat.subjects || []).length;
            return (
              <div key={cat.id} className={`rounded-lg border ${expanded === cat.id ? 'border-primary-300 bg-primary-50/40' : 'border-gray-200'}`}>
                <div className="px-3 py-2 flex items-center gap-2">
                  <button
                    onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs ${expanded === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {expanded === cat.id ? '−' : '+'}
                  </button>
                  <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono uppercase">{cat.code}</span>
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[10px] font-medium">{total} subjects</span>
                  <span className="ml-auto flex items-center gap-2">
                    <button onClick={() => openEditCategory(cat)} className="text-xs text-violet-600 hover:underline">Edit</button>
                    <button onClick={() => handleDeleteCategory(cat)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </span>
                </div>

                {expanded === cat.id && (
                  <div className="px-3 pb-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                      {LEVELS.map((level) => {
                        const subs = groups[level] || [];
                        return (
                          <div key={level} className={`rounded-md border p-1.5 ${subs.length ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${LEVEL_COLORS[level]}`}>{level}</span>
                              <span className="text-[10px] text-gray-400">{subs.length}</span>
                            </div>
                            <div className="space-y-0.5">
                              {subs.map(s => (
                                <div key={s.id} className="flex items-center justify-between group">
                                  <span className="text-xs text-gray-700 truncate">{s.name}</span>
                                  <span className="flex-shrink-0 hidden group-hover:flex items-center gap-1">
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
                    <button onClick={() => addSubjectTo(cat)} className="text-xs text-primary-600 hover:underline">+ Add Subject</button>
                  </div>
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-400 border rounded-lg bg-white text-sm">No categories yet. Add your first catalog category.</div>
          )}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Modal open={!!catModal} onClose={() => setCatModal(null)} title={catModal?.mode === 'add' ? 'Add Category' : 'Edit Category'}>
        <form onSubmit={handleSaveCategory}>
          {catModal?.mode === 'edit' && catModal.cat && (
            <div className="mb-3 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700">
              Editing: <span className="font-semibold">{catModal.cat.name}</span>
            </div>
          )}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Category Name *</label>
            <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Classical Conversations Books" className={inputCls} required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Short Code *</label>
            <input value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} placeholder="e.g. CCB" className={`${inputCls} font-mono uppercase`} required />
            <p className="text-[10px] text-gray-400 mt-1">A short, unique label used when showing the category (auto uppercased).</p>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className={inputCls} rows="2" placeholder="What kind of books live in this category?" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCatModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={savingCat} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">              {savingCat ? 'Saving…' : 'Save Category'}</button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Subject Modal */}
      <Modal open={!!subModal} onClose={() => setSubModal(null)} title={subModal?.mode === 'add' ? 'Add Subject' : 'Edit Subject'}>
        <form onSubmit={handleSaveSubject}>
          {subModal?.cat && (
            <div className="mb-3 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700">
              Category: <span className="font-semibold">{subModal.cat.name}</span>
            </div>
          )}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name *</label>
            <input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="e.g. Mathematics" className={inputCls} required />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Level *</label>
            <select value={subForm.level} onChange={(e) => setSubForm({ ...subForm, level: e.target.value })} className={inputCls}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSubModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={savingSub} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">              {savingSub ? 'Saving…' : 'Save Subject'}</button>
          </div>
        </form>
      </Modal>
    </Modal>
  );
};

export default CategoryManager;