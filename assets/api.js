// FM Home Loans internal tools — shared API/session plumbing.
// Every tool (CCE, PAG, Social Media Tool, Greatness Tracker) points at the
// same Apps Script backend and the same localStorage session token, so this
// core is identical across all of them. Each tool wraps this with its own
// record-CRUD methods (saveClient/savePag/saveSocial/saveGt, etc.) — see the
// bottom of each tool's own <script> block.
const FM_API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzR3YEJAV08KsAnh7JbmC4Me-LaaR2Z9oK3_iX0t86qBpCgCkKGWyu5GxptKfOys_j6/exec';
const FM_TOKEN_STORAGE_KEY = 'cce_session_token';

function createFmApiCore(){
  function getToken(){ return localStorage.getItem(FM_TOKEN_STORAGE_KEY); }
  function setToken(token){
    if (token) localStorage.setItem(FM_TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(FM_TOKEN_STORAGE_KEY);
  }

  // POST + text/plain body is deliberate — a custom Content-Type (e.g.
  // application/json) triggers a CORS preflight that Google Apps Script web
  // apps don't handle cleanly. text/plain keeps every call a CORS "simple
  // request", so no OPTIONS round-trip ever happens.
  async function call(action, payload, opts){
    opts = opts || {};
    const body = { action: action, payload: payload || {}, token: opts.anonymous ? null : getToken() };
    let res;
    try {
      res = await fetch(FM_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error('Could not reach the server. Check your connection and try again.');
    }
    let data;
    try {
      data = await res.json();
    } catch (err) {
      throw new Error('Unexpected response from the server.');
    }
    if (!data.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  return {
    call: call,
    getToken: getToken,
    isLoggedIn: function(){ return !!getToken(); },
    logout: function(){ setToken(null); },

    ping: function(){ return call('ping', {}, { anonymous: true }); },

    login: async function(email, password){
      const data = await call('login', { email: email, password: password }, { anonymous: true });
      setToken(data.token);
      return data.account;
    },
    requestLogin: function(name, email, password){
      return call('requestLogin', { name: name, email: email, password: password }, { anonymous: true }).then(() => true);
    },
    whoAmI: async function(){
      const data = await call('whoAmI', {});
      return data.account;
    },

    getAccount: async function(){
      const data = await call('getAccount', {});
      return data.account;
    },
    updateProfile: async function(payload){
      const data = await call('updateProfile', payload);
      return data.account;
    },
    setPassword: async function(payload){
      const data = await call('setPassword', payload);
      return data.changed;
    },

    // Standalone admin-password check — deliberately anonymous (no session
    // token). Update Information is gated by the shared admin password, not
    // by being logged into a specific account, so this works in guest mode
    // too.
    adminVerify: async function(password){
      const data = await call('adminVerify', { password: password }, { anonymous: true });
      return data.verified;
    },
    sendDiscrepancyEmail: async function(subject, body){
      const data = await call('sendDiscrepancyEmail', { subject: subject, body: body }, { anonymous: true });
      return data.sent;
    },
  };
}
