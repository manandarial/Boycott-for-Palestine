(async function() {
  async function loadList() {
    try {
      const resp = await fetch(chrome.runtime.getURL('boycott_list.json'));
      const raw = await resp.json();
      // Normalize to domain strings
      return raw.map(item => (typeof item === 'string' ? item : (item && item.domain) || '')).filter(Boolean);
    } catch (e) {
      console.error('EthicsChecker background: failed to load list', e);
      return [];
    }
  }

  async function getDynamicRules() {
    return new Promise(resolve => {
      try {
        chrome.declarativeNetRequest.getDynamicRules(resolve);
      } catch (e) { resolve([]); }
    });
  }

  async function updateRules() {
    try {
      const domains = await loadList();
      const existing = await getDynamicRules();
      const removeIds = existing.map(r => r.id);

      const addRules = domains.map((domain, idx) => {
        const id = 1000 + idx;
        return {
          id: id,
          priority: 1,
          action: { type: 'block' },
          condition: {
            urlFilter: '||' + domain + '^',
            resourceTypes: ['main_frame']
          }
        };
      });

      chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules }, () => {
        console.log('EthicsChecker: updated dynamic rules, added=', addRules.length);
      });
    } catch (e) {
      console.error('EthicsChecker: error updating rules', e);
    }
  }

  chrome.runtime.onInstalled.addListener(() => updateRules());
  chrome.runtime.onStartup.addListener(() => updateRules());
  // Also run once when the service worker starts
  updateRules();

  // Optional: allow manual updates via messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg === 'update_rules') {
      updateRules().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
      return true; // keep channel open for async response
    }
  });
})();
