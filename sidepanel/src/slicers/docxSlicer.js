import JSZip from 'jszip';

export async function sliceDocx(arrayBuffer, fromPage, toPage) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = await zip.file('word/document.xml').async('text');
  const parser = new DOMParser();
  const doc = parser.parseFromString(docXml, 'application/xml');
  const nsW = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const body = doc.getElementsByTagNameNS(nsW, 'body')[0];
  if (!body) throw new Error('Invalid DOCX: no document body found');

  const paragraphs = Array.from(body.children);
  const pages = [[]];
  let currentPage = 0;

  for (const node of paragraphs) {
    const pPr = node.getElementsByTagNameNS(nsW, 'pPr')[0];
    let isPageBreakBefore = false;

    if (pPr) {
      const pbBefore = pPr.getElementsByTagNameNS(nsW, 'pageBreakBefore')[0];
      if (pbBefore) {
        const val = pbBefore.getAttribute('w:val');
        if (val !== 'false' && val !== '0') isPageBreakBefore = true;
      }
    }

    if (isPageBreakBefore && pages[currentPage].length > 0) {
      currentPage++;
      pages[currentPage] = [];
    }

    pages[currentPage] = pages[currentPage] || [];
    pages[currentPage].push(node);

    const brs = node.getElementsByTagNameNS(nsW, 'br');
    for (const br of Array.from(brs)) {
      if (br.getAttribute('w:type') === 'page') {
        currentPage++;
        pages[currentPage] = [];
      }
    }

    const lastRendered = node.getElementsByTagNameNS(nsW, 'lastRenderedPageBreak');
    if (lastRendered.length > 0) {
      currentPage++;
      pages[currentPage] = [];
    }
  }

  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }

  const from0 = fromPage - 1;
  const to0 = toPage - 1;
  for (let i = from0; i <= to0 && i < pages.length; i++) {
    if (!pages[i]) continue;
    for (const node of pages[i]) {
      body.appendChild(node);
    }
  }

  const sectPr = doc.getElementsByTagNameNS(nsW, 'sectPr');
  if (sectPr.length > 0 && !body.contains(sectPr[0])) {
    body.appendChild(sectPr[0]);
  }

  const serializer = new XMLSerializer();
  zip.file('word/document.xml', serializer.serializeToString(doc));
  const result = await zip.generateAsync({ type: 'uint8array' });
  return result;
}
