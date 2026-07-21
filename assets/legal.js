// Shared Terms of Service / Privacy Policy modal content loader, used by
// every FM Home Loans internal tool. Fetches the single shared .md source
// (kept in /legal/, one copy for the whole suite) and renders a minimal
// markdown subset (headings, bold, links, paragraphs, lists) into whichever
// modal body element the calling tool points it at. This file has no
// opinion about modal markup/CSS/animation — each tool already has its own
// modal-overlay class (cce-modal-overlay, gt-modal-overlay, etc.); the
// calling tool just supplies the element ids to fill.
window.FM_LEGAL = (function(){
  const cache = {};

  function escapeHtml_(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function inline_(s){
    s = escapeHtml_(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  // Markdown h1/h2 map down to h3/h4 so headings don't look oversized
  // inside a modal that already has its own title bar.
  function renderMarkdown_(md){
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let inList = false;
    function closeList(){ if (inList){ html += '</ul>'; inList = false; } }
    lines.forEach(line => {
      const l = line.trim();
      if (!l){ closeList(); return; }
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))){
        closeList();
        const level = Math.min(m[1].length + 2, 6);
        html += '<h' + level + '>' + inline_(m[2]) + '</h' + level + '>';
      } else if ((m = l.match(/^[-*]\s+(.*)$/))){
        if (!inList){ html += '<ul>'; inList = true; }
        html += '<li>' + inline_(m[1]) + '</li>';
      } else if (l === '---'){
        closeList();
      } else {
        closeList();
        html += '<p>' + inline_(l) + '</p>';
      }
    });
    closeList();
    return html;
  }

  return {
    // url: path to the .md file relative to the calling page
    // overlayId/bodyId: element ids on the calling page's own modal markup
    // openClass: the class the tool's CSS uses to show the overlay (default 'open')
    show: function(url, overlayId, bodyId, openClass){
      openClass = openClass || 'open';
      const overlay = document.getElementById(overlayId);
      const body = document.getElementById(bodyId);
      if (!overlay || !body) return;
      overlay.classList.add(openClass);
      if (cache[url]){
        body.innerHTML = cache[url];
        return;
      }
      body.innerHTML = '<p style="color:var(--slate,#5b6472);">Loading…</p>';
      fetch(url).then(function(r){
        if (!r.ok) throw new Error('not found');
        return r.text();
      }).then(function(md){
        const html = renderMarkdown_(md);
        cache[url] = html;
        body.innerHTML = html;
      }).catch(function(){
        body.innerHTML = '<p style="color:#B3261E;">Could not load this document right now. Please try again, or contact Ann.</p>';
      });
    }
  };
})();
