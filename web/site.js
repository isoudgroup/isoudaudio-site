(() => {
  'use strict';

  const init = () => {
    const root = document.documentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 1100px)');
    const watch = (query, listener) => {
      if (query.addEventListener) query.addEventListener('change', listener);
      else if (query.addListener) query.addListener(listener);
    };
    const locks = new Set();
    let originalOverflow = document.body.style.overflow;
    const lockScroll = (key, locked) => {
      if (locked && !locks.size) originalOverflow = document.body.style.overflow;
      if (locked) locks.add(key);
      else locks.delete(key);
      document.body.style.overflow = locks.size ? 'hidden' : originalOverflow;
    };

    const menu = document.querySelector('.menu-button');
    const nav = document.querySelector('.main-nav');
    const languages = [...document.querySelectorAll('details.lang')];
    let closeMenu = () => {};
    if (menu && nav) {
      nav.id ||= 'main-navigation';
      menu.setAttribute('aria-controls', nav.id);
      menu.setAttribute('aria-expanded', 'false');
      if (menu.tagName === 'BUTTON') menu.type = 'button';
      const menuBackground = [...document.querySelectorAll('main, footer')].map(element => ({element,inert:element.inert}));
      const updateMenu = (open, restoreFocus = false) => {
        open = Boolean(open && mobile.matches);
        nav.classList.toggle('nav-open', open);
        nav.inert = mobile.matches && !open;
        menuBackground.forEach(({element,inert}) => { element.inert = open || inert; });
        menu.setAttribute('aria-expanded', String(open));
        lockScroll('menu', open);
        if (open) languages.forEach((language) => { language.open = false; });
        if (restoreFocus) menu.focus();
      };
      closeMenu = (restoreFocus = false) => updateMenu(false, restoreFocus);
      menu.addEventListener('click', () => updateMenu(!nav.classList.contains('nav-open')));
      nav.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeMenu();
      });
      document.addEventListener('click', (event) => {
        if (nav.classList.contains('nav-open') && !nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
      });
      watch(mobile, () => closeMenu());
      updateMenu(false);
    }

    languages.forEach((language, index) => {
      const summary = language.querySelector('summary');
      const list = language.querySelector('.lang-list');
      if (summary && list) {
        list.id ||= `language-options-${index + 1}`;
        summary.setAttribute('aria-controls', list.id);
        summary.setAttribute('aria-expanded', String(language.open));
      }
      language.addEventListener('toggle', () => {
        summary?.setAttribute('aria-expanded', String(language.open));
        if (language.open) languages.forEach((other) => { if (other !== language) other.open = false; });
      });
    });
    document.addEventListener('click', (event) => {
      languages.forEach((language) => { if (!language.contains(event.target)) language.open = false; });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      const language = languages.find((item) => item.open);
      if (language) {
        language.open = false;
        language.querySelector('summary')?.focus();
        event.preventDefault();
      } else if (nav?.classList.contains('nav-open')) {
        closeMenu(true);
        event.preventDefault();
      }
    });

    const reveals = [...document.querySelectorAll('[data-reveal]')];
    let revealObserver;
    const showAll = () => {
      revealObserver?.disconnect();
      root.classList.remove('motion-ready');
      reveals.forEach((item) => item.classList.add('visible'));
    };
    if (!motion.matches && 'IntersectionObserver' in window && reveals.length) {
      try {
        revealObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          });
        }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
        root.classList.add('motion-ready');
        reveals.forEach((item) => revealObserver.observe(item));
      } catch {
        showAll();
      }
    } else showAll();

    const layers = [...document.querySelectorAll('[data-parallax]')].map((element) => ({
      element,
      speed: Math.max(-0.3, Math.min(0.3, Number.parseFloat(element.dataset.parallax) || 0.08)),
      y: 0,
      originalTranslate: element.style.translate
    }));
    let frame = 0;
    const renderParallax = () => {
      frame = 0;
      if (motion.matches || document.hidden) return;
      const height = window.innerHeight;
      layers.forEach((layer) => {
        const rect = layer.element.getBoundingClientRect();
        const top = rect.top - layer.y;
        if (top > height + 100 || top + rect.height < -100) return;
        layer.y = Math.max(-60, Math.min(60, (height / 2 - top - rect.height / 2) * layer.speed));
        // Individual translate preserves the existing RTL mirror and CSS rotation.
        layer.element.style.translate = `0 ${layer.y.toFixed(2)}px`;
      });
    };
    const queueParallax = () => {
      if (!frame && layers.length && !motion.matches && !document.hidden) frame = window.requestAnimationFrame(renderParallax);
    };
    window.addEventListener('scroll', queueParallax, { passive: true });
    window.addEventListener('resize', queueParallax, { passive: true });
    document.addEventListener('visibilitychange', queueParallax);
    watch(motion, () => {
      if (motion.matches) {
        showAll();
        window.cancelAnimationFrame(frame);
        frame = 0;
        layers.forEach((layer) => { layer.element.style.translate = layer.originalTranslate; layer.y = 0; });
      } else queueParallax();
    });
    queueParallax();

    const filterGroups = [...document.querySelectorAll('.filters')];
    filterGroups.forEach((group) => {
      const buttons = [...group.querySelectorAll('[data-filter]')];
      const controlled = group.getAttribute('aria-controls');
      const scope = (controlled && document.getElementById(controlled)) || group.closest('section') || group.parentElement;
      const cards = [...scope.querySelectorAll('[data-category]')];
      const empty = scope.querySelector('[data-filter-empty], #product-empty, #no-platforms');
      const filter = (button) => {
        const value = button.dataset.filter;
        let count = 0;
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        cards.forEach((card) => {
          const categories = (card.dataset.category || '').split(/[\s,]+/);
          const visible = !value || value === 'all' || value === '*' || categories.includes(value);
          card.hidden = !visible;
          if (visible) count += 1;
        });
        if (empty) empty.hidden = count > 0;
        queueParallax();
      };
      buttons.forEach((button) => {
        if (button.tagName === 'BUTTON') button.type = 'button';
        button.addEventListener('click', () => filter(button));
      });
      const active = buttons.find((button) => button.getAttribute('aria-pressed') === 'true') || buttons[0];
      if (active) filter(active);
    });

    const dialog = document.getElementById('factory-film');
    if (dialog) {
      const video = dialog.querySelector('video');
      let opener;
      const closed = () => {
        video?.pause();
        lockScroll('film', false);
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      };
      const close = () => {
        if (typeof dialog.close === 'function') dialog.close();
        else { dialog.removeAttribute('open'); closed(); }
      };
      document.querySelectorAll('[data-film]').forEach((trigger) => {
        if (trigger.tagName === 'BUTTON') trigger.type = 'button';
        trigger.setAttribute('aria-controls', dialog.id);
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          if (dialog.hasAttribute('open')) return;
          opener = trigger;
          closeMenu();
          languages.forEach((language) => { language.open = false; });
          if (typeof dialog.showModal === 'function') dialog.showModal();
          else { dialog.setAttribute('open', ''); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); }
          lockScroll('film', true);
          dialog.querySelector('[data-close]')?.focus();
          if (!video) return;
          video.controls = true;
          video.playsInline = true;
          let changed = false;
          [video, ...video.querySelectorAll('source')].forEach((media) => {
            if (media.dataset.src && !media.getAttribute('src')) { media.setAttribute('src', media.dataset.src); changed = true; }
          });
          if (changed) video.load();
          const playing = video.play();
          playing?.catch(() => { /* The visible native controls remain available. */ });
        });
      });
      dialog.querySelectorAll('[data-close]').forEach((button) => {
        if (button.tagName === 'BUTTON') button.type = 'button';
        button.addEventListener('click', close);
      });
      dialog.addEventListener('close', closed);
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      });
      dialog.addEventListener('keydown', (event) => {
        if (typeof dialog.showModal === 'function') return;
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key !== 'Tab') return;
        const focusable = [...dialog.querySelectorAll('button, a[href], video[controls], [tabindex="0"]')].filter((element) => !element.disabled);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      });
    }

    // First-party session attribution only: paths, referring host and allowlisted
    // campaign tags. Never persist form entries, full URLs or personal details.
    const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const params = new URLSearchParams(window.location.search);
    const currentEntry = { sourcePath: window.location.pathname.slice(0, 240), createdAt: Date.now() };
    try { currentEntry.referrerHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
    campaignKeys.forEach(key => {
      const value = params.get(key);
      if (value && /^[a-zA-Z0-9 _./-]{1,100}$/.test(value)) currentEntry[key] = value;
    });
    let attribution = currentEntry;
    try {
      const stored = JSON.parse(sessionStorage.getItem('isoud-entry') || 'null');
      if (stored && typeof stored.sourcePath === 'string' && stored.sourcePath.startsWith('/') &&
          stored.sourcePath.length <= 240 && stored.createdAt <= Date.now() && Date.now() - stored.createdAt < 86400000) {
        attribution = stored;
        // An explicit new campaign starts a new source record.
        if (campaignKeys.some(key => currentEntry[key])) attribution = currentEntry;
      }
      sessionStorage.setItem('isoud-entry', JSON.stringify(attribution));
    } catch { /* In restricted browsing, use this page without persistent storage. */ }

    const form = document.getElementById('project-form');
    if (!form) return;
    const language = (root.lang || 'en').toLowerCase().split('-')[0];
    const defaults = {
      fallback: 'Direct web delivery is not connected in this preview. Open your email application with the completed brief, or contact us through Alibaba. No inquiry has been sent.',
      success: 'The mail service accepted your inquiry. This is not confirmation of inbox receipt.',
      error: 'Your inquiry could not be sent. Your entries have been preserved. You can open an email instead.',
      sending: 'Sending…',
      fields: ['Name', 'Email', 'Company', 'Country / market', 'Product / platform', 'Quantity', 'Project brief']
    };
    let translations = {};
    try {
      const parsed = JSON.parse(document.getElementById('form-messages')?.textContent || '{}');
      if (parsed && typeof parsed === 'object') translations = parsed[language] || parsed;
    } catch { /* Native labels and the safe English messages remain usable. */ }
    const messages = { ...defaults, ...translations };
    const status = form.querySelector('#form-status, .form-status, [data-form-status]') || document.createElement('p');
    if (!status.isConnected) { status.className = 'form-status'; form.append(status); }
    status.id ||= 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    const announce = (message, failed = false) => {
      status.setAttribute('role', failed ? 'alert' : 'status');
      status.textContent = message;
    };
    const names = ['name', 'email', 'company', 'country', 'product', 'quantity', 'message'];
    const field = (name) => form.elements.namedItem(name);
    [...form.elements].forEach((element) => {
      if ('required' in element) element.required = ['name', 'email'].includes(element.name);
    });
    if (field('email')) { field('email').type = 'email'; field('email').maxLength = 160; }
    const model = (params.get('product') || params.get('model') || '').trim().slice(0, 120);
    const product = field('product');
    if (model && product && !product.value) {
      if (product.tagName !== 'SELECT' || [...product.options].some((option) => option.value === model)) product.value = model;
    }
    const startedAt = Date.now();
    const emailLink = document.getElementById('email-brief');
    let recipient = emailLink?.dataset.email || emailLink?.getAttribute('href')?.match(/^mailto:([^?]+)/i)?.[1] || 'lisa_li@rawisoud.com';
    if (!/^[^\s@?&#\r\n]+@[^\s@?&#\r\n]+\.[^\s@?&#\r\n]+$/.test(recipient)) recipient = 'lisa_li@rawisoud.com';
    const updateEmail = () => {
      if (!emailLink) return;
      const body = names.map((name, index) => {
        const value = String(field(name)?.value || '').trim();
        return value ? `${messages.fields?.[index] || defaults.fields[index]}: ${value}` : '';
      }).filter(Boolean);
      body.push('', `isoudaudio.com${window.location.pathname}`, `Entry page: ${attribution.sourcePath}`, `Language: ${language}`);
      const subject = String(messages.subject || 'iSoud audio project inquiry').replace(/[\r\n]/g, ' ').slice(0, 140);
      emailLink.setAttribute('href', `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.join('\n'))}`);
    };
    form.addEventListener('input', (event) => {
      event.target.setCustomValidity?.('');
      updateEmail();
    });
    form.addEventListener('change', updateEmail);
    emailLink?.addEventListener('click', updateEmail);
    updateEmail();
    const production = window.location.protocol === 'https:' && ['isoudaudio.com', 'www.isoudaudio.com'].includes(window.location.hostname);
    let webDelivery = null;
    if (production) {
      fetch('/api/inquiry', {headers:{Accept:'application/json'},credentials:'same-origin',signal:typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(6000) : undefined})
        .then(response => response.ok ? response.json() : null)
        .then(result => {
          if (typeof result?.available !== 'boolean') return;
          webDelivery = result.available;
          if (webDelivery) return;
          // Offer a working, explicitly labelled contact route before submission.
          const submit = form.querySelector('button[type="submit"]');
          if (submit) submit.hidden = true;
          if (emailLink) {emailLink.classList.remove('text-link');emailLink.classList.add('btn');}
          announce(messages.unavailable);
        })
        .catch(() => { /* Unknown status: the submit endpoint still handles errors. */ });
    }
    let pending = false;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (pending) return;
      for (const name of ['name', 'email']) {
        const input = field(name);
        if (input) input.value = input.value.trim();
      }
      if (!form.reportValidity()) return;
      updateEmail();
      if (production && webDelivery === false) { announce(messages.unavailable); return; }
      if (!production || form.dataset.preview === 'true' || root.dataset.preview === 'true') {
        announce(messages.fallback);
        return;
      }
      const data = new FormData(form);
      data.set('language', language);
      data.set('startedAt', String(startedAt));
      data.set('sourcePath', attribution.sourcePath);
      data.set('inquiryPath', window.location.pathname);
      data.set('referrerHost', attribution.referrerHost || '');
      campaignKeys.forEach((key) => {
        const value = attribution[key];
        if (value && /^[a-zA-Z0-9 _./-]{1,100}$/.test(value)) data.set(key, value);
      });
      const submit = event.submitter || form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
      const originalNodes = submit ? [...submit.childNodes] : [];
      const originalValue = submit?.value;
      const wasDisabled = Boolean(submit?.disabled);
      pending = true;
      form.setAttribute('aria-busy', 'true');
      if (submit) {
        submit.disabled = true;
        if (submit.tagName === 'INPUT') submit.value = messages.sending;
        else submit.textContent = messages.sending;
      }
      announce(messages.sending);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/api/inquiry', { method: 'POST', body: data, credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: controller.signal });
        const result = await response.json();
        if (!response.ok || result?.success !== true) throw new Error('inquiry-not-accepted');
        announce(messages.success);
      } catch {
        announce(messages.error, true);
      } finally {
        window.clearTimeout(timeout);
        pending = false;
        form.removeAttribute('aria-busy');
        if (submit) {
          submit.disabled = wasDisabled;
          if (submit.tagName === 'INPUT') submit.value = originalValue;
          else submit.replaceChildren(...originalNodes);
        }
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
