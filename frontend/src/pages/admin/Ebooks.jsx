import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/common/Modal';
import CategoryManager from '../../components/admin/CategoryManager';
import { ebookService, bookService, categoryService, reportService } from '../../services';
import { toast } from 'react-toastify';
import RelabelScannerModal from '../../components/admin/RelabelScannerModal';
import { ACCESS_MODES, accessModeBadge } from '../../utils/ebookAccess';

const AdminEbooks = () => {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState('hard');
  const [form, setForm] = useState({ title: '', author: '', category: '', subject: '', section: '', grade_level: '', isbn: '', access_mode: 'READ_ONLY', qr_code: '' });
  const [hardForm, setHardForm] = useState({ shelf_location: '', copies: 1, first_copy_code: '' });
  const [captureScanOpen, setCaptureScanOpen] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [barcodePreview, setBarcodePreview] = useState('');
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [changingMode, setChangingMode] = useState(null);
  const [managedCats, setManagedCats] = useState([]);
  const [catManagerOpen, setCatManagerOpen] = useState(false);

  // Generated linear barcodes are saved as the first copy's code and can be
  // scanned later from the Borrow/Return page.
  // The label produced after a successful save. Kept on the page (not cleared
  // with the form) so the operator can actually print and attach it.
  const [savedLabel, setSavedLabel] = useState(null);
  // The first copy's row id, so a barcode scanned off the book can replace the
  // generated one on the correct copy.
  const [savedLabelCopyId, setSavedLabelCopyId] = useState(null);
  const [relabelScanOpen, setRelabelScanOpen] = useState(false);
  const [relabelBusy, setRelabelBusy] = useState(false);
  const [relabelError, setRelabelError] = useState('');


  const load = async () => {
    setLoading(true);
    try {
      const res = await ebookService.list({ limit: 300, search });
      setEbooks(res.data.data);
    } catch (err) {
      toast.error('Failed to load e-books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load managed categories (professional categories from the categories table)
  useEffect(() => {
    categoryService.categories()
      .then(res => setManagedCats(res.data.data || []))
      .catch(() => {});
  }, []);

  // Subjects are stored per category (subjects.category_id). The dropdown must
  // only ever offer the subjects that belong to the category currently chosen,
  // otherwise picking "Biblical Books" showed subjects belonging to other
  // categories.
  //
  // Each subject exists once per LEVEL (S1..S6), which is why one name appears
  // as several rows. The dropdown stores just the name, so they are collapsed to
  // one option per distinct name.
  const [subjectsByCategory, setSubjectsByCategory] = useState({});
  const loadAllSubjects = async () => {
    try {
      const res = await categoryService.list();
      const cats = res.data.data || [];
      const grouped = {};
      cats.forEach((c) => {
        const byName = {};
        (c.subjects || []).forEach((s) => {
          const key = String(s.name).trim().toLowerCase();
          if (key && !byName[key]) byName[key] = s.name;
        });
        grouped[c.name] = Object.values(byName).sort((a, b) => a.localeCompare(b));
      });
      setSubjectsByCategory(grouped);
    } catch (err) {
      setSubjectsByCategory({});
    }
  };

  // Only the subjects belonging to the selected category. Kept in sync with
  // form.category by the setter below, which clears the subject on change.
  const managedSubs = useMemo(
    () => (form.category ? subjectsByCategory[form.category] || [] : []),
    [form.category, subjectsByCategory]
  );

  useEffect(() => { loadAllSubjects(); }, []);

  const reloadManagedCategories = async () => {
    try {
      const res = await categoryService.categories();
      const cats = res.data.data || [];
      setManagedCats(cats);
      // Keep the currently selected category if it still exists; otherwise clear it
      setForm(f => (cats.some(c => c.name === f.category) ? f : { ...f, category: '' }));
      loadAllSubjects();
    } catch (err) {
      setManagedCats([]);
    }
  };

  // Builds a code for a copy whose book carries no barcode of its own.
  //
  // The canonical format is BOOK<id>-C1 and only the server can produce it,
  // because it needs the book id, which does not exist until the row is
  // inserted. So this is a stand-in: it is what the operator sees and approves,
  // and the value the server actually stores is what the final label is built
  // from. If it ever collided the server silently substitutes BOOK<id>-C1, and
  // the label printed after saving would then show that instead.
  const generateCopyCode = () => {
    // Code128 encodes A-Z, 0-9 and '-', so stay inside that alphabet rather
    // than letting a random string produce an unencodable value.
    const stamp = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6).padStart(6, '0');
    const salt = Math.floor(Math.random() * 46656)
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .padStart(3, '0');
    const code = `HH${stamp}${salt}`;
    setHardForm((prev) => ({ ...prev, first_copy_code: code }));
    setCaptureError('');
    toast.success(`Generated ${code}`);
  };

  // Live preview so the operator can see the symbol they are about to commit to
  // before saving. Only the barcode is drawn here; the full label with the book
  // details is produced after the insert, once the real copy code is known.
  useEffect(() => {
    const code = String(hardForm.first_copy_code || '').trim();
    if (!code) {
      setBarcodePreview('');
      return undefined;
    }
    let cancelled = false;
    renderBarcodeDataUrl(code, 'CODE128')
      .then((url) => {
        if (!cancelled) setBarcodePreview(url);
      })
      .catch(() => {
        // JsBarcode throws on characters Code128 cannot encode. Say so instead
        // of leaving a stale image from the previous code on screen.
        if (!cancelled) {
          setBarcodePreview('');
          setCaptureError(`"${code}" cannot be encoded as a barcode. Use letters, numbers and dashes.`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hardForm.first_copy_code]);

  const closeUpload = () => {    setForm({ ...form, qr_code: '' });
    setHardForm({ shelf_location: '', copies: 1, first_copy_code: '' });
    // Tear the camera down too, otherwise closing the dialog leaves it running.
    setCaptureScanOpen(false);
    setCaptureError('');
    setUploadModal(false);
  };

  // The printed symbol carries ONLY the copy code (e.g. BOOK042-C1).
  //
  // It used to carry the whole "HH1|copy|title|author|category|subject|level|
  // shelf" payload, but Code128 spends 11 modules per character, so a 72-char
  // payload produced a ~1650px wide label. At 1px modules that is physically
  // unusable on a book spine. The copy code alone encodes in ~123 modules.
  //
  // Nothing is lost operationally: scanning the copy code hits
  // GET /api/books/resolve-scan, which returns title, author, category, subject,
  // level, shelf and copy status from the database. The book details are also
  // printed as human-readable text on the label itself.

  // JsBarcode writes into a real <canvas> rather than returning a data URL, so
  // the canvas is serialised to PNG after rendering.
  //
  // With a short copy code the label is small, so the module width can go back
  // to 2px (0.53mm) for solid print reliability. 2X clears the Code128 minimum
  // X-dimension of 0.19mm with room to spare and bar height is 30X against a
  // 15X minimum. The 20px margin is a 10X quiet zone, which is what lets a
  // scanner find the bar edges — it is not optional whitespace.
  const renderBarcodeDataUrl = (value, format) =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      try {
        JsBarcode(canvas, value, {
          format,
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 20,
          background: '#ffffff',
          lineColor: '#000000'
        });
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    });

  // Renders the label for a code that already exists (either the one the
  // operator scanned/typed, or the copy code the server assigned on save).
  //
  // There is deliberately no "PENDING" placeholder any more: a copy code is
  // only assigned once the book row is inserted, so a pre-save barcode could
  // never have matched a real copy and would have printed a dead label.
  // After the book exists the server returns the copy code it actually
  // assigned. Build the printable label from that and keep it on screen — the
  // old flow re-rendered the payload and then immediately closed the dialog and
  // cleared it, so the final label was never actually printable.
  const buildSavedLabel = useCallback(async (code) => {
    if (!code) return null;
    try {
      const dataUrl = await renderBarcodeDataUrl(String(code), 'CODE128');
      const label = {
        code: String(code),
        format: 'CODE128',
        dataUrl,
        title: form.title,
        author: form.author,
        category: form.category,
        subject: form.subject,
        grade_level: form.grade_level,
        shelf_location: hardForm.shelf_location
      };
      setSavedLabel(label);
      return label;
    } catch {
      toast.error('Book saved, but the printable barcode could not be rendered.');
      return null;
    }
  }, [form.title, form.author, form.category, form.subject, form.grade_level, hardForm.shelf_location]);

  // Works for both the in-form preview and the post-save label panel.
  const downloadBarcodeImage = (bc) => {
    if (!bc || !bc.dataUrl) return;
    const a = document.createElement('a');
    a.href = bc.dataUrl;
    a.download = `${String(bc.code).replace(/[^A-Z0-9]/g, '_')}_barcode.png`;
    a.click();
  };

  // Apply a barcode scanned off the book itself, replacing the generated code
  // on that copy. The server re-checks uniqueness and refuses a borrowed copy,
  // so a rejected scan leaves the existing label untouched and printable.
  // Wrapped in useCallback so RelabelScannerModal can hold one reference: it
  // keys its camera session to this callback, and a new function each render
  // would restart the camera continuously.
  const applyScannedBarcode = useCallback(async (scanned) => {
    if (!savedLabel || savedLabelCopyId == null) {
      setRelabelError('This label is no longer available to relabel. Add the book again.');
      return;
    }
    const code = String(scanned || '').trim();
    if (!code) return;
    if (code.length > 30) {
      setRelabelError(`That barcode is ${code.length} characters long. Only 30 or fewer can be used.`);
      return;
    }
    if (code.toUpperCase() === String(savedLabel.code).toUpperCase()) {
      setRelabelError('That is the same barcode this label already has.');
      return;
    }
    setRelabelBusy(true);
    setRelabelError('');
    try {
      const res = await bookService.setCopyCode(savedLabelCopyId, code);
      // Re-render so the operator prints the barcode that is now on the record.
      const label = await buildSavedLabel(res.data.copy_code);
      setRelabelScanOpen(false);
      if (label) {
        toast.success(`Barcode set to ${label.code} — print the new label for this copy.`, {
          autoClose: 8000
        });
      }
    } catch (err) {
      setRelabelError(err.response?.data?.message || 'Could not set that barcode. Try another.');
    } finally {
      setRelabelBusy(false);
    }
  }, [savedLabel, savedLabelCopyId, buildSavedLabel]);

  // Capture mode: the book has not been inserted yet, so there is nothing to
  // call the server with. The code is held in form state and sent with the
  // create request instead. Also useCallback, for the same camera-restart
  // reason as applyScannedBarcode.
  const handleCaptureDetected = useCallback((scanned) => {
    const code = String(scanned || '').trim();
    if (!code) return;
    if (code.length > 30) {
      setCaptureError(`That barcode is ${code.length} characters long. Only 30 or fewer can be used.`);
      return;
    }
    setHardForm((prev) => ({ ...prev, first_copy_code: code }));
    setCaptureScanOpen(false);
    setCaptureError('');
    toast.success(`Barcode captured: ${code}`, { autoClose: 4000 });
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    // ===== Hard Book upload =====
    if (uploadTab === 'hard') {
      // Validate explicitly instead of relying on the browser's native
      // `required` bubbles: those silently swallow the submit, so the form
      // looks like it did nothing and no request is ever sent.
      if (!form.title || !form.title.trim()) {
        toast.error('Title is required');
        return;
      }
      if (!form.category) {
        toast.error('Please choose a Category');
        return;
      }
      const copies = parseInt(hardForm.copies, 10);
      if (!copies || copies < 1) {
        toast.error('Number of Copies must be at least 1');
        return;
      }
      try {
        const res = await bookService.create({
          title: form.title,
          author: form.author,
          category: form.category,
          // Subject and Level are their own columns now. They used to be
          // squashed into `section` and dropped respectively, so a book's
          // subject and level could never be recovered.
          subject: form.subject,
          grade_level: form.grade_level,
          shelf_location: hardForm.shelf_location,
          copies,
          // Optional. When the operator scanned or typed the barcode printed on
          // the book, that becomes the first copy's code. Left out when blank
          // so the server generates BOOK<id>-C1 instead. A code that collides
          // with an existing copy is also replaced by a generated one, so this
          // is safe to always send.
          first_copy_code: hardForm.first_copy_code.trim() || undefined
        });
        toast.success(res.data.message);
        // The copy code is only real once the book is saved, so the printable
        // label is built after the insert. Capture the label before resetting
        // the form, otherwise the details printed under the barcode are lost.
        const label = await buildSavedLabel(res.data.first_copy_code);
        // Remembered so the operator can replace this generated code with the
        // barcode already printed on the book, if it has one.
        setSavedLabelCopyId(res.data.first_copy_id ?? null);
        setUploadModal(false);
        setForm({ title: '', author: '', category: '', subject: '', section: '', grade_level: '', isbn: '', access_mode: 'READ_ONLY', qr_code: '' });
        setHardForm({ shelf_location: '', copies: 1, first_copy_code: '' });
        load();
        if (label) {
          toast.success(`Label ready for ${label.code} — print it and attach it to the book.`, { autoClose: 8000 });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to add hard book');
      }
      return;
    }

    // ===== Online E-Book upload =====
    if (!file) {
      toast.error('Please select a PDF or EPUB file');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    if (cover) fd.append('cover', cover);
    if (form.title) fd.append('title', form.title);
    if (form.author) fd.append('author', form.author);
    if (form.subject) fd.append('subject', form.subject);
    if (form.category) fd.append('section', form.category);
    if (form.grade_level) fd.append('grade_level', form.grade_level);
    if (form.qr_code) fd.append('qr_code', form.qr_code);
    fd.append('access_mode', form.access_mode);

    try {
      const res = await ebookService.upload(fd);
      toast.success(res.data.message);
      setUploadModal(false);
      setForm({ title: '', author: '', category: '', subject: '', section: '', grade_level: '', isbn: '', access_mode: 'READ_ONLY', qr_code: '' });
      setHardForm({ shelf_location: '', copies: 1, first_copy_code: '' });
      setFile(null);
      setCover(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed (max 100MB, PDF/EPUB only)');
    }
  };

  const handleAccessModeChange = async (id, access_mode) => {
    setChangingMode(id);
    try {
      const res = await ebookService.setAccessMode(id, { access_mode });
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update access mode');
    } finally {
      setChangingMode(null);
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

  const stats = React.useMemo(() => {
    const formats = {};
    const categories = {};
    let readOnly = 0;
    let borrowable = 0;
    ebooks.forEach((eb) => {
      if (eb.format) formats[String(eb.format).toUpperCase()] = (formats[String(eb.format).toUpperCase()] || 0) + 1;
      if (eb.section) categories[eb.section] = (categories[eb.section] || 0) + 1;
      if (eb.access_mode === 'READ_ONLY') readOnly++; else borrowable++;
    });
    return {
      formats: Object.keys(formats).length,
      categories: Object.keys(categories).length,
      readOnly,
      borrowable
    };
  }, [ebooks]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2d6f2d]">E-Book Management</h1>
          <p className="text-[#2d6f2d]/80 text-base mt-1">Upload and manage digital learning resources</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCron} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50" title="Manually run fine calculation cron">
            ⏱ Run Fine Cron
          </button>
          <button onClick={() => setUploadModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            + Upload E-Book
          </button>
        </div>
      </div>

      {/* Printable label produced after a hard book is saved. This used to be
          cleared the moment the dialog closed, so the label could never
          actually be printed. */}
      {savedLabel && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50/60 p-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="bg-white rounded-lg p-3 border border-emerald-200 shrink-0">
              <img src={savedLabel.dataUrl} alt="Printable book barcode" className="w-40" />
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-gray-600">
                {[
                  ['Title', savedLabel.title],
                  ['Author', savedLabel.author],
                  ['Category', savedLabel.category],
                  ['Subject', savedLabel.subject],
                  ['Level', savedLabel.grade_level],
                  ['Shelf', savedLabel.shelf_location]
                ].map(([k, v]) => (
                  <div key={k} className="flex min-w-0 gap-1">
                    <dt className="shrink-0 font-medium text-gray-500">{k}:</dt>
                    <dd className="truncate" title={v || ''}>{v || <span className="text-gray-400">—</span>}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900">Label ready to print</p>
              <p className="mt-1 text-xs text-emerald-800">
                Print this label and stick it on the book. Code{' '}
                <span className="font-mono font-semibold">{savedLabel.code}</span> resolves to
                {' '}<span className="font-semibold">{savedLabel.title}</span> when scanned.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => downloadBarcodeImage(savedLabel)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs hover:bg-emerald-700"
                >
                  Download label PNG
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-md text-xs hover:bg-emerald-100"
                >
                  Print
                </button>
                {/* A book that arrived with the publisher's own barcode can use it
                    instead of the generated one. Scanned after the save, because
                    the copy only gets a row id once it is inserted. */}
                {savedLabelCopyId != null && (
                  <button
                    type="button"
                    onClick={() => {
                      setRelabelError('');
                      setRelabelScanOpen(true);
                    }}
                    className="px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-md text-xs hover:bg-emerald-100"
                  >
                    Scan the book's own barcode instead
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSavedLabel(null);
                    setSavedLabelCopyId(null);
                  }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-xs hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera scanner used to replace the generated code with the barcode
          already printed on the book. */}
      <RelabelScannerModal
        open={relabelScanOpen}
        busy={relabelBusy}
        error={relabelError}
        currentCode={savedLabel?.code}
        onClose={() => {
          setRelabelScanOpen(false);
          setRelabelError('');
        }}
        onDetected={applyScannedBarcode}
      />

      {/* Camera scanner for the Add Hard Book form. This one is opened while
          the upload dialog is still on screen, so it is raised above that
          dialog's z-50. Relying on DOM order instead is what hid it before:
          both were z-50 and the upload modal came later in the tree. */}
      <RelabelScannerModal
        mode="capture"
        zIndex={60}
        open={captureScanOpen}
        error={captureError}
        onClose={() => {
          setCaptureScanOpen(false);
          setCaptureError('');
        }}
        onDetected={handleCaptureDetected}
      />


      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-indigo-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total titles</p>
          <p className="text-2xl font-bold text-indigo-600">{ebooks.length}</p>
          <p className="text-xs text-gray-500">digital books</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary-500"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Categories</p>
          <p className="text-2xl font-bold text-primary-700">{stats.categories}</p>
          <p className="text-xs text-gray-500">sections used</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-pink-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Formats</p>
          <p className="text-2xl font-bold text-pink-600">{stats.formats}</p>
          <p className="text-xs text-gray-500">file types</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-400"></div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Read online</p>
          <p className="text-2xl font-bold text-blue-600">{stats.readOnly}</p>
          <p className="text-xs text-gray-500">{stats.borrowable} borrowable</p>
        </div>
      </div>

      {/* Research / search bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 mb-6">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any e-book by title, author, subject, section, ISBN..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative px-5 py-4 bg-gradient-to-r from-indigo-50 to-violet-50/60 border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold text-gray-800">E-Book Collection</h2>
                <p className="text-xs text-gray-500">{search ? `Results for "${search}"` : 'All digital titles on this system'}</p>
              </div>
              <span className="px-2.5 py-1 bg-white ring-1 ring-indigo-200 text-indigo-700 rounded-full text-xs font-semibold">{ebooks.length} e-books</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Author</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Section</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Level</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Format</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Size</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Access</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ebooks.map((eb) => (
                  <tr key={eb.id} className="hover:bg-indigo-50/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-gray-800">{eb.title}</span>
                        {eb.qr_code && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 rounded text-[10px] font-mono max-w-[120px] truncate" title="Book barcode — used when borrowing">Code: {eb.qr_code}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{eb.author || 'Unknown author'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 ring-1 ring-blue-100 rounded-md text-xs font-medium">{eb.subject || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-700 ring-1 ring-violet-100 rounded-md text-xs font-medium">a {eb.section || eb.subject || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {eb.grade_level ? (
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 bg-green-50 text-green-700 ring-1 ring-green-100 rounded-md text-xs font-semibold">{eb.grade_level}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">{eb.format || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{((eb.file_size || 0) / 1024 / 1024).toFixed(1)} MB</td>
                    <td className="px-4 py-3">
                      {(() => { const b = accessModeBadge(eb.access_mode); return (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.className}`} title={b.hint}>{b.label}</span>
                      ); })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/reader/${eb.id}`}
                          title="Read-only — downloading & copying are not allowed"
                          className="px-2.5 py-1.5 bg-primary-600 text-white rounded-md text-xs hover:bg-primary-700 transition"
                        >
                          Read
                        </Link>
                        <select
                          value={eb.access_mode}
                          disabled={changingMode === eb.id}
                          onChange={(e) => handleAccessModeChange(eb.id, e.target.value)}
                          className="px-2 py-1.5 border rounded-md text-xs bg-white focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                        >
                          {ACCESS_MODES.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                        <button onClick={() => handleDelete(eb.id)} className="px-2.5 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 transition">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ebooks.length === 0 && (
                  <tr><td colSpan="9" className="text-center py-10 text-gray-400">{search ? 'No e-books match your search' : 'No e-books uploaded yet'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={uploadModal} onClose={closeUpload} title={uploadTab === 'hard' ? 'Add Hard Book' : 'Upload Online E-Book'} size="xl">
        <form onSubmit={handleUpload}>
          {/* Upload type selector */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUploadTab('hard')}
              className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition ${
                uploadTab === 'hard'
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-amber-300'
              }`}
            >
               Hard Book <span className="block text-[11px] font-medium opacity-70">Physical — create a barcode label</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadTab('online')}
              className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition ${
                uploadTab === 'online'
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-300'
              }`}
            >
               Online E-Book <span className="block text-[11px] font-medium opacity-70">Digital file — no barcode</span>
            </button>
          </div>
          {/* Book details */}
          <div className="rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-violet-50/60 border-b border-indigo-100 flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-800">Book Details</h4>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder=""
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Author</label>
                  <input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    placeholder="Author name"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const category = e.target.value;
                      setForm(f => ({ ...f, category, subject: '', grade_level: 'S1' }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="">-- Select category --</option>
                    {managedCats.map((c) => <option key={c.id} value={c.name}>{c.name} {c.code ? `(${c.code})` : ''}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCatManagerOpen(true)}
                    className="mt-1 text-xs text-primary-600 hover:underline flex items-center gap-1"
                  >
                     Manage categories & subjects
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    disabled={!form.category}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {!form.category ? (
                      <option value="">-- Select a category first --</option>
                    ) : managedSubs.length === 0 ? (
                      <option value="">-- No subjects in this category --</option>
                    ) : (
                      <>
                        <option value="">-- Select subject --</option>
                        {managedSubs.map((s) => <option key={s} value={s}>{s}</option>)}
                      </>
                    )}
                  </select>
                  {form.category && managedSubs.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      This category has no subjects yet. Add one under Manage categories &amp; subjects.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Level</label>
                  <select
                    value={form.grade_level}
                    onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    {['S1','S2','S3','S4','S5','S6'].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {uploadTab === 'hard' ? (
            <div key="hard-panel">
              {/* Hard book specifics */}
              <div className="rounded-xl border border-amber-200 overflow-hidden mb-4">
                <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-100 flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-800">Hard Book Info</h4>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Shelf Location</label>
                    <input
                      value={hardForm.shelf_location}
                      onChange={(e) => setHardForm({ ...hardForm, shelf_location: e.target.value })}
                      placeholder="e.g. Shelf B3"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Number of Copies *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={hardForm.copies}
                      onChange={(e) => setHardForm({ ...hardForm, copies: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  {/* Optional. Two ways to fill this: generate a code for a book
                      that has no barcode of its own, or scan the barcode the
                      publisher already printed on it. */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Barcode <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={hardForm.first_copy_code}
                        onChange={(e) => {
                          setHardForm({ ...hardForm, first_copy_code: e.target.value });
                          setCaptureError('');
                        }}
                        placeholder="Generate one, or scan the book's own barcode"
                        maxLength={30}
                        className="flex-1 min-w-[12rem] px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={generateCopyCode}
                        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-[#2d6f2d] bg-green-50 border border-green-200 hover:bg-green-100 transition whitespace-nowrap"
                      >
                        Generate barcode
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCaptureError('');
                          setCaptureScanOpen(true);
                        }}
                        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2d6f2d] hover:bg-green-700 transition whitespace-nowrap"
                      >
                        Scan barcode
                      </button>
                    </div>
                    {captureError && (
                      <p className="mt-1.5 text-xs text-amber-700">{captureError}</p>
                    )}
                    {barcodePreview && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                        <img src={barcodePreview} alt="Barcode preview" className="h-16" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700">Preview</p>
                          <p className="text-[11px] text-gray-500">
                            Used for the first copy on save. The full label with the book details is
                            printable straight after saving.
                          </p>
                          <a
                            href={barcodePreview}
                            download="barcode.png"
                            className="mt-1 inline-block text-xs font-semibold text-[#2d6f2d] hover:underline"
                          >
                            Download PNG
                          </a>
                        </div>
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      {hardForm.first_copy_code.trim()
                        ? 'The first copy will use this code. You can re-print or change it after saving.'
                        : 'Leave empty and the system generates a code, then prints a label for it.'}
                    </p>

                    {/* What the barcode is saved with. The symbol itself carries only
                        the copy code (a full payload renders far too wide for a
                        spine), so the operator gets the complete record on screen
                        and as printed text on the label instead. */}
                    {hardForm.first_copy_code.trim() && (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                        <div className="px-3 py-2 border-b border-emerald-100 flex items-center gap-2">
                          <span className="text-emerald-700 text-xs font-bold">Saved with this barcode</span>
                          <span className="text-[10px] text-emerald-700/70">
                            stored on the copy record and printed under the barcode
                          </span>
                        </div>
                        <dl className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {[
                            ['Copy code', hardForm.first_copy_code.trim(), true],
                            ['Title', form.title],
                            ['Author', form.author],
                            ['Category', form.category],
                            ['Subject', form.subject],
                            ['Level', form.grade_level],
                            ['Shelf location', hardForm.shelf_location],
                            ['Number of copies', hardForm.copies]
                          ].map(([label, value, mono]) => (
                            <div key={label} className="min-w-0 flex gap-2">
                              <dt className="text-[11px] text-gray-500 shrink-0 w-[104px]">{label}</dt>
                              <dd
                                className={`text-[11px] font-medium text-gray-800 truncate ${
                                  mono ? 'font-mono' : ''
                                }`}
                                title={String(value ?? '')}
                              >
                                {String(value ?? '').trim() || <span className="text-gray-400 font-normal">not set</span>}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <p className="px-3 pb-2.5 text-[10px] leading-relaxed text-gray-500">
                          The barcode symbol holds only the copy code so it stays narrow enough to scan off
                          a book spine. Scanning it looks the full record up from the database, and the
                          label prints these details as readable text.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

        </div>
          ) : (
            <div key="online-panel">
              {/* Files */}
              <div className="rounded-xl border border-gray-200 overflow-hidden mb-4">
                <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-slate-50/60 border-b border-gray-100 flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-800">Files</h4>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">File (PDF or EPUB) *</label>
                    <input
                      type="file"
                      accept=".pdf,.epub"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Max 100 MB — PDF or EPUB only</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cover Image (optional, jpg/png)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCover(e.target.files[0])}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Shown as the book cover in the library</p>
                  </div>
                </div>
              </div>

              {/* Access mode */}
              <div className="rounded-xl border border-gray-200 overflow-hidden mb-4">
                <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50/60 border-b border-emerald-100 flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-800">Access Mode</h4>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {ACCESS_MODES.map(m => (
                      <label key={m.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        form.access_mode === m.value ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="access_mode"
                          value={m.value}
                          checked={form.access_mode === m.value}
                          onChange={(e) => setForm({ ...form, access_mode: e.target.value })}
                          className="mt-1 w-4 h-4 accent-primary-600"
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">{m.label}</span>
                          <span className="block text-xs text-gray-400">{m.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={closeUpload} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition">
              {uploadTab === 'hard' ? ' Add Hard Book' : ' Upload Online Book'}
            </button>
          </div>
        </form>
      </Modal>

      <CategoryManager
        open={catManagerOpen}
        onClose={() => setCatManagerOpen(false)}
        onSaved={reloadManagedCategories}
      />
    </AdminLayout>
  );
};

export default AdminEbooks;
