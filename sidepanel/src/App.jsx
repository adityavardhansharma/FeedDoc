import React, { useState, useEffect, useCallback } from 'react';
import { detectPlatform, getFileType, getFileExtension, MAX_FILE_SIZE, LARGE_FILE_THRESHOLD, IPC_SIZE_LIMIT } from './utils/platformConfig';
import FileUploader from './components/FileUploader';
import RangePicker from './components/RangePicker';
import SlicedFilePreview from './components/SlicedFilePreview';

const STEPS = { UPLOAD: 0, RANGE: 1, SLICING: 2, RESULT: 3 };

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function App() {
  const [platform, setPlatform] = useState(null);
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [slicedData, setSlicedData] = useState(null);
  const [slicedName, setSlicedName] = useState('');
  const [error, setError] = useState('');
  const [attachStatus, setAttachStatus] = useState('idle');
  const [warnLarge, setWarnLarge] = useState(false);

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
    setSlicedData(null);
    setAttachStatus('idle');
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
    setFromPage(1);
    setToPage(pages);
    setStep(STEPS.RANGE);
  }, []);

  const handleSlice = useCallback(async () => {
    if (!file || !fileInfo) return;
    setStep(STEPS.SLICING);
    setError('');
    try {
      const buf = await file.arrayBuffer();
      let result;
      if (fileInfo.type.ext === 'pdf') { result = await (await import('./slicers/pdfSlicer')).slicePdf(buf, fromPage, toPage); }
      else if (fileInfo.type.ext === 'pptx') { result = await (await import('./slicers/pptxSlicer')).slicePptx(buf, fromPage, toPage); }
      else { result = await (await import('./slicers/docxSlicer')).sliceDocx(buf, fromPage, toPage); }
      const base = file.name.replace(/\.[^.]+$/, '');
      const ext = getFileExtension(file.name);
      const lbl = fileInfo.type.ext === 'pptx' ? 's' : 'p';
      setSlicedData(result);
      setSlicedName(`${base}_${lbl}${fromPage}-${lbl}${toPage}.${ext}`);
      setStep(STEPS.RESULT);
    } catch { setError('Slicing failed. The file may be corrupted.'); setStep(STEPS.RANGE); }
  }, [file, fileInfo, fromPage, toPage]);

  const handleDownload = useCallback(() => {
    if (!slicedData) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([slicedData], { type: fileInfo.type.mime }));
    a.download = slicedName;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [slicedData, slicedName, fileInfo]);

  const handleAttach = useCallback(async () => {
    if (!slicedData || !platform) return;
    setAttachStatus('loading');
    setError('');
    try {
      const arr = Array.from(slicedData);
      let res;
      if (arr.length > IPC_SIZE_LIMIT) {
        let bin = ''; for (let i = 0; i < slicedData.length; i++) bin += String.fromCharCode(slicedData[i]);
        await chrome.storage.session.set({ pendingFile: { base64: btoa(bin), fileName: slicedName, mimeType: fileInfo.type.mime } });
        res = await chrome.runtime.sendMessage({ type: 'ATTACH_FROM_STORAGE' });
      } else {
        res = await chrome.runtime.sendMessage({ type: 'ATTACH_FILE', fileName: slicedName, mimeType: fileInfo.type.mime, fileData: arr });
      }
      if (res?.success) { setAttachStatus('success'); setTimeout(() => setAttachStatus('idle'), 3000); }
      else { setAttachStatus('idle'); setError(res?.error || 'Auto-attach failed. Use Download instead.'); }
    } catch { setAttachStatus('idle'); setError('Auto-attach failed. Use Download instead.'); }
  }, [slicedData, slicedName, fileInfo, platform]);

  const reset = useCallback(() => {
    setFile(null); setFileInfo(null); setSlicedData(null); setSlicedName('');
    setError(''); setAttachStatus('idle'); setWarnLarge(false); setStep(STEPS.UPLOAD);
  }, []);

  const valid = fromPage >= 1 && toPage >= fromPage && (!fileInfo || toPage <= fileInfo.totalPages);
  const count = valid ? toPage - fromPage + 1 : 0;
  const noun = fileInfo?.type.ext === 'pptx' ? 'slide' : 'page';

  return (
    <div className="fd">
      <div className="fd__head">
        <div className="fd__brand">
          <div className="fd__logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
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
          <RangePicker from={fromPage} to={toPage} totalPages={fileInfo.totalPages}
            pageLabel={fileInfo.type.ext === 'pptx' ? 'Slide' : 'Page'}
            onFromChange={setFromPage} onToChange={setToPage} />
        )}

        {step === STEPS.RANGE && (
          <button className="bt bt--prime bt--w" disabled={!valid} onClick={handleSlice}>
            <span className="bt__ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </span>
            Slice {count} {noun}{count !== 1 ? 's' : ''}
          </button>
        )}

        {step === STEPS.SLICING && (
          <div className="wait">
            <div className="sp sp--g" style={{ width: 22, height: 22, borderWidth: 2.5 }} />
            <span className="wait__txt">Processing&hellip;</span>
          </div>
        )}

        {step === STEPS.RESULT && slicedData && (
          <SlicedFilePreview
            originalName={fileInfo.name} slicedName={slicedName}
            slicedSize={slicedData.byteLength} pageCount={count} pageLabel={noun}
            onDownload={handleDownload} platform={platform}
            onAttach={handleAttach} attachStatus={attachStatus} onReset={reset}
          />
        )}

        {!platform && step === STEPS.RESULT && (
          <div className="noai">Navigate to a supported AI chat to feed files directly.</div>
        )}
      </div>
    </div>
  );
}
