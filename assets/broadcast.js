// FM Home Loans internal tools — shared "please refresh" broadcast poller.
// Independent from CCE's own per-deploy version-check banner (0.17, still
// CCE-only, tied to a specific code version bump) — this is a SEPARATE,
// on-demand admin trigger ("everyone refresh now, for whatever reason"),
// shared across every tool via this one file, not tied to any code version.
// Used by all 5 pages (hub, CCE, PAG, Social, GT).
const FM_BROADCAST_POLL_INTERVAL_MS = 2 * 60 * 1000;

function injectFmBroadcastBanner_(){
  if (document.getElementById('fmBroadcastBanner')) return;
  const style = document.createElement('style');
  style.textContent =
    '#fmBroadcastBanner{ display:none; position:sticky; top:0; z-index:1900; background:var(--navy-deep,#101B33); color:#fff; font-family:Calibri, Arial, sans-serif; font-size:13px; padding:9px 16px; text-align:center; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; }' +
    '#fmBroadcastBanner button{ background:var(--gold,#C9A24B); color:var(--navy-deep,#101B33); border:none; border-radius:5px; padding:5px 14px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:Calibri, Arial, sans-serif; }';
  document.head.appendChild(style);
  const banner = document.createElement('div');
  banner.id = 'fmBroadcastBanner';
  banner.innerHTML = '<span>Please refresh this page — an update is ready.</span><button onclick="location.reload()">Refresh Now</button>';
  document.body.insertBefore(banner, document.body.firstChild);
}

// Baseline is whatever broadcastAt was already live when this tab loaded —
// only a LATER broadcast (fired by an admin after this tab was already
// open) should show the banner, not one that happened before this page
// ever loaded.
let _fmBroadcastBaseline_ = undefined;
async function fmBroadcastPollOnce_(apiCore){
  try {
    const at = await apiCore.getBroadcastState();
    if (_fmBroadcastBaseline_ === undefined){
      _fmBroadcastBaseline_ = at;
      return;
    }
    if (at && at !== _fmBroadcastBaseline_){
      const banner = document.getElementById('fmBroadcastBanner');
      if (banner) banner.style.display = 'flex';
    }
  } catch (err) {
    // network hiccup or backend not deployed yet — fail silently, never
    // interrupt someone's work over a broadcast check
  }
}

function initFmBroadcastPoll(apiCore){
  injectFmBroadcastBanner_();
  setTimeout(() => fmBroadcastPollOnce_(apiCore), 15 * 1000);
  setInterval(() => fmBroadcastPollOnce_(apiCore), FM_BROADCAST_POLL_INTERVAL_MS);
}
