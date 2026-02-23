import { PDFDocument } from 'pdf-lib';

export async function slicePdf(arrayBuffer, fromPage, toPage) {
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  const indices = [];
  for (let i = fromPage - 1; i <= toPage - 1; i++) {
    indices.push(i);
  }
  const pages = await newDoc.copyPages(srcDoc, indices);
  pages.forEach((p) => newDoc.addPage(p));
  const bytes = await newDoc.save();
  return new Uint8Array(bytes);
}
