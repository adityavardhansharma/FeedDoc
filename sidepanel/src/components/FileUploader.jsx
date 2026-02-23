import React, { useRef, useState, useCallback } from 'react';

const ACCEPT = '.pdf,.pptx,.docx';

export default function FileUploader({ onFile }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  const stop = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
  const enter = useCallback((e) => { stop(e); setOn(true); }, [stop]);
  const leave = useCallback((e) => { stop(e); setOn(false); }, [stop]);
  const drop = useCallback((e) => { stop(e); setOn(false); if (e.dataTransfer?.files?.[0]) onFile(e.dataTransfer.files[0]); }, [stop, onFile]);
  const click = () => ref.current?.click();
  const change = (e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ''; };

  return (
    <div
      className={`uz${on ? ' uz--on' : ''}`}
      onClick={click}
      onDragEnter={enter}
      onDragOver={stop}
      onDragLeave={leave}
      onDrop={drop}
      role="button"
      tabIndex={0}
      aria-label="Upload a document"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') click(); }}
    >
      <input ref={ref} type="file" accept={ACCEPT} onChange={change} style={{ display: 'none' }} aria-hidden="true" />

      <div className="uz__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
      </div>

      <div>
        <div className="uz__label">Drop file or click to browse</div>
        <div className="uz__sub">PDF, PPTX, or DOCX &middot; max 512 MB</div>
      </div>

      <div className="uz__tags">
        <span className="uz__tag" style={{ color: '#EF4444' }}>PDF</span>
        <span className="uz__tag" style={{ color: '#F97316' }}>PPTX</span>
        <span className="uz__tag" style={{ color: '#3B82F6' }}>DOCX</span>
      </div>
    </div>
  );
}
