import React, { useState, useEffect, useCallback } from 'react';
import { getFiles, updateFile, removeFile } from '../utils/storage';
import { deleteFile, fetchFile } from '../utils/supabase';

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function fmtExpiry(uploadedAt, isPermanent) {
  if (isPermanent) return null;
  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
  const remaining = (uploadedAt + TWO_DAYS) - Date.now();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h left`;
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Library({ supabaseUrl, supabaseKey, supabaseBucket, platform, onLoadFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [feedingId, setFeedingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadFiles = useCallback(async () => {
    const f = await getFiles();
    setFiles(f);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleRename = async (fileKey) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    await updateFile(fileKey, { name: editName.trim() });
    setEditingId(null);
    loadFiles();
  };

  const handleTogglePermanent = async (file) => {
    await updateFile(file.key, { isPermanent: !file.isPermanent });
    loadFiles();
  };

  const handleDelete = async (file) => {
    setDeletingId(file.key);
    await deleteFile(supabaseUrl, supabaseKey, supabaseBucket, file.key);
    await removeFile(file.key);
    setDeletingId(null);
    loadFiles();
  };

  const handleFeed = async (file) => {
    setFeedingId(file.key);
    try {
      const data = await fetchFile(file.url);
      // Pass to parent to handle feeding
      onLoadFile?.({
        data,
        name: file.name,
        type: file.fileType,
        isSegment: file.isSegment,
        pageRange: file.pageRange,
      });
    } catch (err) {
      console.error('Failed to fetch file:', err);
    }
    setFeedingId(null);
  };

  const handleDownload = async (file) => {
    try {
      const data = await fetchFile(file.url);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: file.mimeType }));
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Failed to download:', err);
    }
  };

  if (loading) {
    return (
      <div className="lib">
        <div className="lib__empty">
          <div className="sp sp--g" style={{ width: 18, height: 18 }} />
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="lib">
        <div className="lib__empty">
          <div className="lib__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <span className="lib__empty-text">No saved files</span>
          <span className="lib__empty-hint">Save segments from the upload flow to access them here.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lib">
      <div className="lib__list">
        {files.map(file => {
          const expiry = fmtExpiry(file.uploadedAt, file.isPermanent);
          const isEditing = editingId === file.key;
          const isFeeding = feedingId === file.key;
          const isDeleting = deletingId === file.key;

          return (
            <div key={file.key} className={`lib__item${file.isPermanent ? ' lib__item--perm' : ''}`}>
              <div className="lib__main">
                <div className="lib__type" style={{ background: file.typeColor }}>
                  {file.isSegment ? 'SEG' : file.fileType?.toUpperCase()}
                </div>
                <div className="lib__info">
                  {isEditing ? (
                    <input
                      className="lib__name-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(file.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(file.key);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      className="lib__name"
                      onClick={() => { setEditingId(file.key); setEditName(file.name); }}
                      title="Click to rename"
                    >
                      {file.name}
                    </button>
                  )}
                  <div className="lib__meta">
                    {file.pageRange && <span className="lib__range">{file.pageRange}</span>}
                    <span>{fmtSize(file.size)}</span>
                    <span>{fmtDate(file.uploadedAt)}</span>
                    {expiry && <span className="lib__expiry">{expiry}</span>}
                    {file.isPermanent && (
                      <span className="lib__perm" title="Permanent">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="lib__actions">
                {platform && (
                  <button
                    className="lib__btn"
                    onClick={() => handleFeed(file)}
                    disabled={isFeeding}
                    title="Load & Feed"
                  >
                    {isFeeding ? (
                      <div className="sp sp--sm" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    )}
                  </button>
                )}
                <button className="lib__btn" onClick={() => handleDownload(file)} title="Download">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v12m0 0l4-4m-4 4l-4-4" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                </button>
                <button
                  className={`lib__btn${file.isPermanent ? ' lib__btn--active' : ''}`}
                  onClick={() => handleTogglePermanent(file)}
                  title={file.isPermanent ? 'Remove permanent' : 'Make permanent'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </button>
                <button
                  className="lib__btn lib__btn--danger"
                  onClick={() => handleDelete(file)}
                  disabled={isDeleting}
                  title="Delete"
                >
                  {isDeleting ? (
                    <div className="sp sp--sm" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
