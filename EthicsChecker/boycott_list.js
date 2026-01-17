// Load the boycott list JSON and expose it as `window.__ETHICS_BOYCOTT_LIST__`.
// Format: [{ "domain": "example.com", "description": "..." }, ...]
(async function() {
  try {
    const resp = await fetch(chrome.runtime.getURL('boycott_list.json'));
    const data = await resp.json();
    window.__ETHICS_BOYCOTT_LIST__ = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('EthicsChecker: failed to load boycott_list.json', e);
    window.__ETHICS_BOYCOTT_LIST__ = [];
  }
})();
