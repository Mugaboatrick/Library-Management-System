// Component: camera modal that reads a 1-D barcode off a book and hands the
// decoded text to its parent. Self-contained so the parent stays declarative.
import React, { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';

// Names of the 1-D formats to decode, NOT the numeric ids.
//
// The ids must come from the library's own enum. A previous version hardcoded
// them using ZXing's Java/Android numbering, which does not match
// @zxing/library — there EAN_13 is 7, not 3. That silently omitted EAN-13,
// which is the international ISBN barcode printed on almost every book, so
// international labels simply never decoded. Resolving names through
// BarcodeFormat means the list cannot drift from the installed version again.
const LINEAR_FORMAT_NAMES = [
  'EAN_13', // the international ISBN barcode on books
  'EAN_8',
  'UPC_A',
  'UPC_E',
  'CODE_128', // what our own printed labels use
  'CODE_39',
  'ITF'
];

// Reads a 1-D barcode off a book and hands the decoded text to its parent.
// Two callers share it:
//   'relabel' - the book is already saved, so the code replaces the generated
//               one on an existing copy.
//   'capture' - the book is still being typed into the Add Hard Book form, so
//               the code becomes the first copy's code before the insert.
// The camera session is identical; only the wording and the stacking differ.
const RelabelScannerModal = ({
  open,
  onClose,
  onDetected,
  busy,
  error,
  currentCode,
  mode = 'relabel',
  zIndex = 50
}) => {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const rafRef = useRef(0);
  const doneRef = useRef(false);
  const [status, setStatus] = useState('');
  const [cameraError, setCameraError] = useState('');
  // Held in a ref so the camera session is keyed to `open` alone. Depending on
  // the callback directly would tear down and restart the camera on every
  // parent render, because the parent recreates the handler each time.
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  // ZXing issues video.play() internally, and one of those calls (the retry
  // from its 'canplay' listener) is not awaited or caught by the library. If the
  // modal closes while that play() is still pending, React unmounts the <video>,
  // the browser rejects the promise with AbortError, and it surfaces as
  // "Uncaught (in promise) AbortError".
  //
  // It is harmless: a rejected play() only means the preview stopped starting,
  // and we are tearing the camera down anyway. The promise belongs to ZXing so
  // a .catch() cannot be attached to it directly — instead this listener drops
  // ONLY that specific rejection, while the scanner is open. Every other
  // unhandled rejection still reports as normal.
  useEffect(() => {
    if (!open) return undefined;
    const onUnhandled = (event) => {
      const reason = event && event.reason;
      if (reason && reason.name === 'AbortError') {
        const message = String((reason && reason.message) || '');
        if (/play\(\)|interrupted|media was removed/i.test(message)) {
          event.preventDefault();
        }
      }
    };
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => window.removeEventListener('unhandledrejection', onUnhandled);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    doneRef.current = false;
    setStatus('Point the camera at the barcode on the book.');
    setCameraError('');

    const stop = () => {
      cancelAnimationFrame(rafRef.current);
      if (readerRef.current) {
        try { readerRef.current.stop(); } catch {}
        readerRef.current = null;
      }
      if (controlsRef.current) {
        controlsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const v = videoRef.current;
      if (v) {
        // Pause before detaching the source. Dropping srcObject while a play()
        // is still in flight is what produces the AbortError; pausing first
        // lets the element settle so the pending play() rejects quietly.
        try { v.pause(); } catch {}
        v.removeAttribute('autoplay');
        v.srcObject = null;
        // load() detaches the decoder so the browser stops holding the last
        // frame, and releases the element sooner when it is unmounted.
        try { v.load(); } catch {}
      }
    };

    (async () => {
      let reader = null;
      let controls = null;
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const { BarcodeFormat, DecodeHintType } = await import('@zxing/library');
        if (cancelled) return;

        // EAN/ISBN and Code128 together, so both a publisher's own barcode and
        // a label we printed are readable with one camera session.
        //
        // Format ids are resolved by NAME from the library's enum, never
        // hardcoded: the previous numeric list used ZXing's Java/Android
        // numbering, which does not match @zxing/library — there EAN_13 is 7,
        // not 3. EAN-13 is the international ISBN barcode on almost every book,
        // so hardcoding silently omitted it and international labels never
        // decoded. RSS_EXPANDED is also dropped: it logs a "not ready for
        // production" warning from the library and no book label uses it.
        const linearFormats = LINEAR_FORMAT_NAMES.map((n) => BarcodeFormat[n]).filter((n) => n != null);
        if (linearFormats.length === 0) {
          throw new Error('No supported barcode formats resolved');
        }

        // TRY_HARDER is deliberately OFF. It makes the decoder brute-force
        // extra binarization strategies, which measured 438ms per frame versus
        // 32ms without it on this code — roughly 2.3 attempts/sec, so the
        // scanner felt dead while the user was still aiming the camera. It
        // only helps on damaged or low-quality print; a book barcode held in
        // frame decodes on the normal path far faster.
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, linearFormats);
        // Pure black on white is the norm for book labels. Without this ZXing
        // defaults to looking for inverted codes first, which costs frames and
        // makes a faint or small print read as "no barcode found".
        hints.set(DecodeHintType.ALSO_INVERTED, false);

        reader = new BrowserMultiFormatReader(hints, {
          formatsToSupport: linearFormats,
          // Keep the loop tight so a code is picked up as soon as it is in
          // frame. The library default is 500ms, which adds a visible lag even
          // when a decode would have succeeded immediately.
          delayBetweenScanAttempts: 80,
          delayBetweenScanSuccess: 200
        });
        readerRef.current = reader;

        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (!result || cancelled || doneRef.current) return;
          const text = String(result.getText() || '').trim();
          if (!text) return;
          doneRef.current = true;
          stop();
          const name = BarcodeFormat[result.getBarcodeFormat()] || 'barcode';
          setStatus(`Read ${name}: ${text}`);
          onDetectedRef.current?.(text, name);
        });
        controlsRef.current = controls;
        if (cancelled) stop();
      } catch (err) {
        if (cancelled) return;
        // getUserMedia needs a secure context; localhost counts as one.
        const msg = err && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access for this site, then reopen the scanner.'
          : 'Could not start the camera. Close this and reopen the scanner, and make sure no other app is using it.';
        setCameraError(msg);
        setStatus('');
        stop();
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open]);

  // Never leave the camera running after a successful relabel closes the modal.
  const isCapture = mode === 'capture';
  return (
    <Modal
      open={open}
      zIndex={zIndex}
      onClose={() => {
        if (busy) return;
        onClose?.();
      }}
      title={isCapture ? 'Scan the barcode on the book' : 'Scan the barcode on the book'}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {isCapture ? (
            'Scan the barcode printed on the book. It becomes the code for the first copy of this new book.'
          ) : currentCode ? (
            <>
              This copy currently uses <span className="font-mono font-semibold">{currentCode}</span>. Scanning a
              different barcode replaces it and re-prints the label.
            </>
          ) : (
            'Scan the barcode printed on the book to use it for this copy instead of the generated one.'
          )}
        </p>

        <div
          className="relative w-full rounded-lg overflow-hidden bg-black"
          style={{ aspectRatio: '4 / 3' }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          {/* A 1-D barcode is a wide, short strip, so the guide is a horizontal
              band rather than a square. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[86%] h-[26%] border-2 border-white/90 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
          {status && !cameraError && (
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white px-2">
              {status}
            </p>
          )}
        </div>

        {cameraError && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {cameraError}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Cancel'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RelabelScannerModal;
