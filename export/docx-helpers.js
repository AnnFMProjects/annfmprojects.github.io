// FM Home Loans internal tools — shared DOCX (.docx) OOXML build helpers.
// Hand-rolled via JSZip (no external docx-building library), fully editable
// in Word. Used by CCE and PAG, which each build genuinely different
// documents from this same set of primitives.
function xmlEsc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function docxPara(text, opts){
  opts = opts || {};
  const rPr = (opts.bold ? '<w:b/>' : '') + (opts.italic ? '<w:i/>' : '') + (opts.size ? '<w:sz w:val="' + (opts.size*2) + '"/>' : '') + (opts.color ? '<w:color w:val="' + opts.color + '"/>' : '');
  const pPr = opts.spaceAfter !== undefined ? '<w:pPr><w:spacing w:after="' + opts.spaceAfter + '"/></w:pPr>' : '';
  return '<w:p>' + pPr + '<w:r>' + (rPr ? '<w:rPr>' + rPr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + xmlEsc(text) + '</w:t></w:r></w:p>';
}
function docxCell(text, opts){
  opts = opts || {};
  const width = opts.width || 4500;
  return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:tcBorders>' +
    '<w:top w:val="single" w:sz="4" w:color="D9DCE3"/><w:bottom w:val="single" w:sz="4" w:color="D9DCE3"/>' +
    '<w:left w:val="single" w:sz="4" w:color="D9DCE3"/><w:right w:val="single" w:sz="4" w:color="D9DCE3"/></w:tcBorders></w:tcPr>' +
    docxPara(text, opts) + '</w:tc>';
}
function docxTable(rowsData){
  const trs = rowsData.map(row =>
    '<w:tr>' + docxCell(row[0], {}) + docxCell(row[1], { bold:true }) + '</w:tr>'
  ).join('');
  return '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>' +
    '<w:top w:val="single" w:sz="4" w:color="D9DCE3"/><w:bottom w:val="single" w:sz="4" w:color="D9DCE3"/>' +
    '<w:left w:val="single" w:sz="4" w:color="D9DCE3"/><w:right w:val="single" w:sz="4" w:color="D9DCE3"/>' +
    '<w:insideH w:val="single" w:sz="4" w:color="D9DCE3"/><w:insideV w:val="single" w:sz="4" w:color="D9DCE3"/></w:tblBorders></w:tblPr>' +
    '<w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>' + trs + '</w:tbl>';
}

// The [Content_Types].xml and _rels/.rels parts of a minimal single-document
// .docx package never vary by content — same constant string for every tool.
const DOCX_CONTENT_TYPES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '</Types>';

const DOCX_RELS_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';

// word/document.xml wrapper — body content and page margin (in twips, same
// value on all 4 sides) are the only things that differ between tools.
function docxDocumentXml(bodyXml, marginTwips){
  marginTwips = marginTwips || 1000;
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + bodyXml + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="' + marginTwips + '" w:right="' + marginTwips + '" w:bottom="' + marginTwips + '" w:left="' + marginTwips + '"/></w:sectPr></w:body></w:document>';
}
