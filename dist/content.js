(() => {
  const PLATFORM_SELECTORS = {
    'chatgpt.com': {
      fileInput: 'input[type="file"]',
      textarea: 'div[contenteditable="true"][data-lexical-editor="true"]',
    },
    'claude.ai': {
      fileInput: 'input[type="file"]',
      textarea: 'div[contenteditable="true"].ProseMirror',
    },
    'grok.com': {
      fileInput: 'input[type="file"][multiple]',
      textarea: 'textarea, div[contenteditable="true"]',
    },
    'x.ai': {
      fileInput: 'input[type="file"][multiple]',
      textarea: 'textarea, div[contenteditable="true"]',
    },
    't3.chat': {
      fileInput: 'input[type="file"]',
      textarea: 'div[contenteditable="true"], textarea',
    },
  };

  function getSelectors() {
    const host = window.location.hostname.replace('www.', '');
    return PLATFORM_SELECTORS[host] || {
      fileInput: 'input[type="file"]',
      textarea: 'div[contenteditable="true"], textarea',
    };
  }

  function createFile(data, fileName, mimeType) {
    const bytes = new Uint8Array(data);
    const blob = new Blob([bytes], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  function tryFileInput(file, selectors) {
    const input = document.querySelector(selectors.fileInput);
    if (!input) return false;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  function tryDrop(file, selectors) {
    const target = document.querySelector(selectors.textarea);
    if (!target) return false;
    const dt = new DataTransfer();
    dt.items.add(file);
    const opts = { bubbles: true, cancelable: true, dataTransfer: dt };
    target.dispatchEvent(new DragEvent('dragenter', opts));
    target.dispatchEvent(new DragEvent('dragover', opts));
    target.dispatchEvent(new DragEvent('drop', opts));
    return true;
  }

  async function handleAttach(message, sendResponse) {
    try {
      let fileData, fileName, mimeType;

      if (message.type === 'ATTACH_FROM_STORAGE') {
        const stored = await chrome.storage.session.get('pendingFile');
        if (!stored.pendingFile) {
          sendResponse({ success: false, error: 'No pending file in storage' });
          return;
        }
        const raw = atob(stored.pendingFile.base64);
        fileData = Array.from(raw, c => c.charCodeAt(0));
        fileName = stored.pendingFile.fileName;
        mimeType = stored.pendingFile.mimeType;
        await chrome.storage.session.remove('pendingFile');
      } else {
        fileData = message.fileData;
        fileName = message.fileName;
        mimeType = message.mimeType;
      }

      const file = createFile(fileData, fileName, mimeType);
      const selectors = getSelectors();

      if (tryFileInput(file, selectors)) {
        sendResponse({ success: true, method: 'fileInput' });
        return;
      }
      if (tryDrop(file, selectors)) {
        sendResponse({ success: true, method: 'drop' });
        return;
      }

      sendResponse({ success: false, error: 'No compatible input found on page' });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ATTACH_FILE' || message.type === 'ATTACH_FROM_STORAGE') {
      handleAttach(message, sendResponse);
      return true;
    }
  });
})();
