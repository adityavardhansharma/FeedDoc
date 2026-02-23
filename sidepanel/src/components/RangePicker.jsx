import React, { useMemo } from 'react';

export default function RangePicker({ from, to, totalPages, pageLabel, onFromChange, onToChange }) {
  const errors = useMemo(() => {
    const e = [];
    if (from < 1) e.push(`${pageLabel} must be >= 1`);
    if (to > totalPages) e.push(`Max is ${totalPages}`);
    if (from > to) e.push('From must be <= To');
    return e;
  }, [from, to, totalPages, pageLabel]);

  const valid = errors.length === 0 && from >= 1 && to <= totalPages && from <= to;
  const count = valid ? to - from + 1 : 0;

  return (
    <div className="rg">
      <div className="rg__row">
        <div className="rg__col">
          <label className="rg__lbl">From</label>
          <input
            className={`rg__in${from < 1 || from > to ? ' rg__in--bad' : ''}`}
            type="number" min={1} max={totalPages} value={from}
            onChange={(e) => onFromChange(Math.max(0, parseInt(e.target.value) || 0))}
            aria-label={`From ${pageLabel.toLowerCase()}`}
          />
        </div>
        <span className="rg__sep">&mdash;</span>
        <div className="rg__col">
          <label className="rg__lbl">To</label>
          <input
            className={`rg__in${to > totalPages || to < from ? ' rg__in--bad' : ''}`}
            type="number" min={1} max={totalPages} value={to}
            onChange={(e) => onToChange(Math.max(0, parseInt(e.target.value) || 0))}
            aria-label={`To ${pageLabel.toLowerCase()}`}
          />
        </div>
      </div>
      {errors.length > 0 && <div className="rg__err">{errors[0]}</div>}
      {valid && (
        <div className="rg__info">
          {pageLabel}s <b>{from}&ndash;{to}</b> &middot; {count} {pageLabel.toLowerCase()}{count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
