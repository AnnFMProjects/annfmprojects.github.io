// FM Home Loans internal tools — shared XLSX (.xlsx) OOXML build primitives.
// Hand-rolled via JSZip (no external spreadsheet-building library). Used by
// CCE (multi-sheet, custom number formats) and GT (single-sheet) — the
// workbook/styles/content-types assembly differs enough per tool to stay
// local; only the truly identical low-level pieces live here.
function xmlEsc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function colLetter(n){
  let s = '';
  while (n > 0){ const rem = (n-1) % 26; s = String.fromCharCode(65+rem) + s; n = Math.floor((n-1)/26); }
  return s;
}

// Superset of both tools' cell shapes (inlineStr/str/b/numeric) — GT only
// ever emits inlineStr and plain numeric cells, so this is a safe drop-in.
function cellXml(addr, cell){
  if (!cell) return '';
  const sAttr = cell.s ? ' s="'+cell.s+'"' : '';
  if (cell.t === 'inlineStr'){
    return '<c r="'+addr+'" t="inlineStr"'+sAttr+'><is><t xml:space="preserve">'+xmlEsc(String(cell.v))+'</t></is></c>';
  }
  if (cell.t === 'str'){
    const fXml = cell.f ? '<f>'+xmlEsc(cell.f)+'</f>' : '';
    return '<c r="'+addr+'" t="str"'+sAttr+'>'+fXml+'<v>'+xmlEsc(String(cell.v||''))+'</v></c>';
  }
  if (cell.t === 'b'){
    return '<c r="'+addr+'" t="b"'+sAttr+'><v>'+(cell.v?1:0)+'</v></c>';
  }
  // numeric (plain value or formula)
  const fXml = cell.f ? '<f>'+xmlEsc(cell.f)+'</f>' : '';
  const vVal = (typeof cell.v === 'number' && !isNaN(cell.v)) ? cell.v : 0;
  return '<c r="'+addr+'"'+sAttr+'>'+fXml+'<v>'+vVal+'</v></c>';
}

// colWidths is optional — omit it entirely (as GT does) to skip the <cols>
// block rather than emitting an empty one.
function sheetXml(cells, colWidths){
  const byRow = {};
  Object.keys(cells).forEach(addr => {
    const m = addr.match(/^([A-Z]+)(\d+)$/);
    const rn = parseInt(m[2], 10);
    (byRow[rn] = byRow[rn] || []).push(addr);
  });
  const rowNums = Object.keys(byRow).map(Number).sort((a,b)=>a-b);
  const colsXml = (colWidths && colWidths.length)
    ? '<cols>' + colWidths.map((w,i) => '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('') + '</cols>'
    : '';
  const rowsXml = rowNums.map(rn => {
    const addrs = byRow[rn].sort((a,b) => {
      const ca = a.match(/^([A-Z]+)/)[1], cb = b.match(/^([A-Z]+)/)[1];
      return ca.localeCompare(cb);
    });
    return '<row r="'+rn+'">' + addrs.map(a => cellXml(a, cells[a])).join('') + '</row>';
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    colsXml + '<sheetData>' + rowsXml + '</sheetData></worksheet>';
}
