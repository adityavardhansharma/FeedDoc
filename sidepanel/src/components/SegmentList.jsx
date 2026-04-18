import React from 'react';

function fmt(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const STATUS_ICONS = {
  pending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  sliced: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  feeding: (
    <div className="sp sp--sm" />
  ),
  fed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

export default function SegmentList({
  segments, pageLabel, platform, isFeedingAll,
  onFeedOne, onFeedAll, onDownloadOne, onDownloadAll, onEdit, onReset,
}) {
  const allFed = segments.every(s => s.status === 'fed');
  const anyPending = segments.some(s => s.status === 'sliced' || s.status === 'error');
  const totalPages = segments.reduce((sum, s) => sum + (s.to - s.from + 1), 0);
  const totalSize = segments.reduce((sum, s) => sum + (s.data?.byteLength || 0), 0);

  return (
    <div className="sl">
      <div className="sl__summary">
        <div className="sl__stat">
          <span className="sl__val">{segments.length}</span>
          <span className="sl__key">segment{segments.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="sl__stat">
          <span className="sl__val">{totalPages}</span>
          <span className="sl__key">{pageLabel}{totalPages !== 1 ? 's' : ''}</span>
        </div>
        <div className="sl__stat">
          <span className="sl__val">{fmt(totalSize)}</span>
          <span className="sl__key">total</span>
        </div>
      </div>

      <div className="sl__list">
        {segments.map((seg, idx) => {
          const count = seg.to - seg.from + 1;
          const isFed = seg.status === 'fed';
          const isFeeding = seg.status === 'feeding';
          const isError = seg.status === 'error';
          const canFeed = platform && (seg.status === 'sliced' || seg.status === 'error' || seg.status === 'fed');

          return (
            <div key={seg.id} className={`sl__item sl__item--${seg.status}`}>
              <div className="sl__idx">{idx + 1}</div>
              <div className="sl__body">
                <div className="sl__range">
                  {pageLabel}s {seg.from}&ndash;{seg.to}
                  <span className="sl__count">({count})</span>
                </div>
                {seg.data && (
                  <div className="sl__size">{fmt(seg.data.byteLength)}</div>
                )}
              </div>
              <div className={`sl__status sl__status--${seg.status}`}>
                {STATUS_ICONS[seg.status] || STATUS_ICONS.pending}
              </div>
              <div className="sl__actions">
                {canFeed && !isFeedingAll && (
                  <button
                    className={`sl__btn${isFed ? ' sl__btn--refeed' : ''}`}
                    onClick={() => onFeedOne(seg.id)}
                    disabled={isFeeding}
                    title={isFed ? 'Re-feed' : 'Feed'}
                  >
                    {isFed ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    )}
                  </button>
                )}
                {seg.data && (
                  <button className="sl__btn" onClick={() => onDownloadOne(seg.id)} title="Download">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 4v12m0 0l4-4m-4 4l-4-4" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sl__btns">
        {platform && anyPending && (
          <button
            className="bt bt--plat bt--w"
            style={{ background: platform.primaryColor }}
            onClick={onFeedAll}
            disabled={isFeedingAll}
          >
            {isFeedingAll ? (
              <>
                <div className="sp" />
                Feeding&hellip;
              </>
            ) : (
              <>
                <span className="bt__ic" dangerouslySetInnerHTML={{ __html: platform.logo }} />
                Feed All
              </>
            )}
          </button>
        )}

        {allFed && platform && (
          <div className="sl__done">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            All segments fed
          </div>
        )}

        <button className="bt bt--ghost bt--w" onClick={onDownloadAll}>
          <span className="bt__ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 4v12m0 0l4-4m-4 4l-4-4" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
          </span>
          Download All
        </button>
      </div>

      <div className="sl__foot">
        <button className="again" onClick={onEdit}>[ edit segments ]</button>
        <button className="again" onClick={onReset}>[ start over ]</button>
      </div>

      {!platform && (
        <div className="noai">Navigate to a supported AI chat to feed files directly.</div>
      )}
    </div>
  );
}
