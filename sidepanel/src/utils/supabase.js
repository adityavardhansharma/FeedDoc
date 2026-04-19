// Supabase Storage wrapper for BYOAK (Bring Your Own API Key)
// Direct client-side uploads without server

// Test connection to Supabase bucket
export async function testConnection(url, anonKey, bucket) {
  if (!url || !anonKey || !bucket) return false;

  try {
    const res = await fetch(`${url}/storage/v1/bucket/${bucket}`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Generate unique file key
function generateKey(fileName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName.split('.').pop();
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  return `${base}_${timestamp}_${random}.${ext}`;
}

// Upload a file to Supabase Storage
export async function uploadFile(url, anonKey, bucket, fileData, fileName, mimeType) {
  const fileKey = generateKey(fileName);

  try {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${fileKey}`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: new Blob([fileData], { type: mimeType }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    // Construct public URL
    const fileUrl = `${url}/storage/v1/object/public/${bucket}/${fileKey}`;

    return {
      key: fileKey,
      url: fileUrl,
      name: fileName,
      size: fileData.byteLength,
    };
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  }
}

// Delete a file from Supabase Storage
export async function deleteFile(url, anonKey, bucket, fileKey) {
  try {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${fileKey}`, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Delete multiple files
export async function deleteFiles(url, anonKey, bucket, fileKeys) {
  if (fileKeys.length === 0) return true;

  try {
    for (const fileKey of fileKeys) {
      await deleteFile(url, anonKey, bucket, fileKey);
    }
    return true;
  } catch {
    return false;
  }
}

// Fetch file from URL (for feeding saved files to AI)
export async function fetchFile(fileUrl) {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error('Fetch failed');
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
}
