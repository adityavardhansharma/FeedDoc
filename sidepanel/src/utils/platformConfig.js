export const platforms = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    domains: ['chatgpt.com'],
    primaryColor: '#10A37F',
    textColor: '#FFFFFF',
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
    buttonLabel: 'Feed to ChatGPT',
  },
  {
    id: 'claude',
    name: 'Claude',
    domains: ['claude.ai'],
    primaryColor: '#D97757',
    textColor: '#FFFFFF',
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.304 3.541h-3.672l6.696 16.918H24zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.369 3.553h3.744L10.536 3.541zm-.371 10.223L8.616 7.82l2.291 5.945z"/></svg>`,
    buttonLabel: 'Feed to Claude',
  },
  {
    id: 'grok',
    name: 'Grok',
    domains: ['grok.com', 'x.ai'],
    primaryColor: '#1D9BF0',
    textColor: '#FFFFFF',
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    buttonLabel: 'Feed to Grok',
  },
  {
    id: 't3chat',
    name: 'T3 Chat',
    domains: ['t3.chat'],
    primaryColor: '#a3004c',
    textColor: '#FFFFFF',
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 53" fill="currentColor"><path d="M35.8 10.7H24v40.9h-8.6V10.8H0V3.4h43z"/><path d="M44.4 10.6l7.1-7.2h21.9v6.4L62.6 21c3.8.5 6.9 1.9 9.1 4.2l.2.2c2.5 2.6 3.7 6.1 3.9 10.5 0 4.7-1.5 8.5-4.4 11.3s-6.9 4.2-11.9 4.2c-4.6 0-8.4-1.3-11.3-3.7-3-2.4-4.6-5.9-4.8-10.5v-.5h8.1v.5c.2 2.1.9 3.8 2.3 5.2 1.3 1.3 3.2 2 5.7 2s4.5-.7 5.9-2.2 2.1-3.6 2.1-6.2c0-2.7-.7-4.7-2.1-6.1-1.5-1.5-3.4-2.2-5.9-2.2h-7v-5.9l10.6-11.2z"/><path d="M84.3 44.2h6.9v6.9h-6.9z"/></svg>`,
    buttonLabel: 'Feed to T3 Chat',
  },
];

export function detectPlatform(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return platforms.find((p) => p.domains.some((d) => hostname === d || hostname.endsWith('.' + d))) || null;
  } catch {
    return null;
  }
}

export const MIME_TYPES = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function getFileExtension(name) {
  return (name || '').split('.').pop().toLowerCase();
}

export function getFileType(name) {
  const ext = getFileExtension(name);
  if (ext === 'pdf') return { ext: 'pdf', label: 'PDF', color: '#EF4444', mime: MIME_TYPES.pdf };
  if (ext === 'pptx') return { ext: 'pptx', label: 'PowerPoint', color: '#F97316', mime: MIME_TYPES.pptx };
  if (ext === 'docx') return { ext: 'docx', label: 'Word', color: '#3B82F6', mime: MIME_TYPES.docx };
  return null;
}

export const MAX_FILE_SIZE = 512 * 1024 * 1024;
export const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;
export const IPC_SIZE_LIMIT = 50 * 1024 * 1024;
