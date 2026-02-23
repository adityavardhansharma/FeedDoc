import React from 'react';

export default function AttachButton({ platform, onClick, status, disabled }) {
  if (!platform) {
    return (
      <button className="bt bt--ghost bt--w" disabled title="Navigate to a supported AI platform">
        <span className="bt__ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </span>
        Feed to Chat
      </button>
    );
  }

  const loading = status === 'loading';
  const success = status === 'success';

  return (
    <button
      className="bt bt--plat bt--w"
      style={{ background: success ? 'var(--glow)' : platform.primaryColor, color: success ? 'var(--void)' : '#fff' }}
      onClick={onClick}
      disabled={disabled || loading || success}
    >
      {loading ? (
        <div className="sp" />
      ) : success ? (
        <span className="bt__ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : (
        <span className="bt__ic" style={{ color: platform.textColor }} dangerouslySetInnerHTML={{ __html: platform.logo }} />
      )}
      {success ? 'FED' : loading ? 'Feeding\u2026' : platform.buttonLabel}
    </button>
  );
}
