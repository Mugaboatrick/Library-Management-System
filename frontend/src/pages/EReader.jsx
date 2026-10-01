import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { ebookService } from '../services';
import offlineCache from '../services/offlineCache';
import { authStorage } from '../services/authStorage';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { accessModeBadge } from '../utils/ebookAccess';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const EReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [bookmarks, setBookmarks] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [ebookTitle, setEbookTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [isOfflineCopy, setIsOfflineCopy] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [accessMode, setAccessMode] = useState('READ_ONLY');
  const pdfRef = useRef(null);

  useEffect(() => {
    // Disable right click for PDF document security
    const disableRightClick = (e) => e.preventDefault();
    document.addEventListener('contextmenu', disableRightClick);

    // Disable copying text from the document
    const disableCopy = (e) => e.preventDefault();
    document.addEventListener('copy', disableCopy);
    document.addEventListener('cut', disableCopy);

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('copy', disableCopy);
      document.removeEventListener('cut', disableCopy);
    };
  }, []);

  useEffect(() => {
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const token = authStorage.getToken();

      // Prefer the locally downloaded copy (works offline, and for borrowed books)
      const cached = await offlineCache.get(parseInt(id));
      if (cached) {
        setFileUrl(URL.createObjectURL(cached.blob));
        setIsOfflineCopy(true);
      } else {
        const url = `${ebookService.read(id)}?token=${token}`;
        setFileUrl(url);
        setIsOfflineCopy(false);
      }

      // Get title from list
      const res = await ebookService.list({ limit: 100 });
      const found = res.data.data.find(e => e.id === parseInt(id));
      setEbookTitle(found?.title || cached?.title || 'E-Book');
      setIsProtected(Number(found?.is_protected) === 1);
      setAccessMode(found?.access_mode || 'READ_ONLY');

      // Load bookmarks
      const bm = await ebookService.myBookmarks();
      setBookmarks(bm.data.data.filter(x => x.ebook_id === parseInt(id)));

      // Restore last bookmark if exists
      const last = bm.data.data.find(x => x.ebook_id === parseInt(id));
      if (last) setPageNumber(last.page_number);
    } catch (err) {
      toast.error('Failed to open e-book');
      navigate('/reader');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages: n }) => {
    setNumPages(n);
  };

  // Search within the PDF text content (uses PDF.js getTextContent)
  const performSearch = async () => {
    if (!searchTerm.trim() || !pdfRef.current) return;
    setSearching(true);
    setSearchResults([]);
    setSearchIndex(0);
    const term = searchTerm.toLowerCase();
    const found = [];

    try {
      const pdfDoc = pdfRef.current.pdf; // react-pdf exposes pdf.js document via .pdf
      if (!pdfDoc) {
        toast.error('Document not ready for search');
        return;
      }
      for (let p = 1; p <= pdfDoc.numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        if (text.toLowerCase().includes(term)) {
          found.push({ page: p, preview: text.substring(0, 80) });
        }
      }
      if (found.length > 0) {
        setSearchResults(found);
        goToPage(found[0].page);
        toast.success(`Found ${found.length} page(s) containing "${searchTerm}"`);
      } else {
        toast.info('No matches found');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const cycleSearch = (dir) => {
    if (searchResults.length === 0) return;
    setSearchIndex(prev => {
      const next = (prev + dir + searchResults.length) % searchResults.length;
      goToPage(searchResults[next].page);
      return next;
    });
  };

  const addBookmark = async (note = '') => {
    try {
      await ebookService.addBookmark({ ebook_id: parseInt(id), page_number: pageNumber, note });
      toast.success(`Bookmarked page ${pageNumber}`);
      const bm = await ebookService.myBookmarks();
      setBookmarks(bm.data.data.filter(x => x.ebook_id === parseInt(id)));
    } catch (err) {
      toast.error('Failed to add bookmark');
    }
  };

  const removeBookmark = async (bookmarkId) => {
    try {
      await ebookService.deleteBookmark(bookmarkId);
      toast.success('Bookmark removed');
      const bm = await ebookService.myBookmarks();
      setBookmarks(bm.data.data.filter(x => x.ebook_id === parseInt(id)));
    } catch (err) {
      toast.error('Failed to remove bookmark');
    }
  };

  const goToPage = (p) => {
    const target = Math.min(Math.max(1, p), numPages);
    setPageNumber(target);
  };

  const handleBack = () => {
    const homeRoute = user?.role === 'LIBRARIAN' ? '/admin/ebooks' : '/dashboard';
    navigate(homeRoute, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col">
      {/* Reader toolbar */}
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm"> Back</button>
          <span className="font-semibold">{ebookTitle}</span>
          {(() => { const b = accessModeBadge(accessMode); return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.className}`}>
              {b.label}
            </span>
          ); })()}
          <span className="text-xs text-gray-400">{isOfflineCopy ? '(Downloaded to device — offline)' : '(Reading online)'}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch(); }}
              placeholder=" Search in book..."
              className="w-40 bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none"
            />
            <button onClick={performSearch} disabled={searching} className="text-gray-300 hover:text-white disabled:opacity-50">
              {searching ? '...' : 'Go'}
            </button>
            {searchResults.length > 0 && (
              <>
                <span className="text-xs text-gray-400 ml-1">{searchIndex + 1}/{searchResults.length}</span>
                <button onClick={() => cycleSearch(-1)} className="text-gray-300 hover:text-white">◀</button>
                <button onClick={() => cycleSearch(1)} className="text-gray-300 hover:text-white">▶</button>
              </>
            )}
          </div>
          <button onClick={() => addBookmark()} className="px-3 py-1.5 rounded bg-primary-600 hover:bg-primary-700"> Bookmark</button>
          {isOfflineCopy ? (
            <span className="px-3 py-1.5 rounded bg-gray-700 text-sm text-gray-200"> Saved to device</span>
          ) : accessMode === 'READ_ONLY' ? (
            <span className="px-3 py-1.5 rounded bg-gray-800 text-sm text-amber-300 flex items-center gap-1">
              <span></span> Read online only — copying & download disabled
            </span>
          ) : accessMode === 'BORROW_ONLY' ? (
            <span className="px-3 py-1.5 rounded bg-gray-800 text-sm text-blue-300 flex items-center gap-1">
              <span></span> Borrow-only copy — online reading unlocked by borrowing
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded bg-gray-800 text-sm text-indigo-300 flex items-center gap-1">
              <span></span> Read &amp; borrow — download to device after borrowing
            </span>
          )}
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))} className="px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600">−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.5, +(s + 0.25).toFixed(2)))} className="px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600">+</button>
        </div>
      </div>

      {/* Page navigation */}
      <div className="bg-gray-700 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1} className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-40">◀ Prev</button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '-'}
          </span>
          <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= numPages} className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-40">Next ▶</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={numPages}
            value={pageNumber}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 rounded text-black text-sm"
          />
          <span className="text-xs text-gray-300">/ {numPages}</span>
        </div>
      </div>

      {/* Bookmarks panel */}
      {bookmarks.length > 0 && (
        <div className="bg-gray-700 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-gray-300">Bookmarks:</span>
          {bookmarks.map((b) => (
            <button
              key={b.id}
              onClick={() => goToPage(b.page_number)}
              className="px-2 py-1 rounded bg-gray-600 text-xs hover:bg-gray-500"
            >
              Page {b.page_number} {b.note ? `- ${b.note}` : ''}
              <span onClick={(e) => { e.stopPropagation(); removeBookmark(b.id); }} className="ml-1 text-red-400 hover:text-red-300">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Document */}
      <div className="flex-1 overflow-auto flex justify-center p-6 no-right-click select-none" onContextMenu={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
        {loading ? (
          <div className="text-white text-center py-12">Loading document...</div>
        ) : fileUrl && (
          <Document
            file={fileUrl}
            ref={pdfRef}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => { console.error(err); toast.error('Failed to load PDF document'); }}
            className="shadow-2xl"
          >
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
          </Document>
        )}
      </div>
    </div>
  );
};

export default EReader;
