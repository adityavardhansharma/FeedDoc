import React, { useState, useEffect, useCallback, useRef } from 'react';
import { detectPlatform, getFileType, getFileExtension, MAX_FILE_SIZE, LARGE_FILE_THRESHOLD, IPC_SIZE_LIMIT } from './utils/platformConfig';
import FileUploader from './components/FileUploader';
import SegmentPicker from './components/SegmentPicker';
import SegmentList from './components/SegmentList';

const STEPS = { UPLOAD: 0, RANGE: 1, SLICING: 2, RESULT: 3 };

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

let segIdCounter = 0;
const createSegment = (from, to) => ({ id: ++segIdCounter, from, to, status: 'pending', data: null, name: '' });

export default function App() {
  const [platform, setPlatform] = useState(null);
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [segments, setSegments] = useState([]);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [error, setError] = useState('');
  const [isFeedingAll, setIsFeedingAll] = useState(false);
  const [warnLarge, setWarnLarge] = useState(false);
  const feedAbortRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) setPlatform(detectPlatform(tab.url));
      } catch {}
    })();
    const fn = (msg) => { if (msg.type === 'TAB_URL_CHANGED') setPlatform(detectPlatform(msg.url)); };
    chrome.runtime.onMessage.addListener(fn);
    return () => chrome.runtime.onMessage.removeListener(fn);
  }, []);

  const handleFile = useCallback(async (f) => {
    setError('');
    setSegments([]);
    if (f.size > MAX_FILE_SIZE) { setError('File exceeds 512 MB limit.'); return; }
    setWarnLarge(f.size > LARGE_FILE_THRESHOLD);
    const ft = getFileType(f.name);
    if (!ft) { setError('Only PDF, PPTX, and DOCX are supported.'); return; }
    setFile(f);
    const buf = await f.arrayBuffer();
    let pages = 0;
    try {
      if (ft.ext === 'pdf') {
        const lib = await import('pdfjs-dist');
        lib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
        pages = (await lib.getDocument({ data: buf }).promise).numPages;
      } else if (ft.ext === 'pptx') {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(buf);
        zip.forEach((p) => { if (/^ppt\/slides\/slide\d+\.xml$/.test(p)) pages++; });
      } else if (ft.ext === 'docx') {
        const JSZip = (await import('jszip')).default;
        const xml = await (await JSZip.loadAsync(buf)).file('word/document.xml')?.async('text');
        if (!xml) throw new Error('Bad DOCX');
        pages = Math.max(1, (xml.match(/w:pageBreakBefore|w:br\s[^>]*w:type="page"|w:lastRenderedPageBreak/g) || []).length + 1);
      }
    } catch { setError('Could not read file. It may be corrupted or protected.'); setFile(null); return; }
    setFileInfo({ name: f.name, size: f.size, type: ft, totalPages: pages, isEstimate: ft.ext === 'docx' });
    setSegments([createSegment(1, pages)]);
    setStep(STEPS.RANGE);
  }, []);

  // Segment management
  const handleAddSegment = useCallback(() => {
    if (!fileInfo) return;
    setSegments(prev => [...prev, createSegment(1, fileInfo.totalPages)]);
  }, [fileInfo]);

  const handleRemoveSegment = useCallback((id) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleUpdateSegment = useCallback((id, updates) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const handleSlice = useCallback(async () => {
    if (!file || !fileInfo || segments.length === 0) return;
    setStep(STEPS.SLICING);
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const base = file.name.replace(/\.[^.]+$/, '');
      const ext = getFileExtension(file.name);
      const lbl = fileInfo.type.ext === 'pptx' ? 's' : 'p';

      // Import the slicer once
      let slicer;
      if (fileInfo.type.ext === 'pdf') slicer = (await import('./slicers/pdfSlicer')).slicePdf;
      else if (fileInfo.type.ext === 'pptx') slicer = (await import('./slicers/pptxSlicer')).slicePptx;
      else slicer = (await import('./slicers/docxSlicer')).sliceDocx;

      // Slice all segments in parallel
      const results = await Promise.all(
        segments.map(async (seg) => {
          const data = await slicer(buf, seg.from, seg.to);
          const name = `${base}_${lbl}${seg.from}-${lbl}${seg.to}.${ext}`;
          return { id: seg.id, data, name };
        })
      );

      // Update segments with sliced data
      setSegments(prev => prev.map(seg => {
        const result = results.find(r => r.id === seg.id);
        return result ? { ...seg, data: result.data, name: result.name, status: 'sliced' } : seg;
      }));
      setStep(STEPS.RESULT);
    } catch { setError('Slicing failed. The file may be corrupted.'); setStep(STEPS.RANGE); }
  }, [file, fileInfo, segments]);

  const handleDownloadOne = useCallback((id) => {
    const seg = segments.find(s => s.id === id);
    if (!seg?.data || !fileInfo) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([seg.data], { type: fileInfo.type.mime }));
    a.download = seg.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [segments, fileInfo]);

  const handleDownloadAll = useCallback(() => {
    segments.forEach(seg => {
      if (seg.data) handleDownloadOne(seg.id);
    });
  }, [segments, handleDownloadOne]);

  const feedSegment = useCallback(async (seg) => {
    if (!seg.data || !fileInfo) return false;
    try {
      const arr = Array.from(seg.data);
      let res;
      if (arr.length > IPC_SIZE_LIMIT) {
        let bin = ''; for (let i = 0; i < seg.data.length; i++) bin += String.fromCharCode(seg.data[i]);
        await chrome.storage.session.set({ pendingFile: { base64: btoa(bin), fileName: seg.name, mimeType: fileInfo.type.mime } });
        res = await chrome.runtime.sendMessage({ type: 'ATTACH_FROM_STORAGE' });
      } else {
        res = await chrome.runtime.sendMessage({ type: 'ATTACH_FILE', fileName: seg.name, mimeType: fileInfo.type.mime, fileData: arr });
      }
      return res?.success || false;
    } catch { return false; }
  }, [fileInfo]);

  const handleFeedOne = useCallback(async (id) => {
    if (!platform) return;
    const seg = segments.find(s => s.id === id);
    if (!seg?.data) return;

    setSegments(prev => prev.map(s => s.id === id ? { ...s, status: 'feeding' } : s));
    setError('');

    const success = await feedSegment(seg);
    setSegments(prev => prev.map(s => s.id === id ? { ...s, status: success ? 'fed' : 'error' } : s));
    if (!success) setError('Feed failed. Try Download instead.');
  }, [platform, segments, feedSegment]);

  const handleFeedAll = useCallback(async () => {
    if (!platform) return;
    feedAbortRef.current = false;
    setIsFeedingAll(true);
    setError('');

    // Get segments that need feeding (sliced or error, not already fed)
    const toFeed = segments.filter(s => s.status === 'sliced' || s.status === 'error');

    for (const seg of toFeed) {
      if (feedAbortRef.current) break;

      setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, status: 'feeding' } : s));

      const success = await feedSegment(seg);
      setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, status: success ? 'fed' : 'error' } : s));

      if (!success) {
        setError(`Feed failed for segment ${segments.findIndex(s => s.id === seg.id) + 1}. Stopped.`);
        break;
      }

      // Small delay between feeds to let the chat UI settle
      await new Promise(r => setTimeout(r, 300));
    }

    setIsFeedingAll(false);
  }, [platform, segments, feedSegment]);

  const handleEdit = useCallback(() => {
    feedAbortRef.current = true;
    setIsFeedingAll(false);
    // Reset segment statuses but preserve ranges
    setSegments(prev => prev.map(s => ({ ...s, status: 'pending', data: null, name: '' })));
    setStep(STEPS.RANGE);
  }, []);

  const reset = useCallback(() => {
    feedAbortRef.current = true;
    setFile(null); setFileInfo(null); setSegments([]);
    setError(''); setIsFeedingAll(false); setWarnLarge(false); setStep(STEPS.UPLOAD);
  }, []);

  const noun = fileInfo?.type.ext === 'pptx' ? 'slide' : 'page';

  // Validation: all segments valid and no overlaps
  const isSegmentValid = (seg, idx) => {
    if (seg.from < 1 || seg.to > (fileInfo?.totalPages || 0) || seg.from > seg.to) return false;
    for (let i = 0; i < segments.length; i++) {
      if (i !== idx && !(seg.to < segments[i].from || seg.from > segments[i].to)) return false;
    }
    return true;
  };
  const allValid = segments.length > 0 && segments.every((s, i) => isSegmentValid(s, i));
  const totalCount = segments.reduce((sum, s) => sum + Math.max(0, s.to - s.from + 1), 0);

  return (
    <div className="fd">
      <div className="fd__head">
        <div className="fd__brand">
          <div className="fd__logo">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" fill="var(--void)"/>
              <rect x="1" y="1" width="30" height="30" stroke="var(--glow)" strokeWidth="1" fill="none"/>
              <text x="16" y="22" textAnchor="middle" fontFamily="monospace" fontWeight="800" fontSize="14" fill="var(--glow)">FD</text>
            </svg>
          </div>
          <span className="fd__title">FeedDoc</span>
        </div>

        {platform ? (
          <div className="fd__pip fd__pip--on">
            <span className="fd__pip__icon" style={{ color: platform.primaryColor }} dangerouslySetInnerHTML={{ __html: platform.logo }} />
            <span className="fd__pip__dot" />
            <span>{platform.name}</span>
          </div>
        ) : (
          <div className="fd__pip">
            <span>Offline</span>
          </div>
        )}
      </div>

      <div className="fd__body">
        {error && <div className="msg msg--err">{error}</div>}
        {warnLarge && step >= STEPS.RANGE && step < STEPS.RESULT && (
          <div className="msg msg--warn">Large file detected &mdash; slicing may take a moment.</div>
        )}

        {step === STEPS.UPLOAD && <FileUploader onFile={handleFile} />}

        {step >= STEPS.RANGE && fileInfo && (
          <div className="fc">
            <div className="fc__ext" style={{ background: fileInfo.type.color }}>{fileInfo.type.ext.toUpperCase()}</div>
            <div className="fc__body">
              <div className="fc__name">{fileInfo.name}</div>
              <div className="fc__meta">
                {fileInfo.isEstimate ? '~' : ''}{fileInfo.totalPages} {noun}s &middot; {fmtSize(fileInfo.size)}
              </div>
            </div>
            {step === STEPS.RANGE && (
              <button className="fc__x" onClick={reset} aria-label="Remove file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        )}

        {fileInfo?.isEstimate && step === STEPS.RANGE && (
          <div className="msg msg--warn">Word page count is approximate &mdash; based on explicit page breaks.</div>
        )}

        {step === STEPS.RANGE && fileInfo && (
          <SegmentPicker
            segments={segments}
            totalPages={fileInfo.totalPages}
            pageLabel={fileInfo.type.ext === 'pptx' ? 'Slide' : 'Page'}
            onUpdate={handleUpdateSegment}
            onAdd={handleAddSegment}
            onRemove={handleRemoveSegment}
          />
        )}

        {step === STEPS.RANGE && (
          <button className="bt bt--prime bt--w" disabled={!allValid} onClick={handleSlice}>
            <span className="bt__ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </span>
            Slice {segments.length} segment{segments.length !== 1 ? 's' : ''} ({totalCount} {noun}{totalCount !== 1 ? 's' : ''})
          </button>
        )}

        {step === STEPS.SLICING && (
          <div className="wait">
            <div className="sp sp--g" style={{ width: 22, height: 22, borderWidth: 2.5 }} />
            <span className="wait__txt">Processing&hellip;</span>
          </div>
        )}

        {step === STEPS.RESULT && segments.length > 0 && (
          <SegmentList
            segments={segments}
            pageLabel={noun}
            platform={platform}
            isFeedingAll={isFeedingAll}
            onFeedOne={handleFeedOne}
            onFeedAll={handleFeedAll}
            onDownloadOne={handleDownloadOne}
            onDownloadAll={handleDownloadAll}
            onEdit={handleEdit}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}
