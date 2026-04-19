// Chrome storage wrapper for settings and file metadata
// Uses chrome.storage.local which persists across browser storage clears

const SETTINGS_KEY = 'feedoc_settings';
const FILES_KEY = 'feedoc_files';

const DEFAULT_SETTINGS = {
  storageEnabled: false,
  supabaseUrl: '',
  supabaseKey: '',
  supabaseBucket: '',
  autoSave: false,
  autoSaveOriginal: false,
  defaultPermanent: false,
};

export async function getSettings() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    return true;
  } catch {
    return false;
  }
}

export async function getFiles() {
  try {
    const result = await chrome.storage.local.get(FILES_KEY);
    return result[FILES_KEY] || [];
  } catch {
    return [];
  }
}

export async function saveFiles(files) {
  try {
    await chrome.storage.local.set({ [FILES_KEY]: files });
    return true;
  } catch {
    return false;
  }
}

export async function addFile(file) {
  const files = await getFiles();
  files.unshift(file); // Add to beginning
  return saveFiles(files);
}

export async function updateFile(fileKey, updates) {
  const files = await getFiles();
  const idx = files.findIndex(f => f.key === fileKey);
  if (idx !== -1) {
    files[idx] = { ...files[idx], ...updates };
    return saveFiles(files);
  }
  return false;
}

export async function removeFile(fileKey) {
  const files = await getFiles();
  const filtered = files.filter(f => f.key !== fileKey);
  return saveFiles(filtered);
}

export async function clearExpiredFiles() {
  const files = await getFiles();
  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const expired = [];
  const remaining = files.filter(f => {
    if (f.isPermanent) return true;
    const age = now - f.uploadedAt;
    if (age > TWO_DAYS) {
      expired.push(f);
      return false;
    }
    return true;
  });

  if (expired.length > 0) {
    await saveFiles(remaining);
  }

  return expired; // Return expired files so caller can delete from UploadThing
}
