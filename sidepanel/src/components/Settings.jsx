import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../utils/storage';
import { testConnection } from '../utils/supabase';

export default function Settings({ onClose, onSettingsChange }) {
  const [settings, setSettings] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'success' | 'error' | null
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!settings.supabaseUrl || !settings.supabasePublishableKey || !settings.supabaseBucket) return;
    setTesting(true);
    setTestResult(null);
    const ok = await testConnection(
      settings.supabaseUrl,
      settings.supabasePublishableKey,
      settings.supabaseBucket
    );
    setTestResult(ok ? 'success' : 'error');
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(settings);
    onSettingsChange?.(settings);
    setSaving(false);
    onClose();
  };

  const handleClearConfig = () => {
    handleChange('supabaseUrl', '');
    handleChange('supabasePublishableKey', '');
    handleChange('supabaseBucket', '');
    handleChange('storageEnabled', false);
  };

  const publishableKey = settings?.supabasePublishableKey?.trim() || '';
  const isSecretKey = publishableKey.startsWith('sb_secret_');
  const isLegacyAnonKey = publishableKey.startsWith('eyJ');
  const isConfigured = settings?.supabaseUrl && publishableKey && settings?.supabaseBucket;

  if (!settings) {
    return (
      <div className="stg">
        <div className="stg__load">
          <div className="sp sp--g" style={{ width: 18, height: 18 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stg">
      <div className="stg__head">
        <span className="stg__title">Settings</span>
        <button className="stg__close" onClick={onClose} aria-label="Close settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="stg__body">
        <div className="stg__section">
          <div className="stg__row">
            <label className="stg__label">Enable File Storage</label>
            <button
              className={`stg__toggle${settings.storageEnabled ? ' stg__toggle--on' : ''}`}
              onClick={() => handleChange('storageEnabled', !settings.storageEnabled)}
              aria-pressed={settings.storageEnabled}
            >
              <span className="stg__toggle__knob" />
            </button>
          </div>
          <p className="stg__hint">Save segments to cloud. Requires a Supabase account (free).</p>
        </div>

        {settings.storageEnabled && (
          <>
            <div className="stg__section">
              <label className="stg__label">Supabase Project URL</label>
              <input
                type="text"
                className="stg__input"
                value={settings.supabaseUrl || ''}
                onChange={(e) => handleChange('supabaseUrl', e.target.value)}
                placeholder="https://xxxxx.supabase.co"
                spellCheck={false}
              />
            </div>

            <div className="stg__section">
              <label className="stg__label">Publishable Key</label>
              <div className="stg__key-wrap">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="stg__input"
                  value={settings.supabasePublishableKey || ''}
                  onChange={(e) => handleChange('supabasePublishableKey', e.target.value)}
                  placeholder="sb_publishable_..."
                  spellCheck={false}
                />
                <button className="stg__key-btn" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
                  {showKey ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="stg__hint">
                {isSecretKey
                  ? 'Use a publishable key here. Secret keys are server-only and will not work in a browser extension.'
                  : isLegacyAnonKey
                    ? 'Legacy anon keys still work, but Supabase now recommends publishable keys (`sb_publishable_...`).'
                    : 'Use your Supabase publishable key (`sb_publishable_...`).'}
              </p>
            </div>

            <div className="stg__section">
              <label className="stg__label">Bucket Name</label>
              <input
                type="text"
                className="stg__input"
                value={settings.supabaseBucket || ''}
                onChange={(e) => handleChange('supabaseBucket', e.target.value)}
                placeholder="feedoc"
                spellCheck={false}
              />
              <p className="stg__hint">Create a public bucket in Supabase Storage.</p>
            </div>

            <div className="stg__key-actions">
              <button
                className="stg__btn stg__btn--sm"
                onClick={handleTest}
                disabled={!isConfigured || testing || isSecretKey}
              >
                {testing ? <div className="sp" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : 'Test'}
              </button>
              {isConfigured && (
                <button className="stg__btn stg__btn--sm stg__btn--danger" onClick={handleClearConfig}>
                  Clear
                </button>
              )}
              {testResult === 'success' && <span className="stg__test stg__test--ok">Connected</span>}
              {testResult === 'error' && <span className="stg__test stg__test--err">Failed</span>}
            </div>

            <div className="stg__section">
              <div className="stg__row">
                <label className="stg__label">Auto-save segments</label>
                <button
                  className={`stg__toggle${settings.autoSave ? ' stg__toggle--on' : ''}`}
                  onClick={() => handleChange('autoSave', !settings.autoSave)}
                  aria-pressed={settings.autoSave}
                >
                  <span className="stg__toggle__knob" />
                </button>
              </div>
              <p className="stg__hint">Automatically save all segments after slicing.</p>
            </div>

            {settings.autoSave && (
              <div className="stg__section">
                <div className="stg__row">
                  <label className="stg__label">Also save original file</label>
                  <button
                    className={`stg__toggle${settings.autoSaveOriginal ? ' stg__toggle--on' : ''}`}
                    onClick={() => handleChange('autoSaveOriginal', !settings.autoSaveOriginal)}
                    aria-pressed={settings.autoSaveOriginal}
                  >
                    <span className="stg__toggle__knob" />
                  </button>
                </div>
              </div>
            )}

            <div className="stg__section">
              <div className="stg__row">
                <label className="stg__label">Default to permanent</label>
                <button
                  className={`stg__toggle${settings.defaultPermanent ? ' stg__toggle--on' : ''}`}
                  onClick={() => handleChange('defaultPermanent', !settings.defaultPermanent)}
                  aria-pressed={settings.defaultPermanent}
                >
                  <span className="stg__toggle__knob" />
                </button>
              </div>
              <p className="stg__hint">New files won't auto-delete after 2 days.</p>
            </div>
          </>
        )}
      </div>

      <div className="stg__foot">
        <button className="bt bt--ghost" onClick={onClose}>Cancel</button>
        <button className="bt bt--prime" onClick={handleSave} disabled={saving}>
          {saving ? <div className="sp" style={{ width: 12, height: 12, borderWidth: 2 }} /> : 'Save'}
        </button>
      </div>
    </div>
  );
}
