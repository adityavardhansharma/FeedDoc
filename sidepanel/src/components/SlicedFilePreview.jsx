import React from 'react';
import AttachButton from './AttachButton';

function fmt(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function SlicedFilePreview({
  originalName, slicedName, slicedSize, pageCount, pageLabel,
  onDownload, platform, onAttach, attachStatus, onReset,
}) {
  return (
    <div className="rs">
      <div className="rs__map">
        <span className="rs__old" title={originalName}>{originalName}</span>
        <span className="rs__arr">&rarr;</span>
        <span className="rs__new" title={slicedName}>{slicedName}</span>
      </div>

      <div className="rs__grid">
        <div className="rs__cell">
          <div className="rs__val">{pageCount}</div>
          <div className="rs__key">{pageLabel}{pageCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="rs__cell">
          <div className="rs__val">{fmt(slicedSize)}</div>
          <div className="rs__key">Size</div>
        </div>
      </div>

      <div className="rs__btns">
        <AttachButton platform={platform} onClick={onAttach} status={attachStatus} disabled={!platform} />
        <button className="bt bt--ghost bt--w" onClick={onDownload}>
          <span className="bt__ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12m0 0l4-4m-4 4l-4-4" />
              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
          </span>
          Download
        </button>
      </div>

      <button className="again" onClick={onReset}>[ slice another ]</button>
    </div>
  );
}
