import React from 'react';

export default function SegmentPicker({ segments, totalPages, pageLabel, fileName, onUpdate, onAdd, onRemove }) {
  const canAdd = segments.length < 10;
  const canRemove = segments.length > 1;
  const lbl = pageLabel === 'Slide' ? 's' : 'p';
  const ext = fileName?.split('.').pop() || 'pdf';
  const base = fileName?.replace(/\.[^.]+$/, '') || 'file';

  const validateSegment = (seg, idx) => {
    const errors = [];
    if (seg.from < 1) errors.push(`${pageLabel} must be >= 1`);
    if (seg.to > totalPages) errors.push(`Max is ${totalPages}`);
    if (seg.from > seg.to) errors.push('From must be <= To');
    // Check overlap with other segments
    for (let i = 0; i < segments.length; i++) {
      if (i !== idx) {
        const other = segments[i];
        if (!(seg.to < other.from || seg.from > other.to)) {
          errors.push('Overlaps with another segment');
          break;
        }
      }
    }
    return errors;
  };

  const getPlaceholder = (seg) => `${base}_${lbl}${seg.from}-${lbl}${seg.to}.${ext}`;

  return (
    <div className="sp-wrap">
      {segments.map((seg, idx) => {
        const errors = validateSegment(seg, idx);
        const hasBadFrom = seg.from < 1 || seg.from > seg.to;
        const hasBadTo = seg.to > totalPages || seg.to < seg.from;
        const count = errors.length === 0 ? seg.to - seg.from + 1 : 0;

        return (
          <div key={seg.id} className="seg">
            <div className="seg__head">
              <span className="seg__num">{idx + 1}</span>
              {canRemove && (
                <button className="seg__rm" onClick={() => onRemove(seg.id)} aria-label="Remove segment">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div className="seg__row">
              <div className="seg__col">
                <label className="seg__lbl">From</label>
                <input
                  className={`seg__in${hasBadFrom ? ' seg__in--bad' : ''}`}
                  type="number" min={1} max={totalPages} value={seg.from}
                  onChange={(e) => onUpdate(seg.id, { from: Math.max(0, parseInt(e.target.value) || 0) })}
                  aria-label={`From ${pageLabel.toLowerCase()}`}
                />
              </div>
              <span className="seg__sep">&mdash;</span>
              <div className="seg__col">
                <label className="seg__lbl">To</label>
                <input
                  className={`seg__in${hasBadTo ? ' seg__in--bad' : ''}`}
                  type="number" min={1} max={totalPages} value={seg.to}
                  onChange={(e) => onUpdate(seg.id, { to: Math.max(0, parseInt(e.target.value) || 0) })}
                  aria-label={`To ${pageLabel.toLowerCase()}`}
                />
              </div>
            </div>
            <div className="seg__name-row">
              <label className="seg__lbl">Name</label>
              <input
                className="seg__name-in"
                type="text"
                value={seg.customName || ''}
                onChange={(e) => onUpdate(seg.id, { customName: e.target.value })}
                placeholder={getPlaceholder(seg)}
                aria-label="Segment name"
              />
            </div>
            {errors.length > 0 ? (
              <div className="seg__err">{errors[0]}</div>
            ) : (
              <div className="seg__info">
                {count} {pageLabel.toLowerCase()}{count !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      })}

      {canAdd && (
        <button className="seg__add" onClick={onAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add segment
        </button>
      )}
    </div>
  );
}
