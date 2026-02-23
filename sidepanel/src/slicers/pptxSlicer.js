import JSZip from 'jszip';

export async function slicePptx(arrayBuffer, fromSlide, toSlide) {
  const zip = await JSZip.loadAsync(arrayBuffer);

  const presXml = await zip.file('ppt/presentation.xml').async('text');
  const parser = new DOMParser();
  const presDoc = parser.parseFromString(presXml, 'application/xml');
  const nsResolver = (prefix) => {
    const ns = {
      a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
      r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
    };
    return ns[prefix] || null;
  };

  const sldIdNodes = presDoc.querySelectorAll('sldIdLst > sldId') ||
    Array.from(presDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main', 'sldId'));

  const presRelsXml = await zip.file('ppt/_rels/presentation.xml.rels').async('text');
  const presRelsDoc = parser.parseFromString(presRelsXml, 'application/xml');
  const rels = Array.from(presRelsDoc.querySelectorAll('Relationship'));

  const slideOrder = [];
  const sldIds = Array.from(sldIdNodes);

  for (const node of sldIds) {
    const rId = node.getAttribute('r:id') || node.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rel = rels.find((r) => r.getAttribute('Id') === rId);
    if (rel) {
      const target = rel.getAttribute('Target');
      slideOrder.push({ rId, target, node });
    }
  }

  const toRemove = [];
  for (let i = 0; i < slideOrder.length; i++) {
    const slideNum = i + 1;
    if (slideNum < fromSlide || slideNum > toSlide) {
      toRemove.push(slideOrder[i]);
    }
  }

  for (const item of toRemove) {
    const slideFile = 'ppt/' + item.target;
    const relsFile = slideFile.replace('/slides/', '/slides/_rels/') + '.rels';
    zip.remove(slideFile);
    zip.remove(relsFile);

    if (item.node.parentNode) {
      item.node.parentNode.removeChild(item.node);
    }

    const relNode = rels.find((r) => r.getAttribute('Id') === item.rId);
    if (relNode && relNode.parentNode) {
      relNode.parentNode.removeChild(relNode);
    }
  }

  const contentTypesXml = await zip.file('[Content_Types].xml').async('text');
  const ctDoc = parser.parseFromString(contentTypesXml, 'application/xml');
  const overrides = Array.from(ctDoc.querySelectorAll('Override'));
  for (const item of toRemove) {
    const partName = '/ppt/' + item.target;
    const ov = overrides.find((o) => o.getAttribute('PartName') === partName);
    if (ov && ov.parentNode) {
      ov.parentNode.removeChild(ov);
    }
  }

  const keptSlides = slideOrder.filter(
    (_, i) => i + 1 >= fromSlide && i + 1 <= toSlide
  );

  for (let newIdx = 0; newIdx < keptSlides.length; newIdx++) {
    const item = keptSlides[newIdx];
    const oldTarget = item.target;
    const newTarget = `slides/slide${newIdx + 1}.xml`;

    if (oldTarget !== newTarget) {
      const oldPath = 'ppt/' + oldTarget;
      const newPath = 'ppt/' + newTarget;
      const oldRels = oldPath.replace('/slides/', '/slides/_rels/') + '.rels';
      const newRels = newPath.replace('/slides/', '/slides/_rels/') + '.rels';

      const content = await zip.file(oldPath)?.async('uint8array');
      const relsContent = await zip.file(oldRels)?.async('uint8array');

      if (content) {
        zip.remove(oldPath);
        zip.file(newPath, content);
      }
      if (relsContent) {
        zip.remove(oldRels);
        zip.file(newRels, relsContent);
      }

      const relNode = Array.from(presRelsDoc.querySelectorAll('Relationship')).find(
        (r) => r.getAttribute('Id') === item.rId
      );
      if (relNode) relNode.setAttribute('Target', newTarget);

      const ctOverrides = Array.from(ctDoc.querySelectorAll('Override'));
      const ctNode = ctOverrides.find(
        (o) => o.getAttribute('PartName') === '/ppt/' + oldTarget
      );
      if (ctNode) ctNode.setAttribute('PartName', '/ppt/' + newTarget);
    }
  }

  const serializer = new XMLSerializer();
  zip.file('ppt/presentation.xml', serializer.serializeToString(presDoc));
  zip.file('ppt/_rels/presentation.xml.rels', serializer.serializeToString(presRelsDoc));
  zip.file('[Content_Types].xml', serializer.serializeToString(ctDoc));

  const result = await zip.generateAsync({ type: 'uint8array' });
  return result;
}
