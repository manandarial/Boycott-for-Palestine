(async function() {
  try {
    let rawList = (window.__ETHICS_BOYCOTT_LIST__ && Array.isArray(window.__ETHICS_BOYCOTT_LIST__))
      ? window.__ETHICS_BOYCOTT_LIST__
      : null;

    // If the injected variable isn't present yet (race at document_start), try fetching the JSON as a fallback.
    if (!rawList) {
      try {
        const resp = await fetch(chrome.runtime.getURL('boycott_list.json'));
        rawList = await resp.json();
      } catch (e) {
        console.warn('EthicsChecker: fallback fetch failed', e);
        rawList = [];
      }
    }
    const host = window.location.hostname.toLowerCase();

    // Normalize entries to objects with fields: domain, company, industry, reason, alternatives
    const list = rawList.map(item => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { domain: item.toLowerCase(), company: '', industry: '', reason: '', alternatives: '' };
      }
      const domain = (item.website || item.domain || item.site || item.url || '').toString();
      const normDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '');
      return {
        domain: normDomain,
        company: item.company || item.name || '',
        industry: item.industry || '',
        reason: item.reason || item.description || '',
        alternatives: item.alternatives || item.alternative || ''
      };
    }).filter(Boolean);

    const matchedEntry = list.find(entry => {
      const d = entry.domain;
      return d && (host === d || host.endsWith('.' + d));
    });

    if (matchedEntry) showAlert(matchedEntry);
  } catch (e) {
    console.error('EthicsChecker error loading list', e);
  }
  function showAlert(entry) {
    if (document.getElementById('ethicschecker-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ethicschecker-overlay';
    overlay.className = 'ethicschecker-overlay';

    const box = document.createElement('div');
    box.className = 'ethicschecker-box';

    const close = document.createElement('button');
    close.className = 'ethicschecker-close';
    close.setAttribute('aria-label', 'Close overlay (Esc)');
    close.setAttribute('title', 'Close overlay (Esc)');
    close.textContent = '×';

    // Keyboard handler to close overlay with Escape
    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (document.getElementById('ethicschecker-overlay')) {
          overlay.remove();
          document.removeEventListener('keydown', handleKey);
        }
      }
    };

    close.addEventListener('click', () => {
      overlay.remove();
      document.removeEventListener('keydown', handleKey);
    });

    const title = document.createElement('h2');
    title.textContent = entry.company || 'Site on Boycott List';

    const meta = document.createElement('div');
    meta.className = 'ethicschecker-meta';
    if (entry.domain) {
      const site = document.createElement('div');
      site.className = 'ethicschecker-site';
      site.textContent = entry.domain;
      meta.appendChild(site);
    }
    if (entry.industry) {
      const ind = document.createElement('div');
      ind.className = 'ethicschecker-industry';
      ind.textContent = entry.industry;
      meta.appendChild(ind);
    }

    const intro = document.createElement('p');
    intro.textContent = 'This site is on your configured boycott list.';

    box.appendChild(close);
    box.appendChild(title);
    box.appendChild(meta);
    box.appendChild(intro);

    if (entry.reason && String(entry.reason).trim().length) {
      const header = document.createElement('h3');
      header.className = 'ethicschecker-subhead';
      header.textContent = 'Reason';
      const desc = document.createElement('p');
      desc.className = 'ethicschecker-desc';
      desc.textContent = entry.reason;
      box.appendChild(header);
      box.appendChild(desc);
    }

    if (entry.alternatives && String(entry.alternatives).trim().length) {
      const header2 = document.createElement('h3');
      header2.className = 'ethicschecker-subhead';
      header2.textContent = 'Alternatives';
      const alt = document.createElement('p');
      alt.className = 'ethicschecker-alts';
      alt.textContent = entry.alternatives;
      box.appendChild(header2);
      box.appendChild(alt);
    }

    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);

    // Focus the close button and listen for Escape
    try {
      close.focus({ preventScroll: true });
    } catch (e) { /* ignore focus errors */ }
    document.addEventListener('keydown', handleKey);
  }
})();
