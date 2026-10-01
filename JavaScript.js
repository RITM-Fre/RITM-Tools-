'use strict';
/* =====================================================================
 * RITM Tools — single-file app (routing, i18n, theme, search, tools)
 * ADD A TOOL:     push T('id','category','🔧',[nameFa,nameEn],[descFa,descEn],box=>{ ...build the UI with h() and append it to box... })
 *                 into TOOLS, and add any new strings to D.
 * ADD A LANGUAGE: append a 3rd item to every row of D, add the code to i18n,
 *                 and extend lang detection / switchLang().
 * Supported browsers: latest Chrome, Firefox, Safari, Edge.
 * ===================================================================== */

/* ---------- helpers (DOM is built with textContent only: no innerHTML => no XSS) ---------- */
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, p = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(p)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false) e.setAttribute(k, v);
  }
  e.append(...kids); // strings become text nodes
  return e;
};
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  del: k => { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};
const K = { theme: 'ritm_theme_v1', lang: 'ritm_lang_v1', recent: 'ritm_recent_tools_v1' };

/* ---------- i18n: each row is [fa, en] and is expanded into two dictionaries ---------- */
const D = {
  title: ['ریتم تولز — ابزارهای آنلاین رایگان', 'RITM Tools — Free Online Tools'],
  desc: ['ابزارهای روزمره رایگان: شمارنده متن، رمز عبور، ماشین حساب، تبدیل واحد و بیشتر؛ همه در مرورگر شما.', 'Free everyday tools: text counter, password generator, calculator, unit converters and more, all in your browser.'],
  tagline: ['ابزارهای ساده و کاربردی، رایگان و بدون ارسال داده', 'Simple, practical tools. Free, and your data never leaves your device.'],
  sites: ['سایت ها', 'Sites'], theme: ['تغییر پوسته', 'Toggle theme'],
  search: ['جستجوی ابزار…', 'Search tools…'], empty: ['ابزاری پیدا نشد', 'No tools found'],
  recent: ['اخیراً استفاده شده', 'Recently used'], back: ['بازگشت', 'Back'],
  privacy_note: ['همه پردازش‌ها در مرورگر شما انجام می‌شود؛ هیچ داده‌ای ارسال نمی‌شود.', 'All processing happens in your browser. No data is sent anywhere.'],
  about: ['درباره', 'About'], contact: ['تماس', 'Contact'], privacy: ['حریم خصوصی', 'Privacy'],
  about_b: ['ریتم تولز مجموعه‌ای از ابزارهای روزمره است که کاملاً در مرورگر شما اجرا می‌شود.', 'RITM Tools is a set of everyday utilities that run entirely in your browser.'],
  contact_b: ['برای ارتباط از سایت‌های فهرست‌شده در منوی «سایت ها» بالای صفحه استفاده کنید.', 'To get in touch, use the sites listed in the "Sites" menu at the top of the page.'],
  privacy_b: ['هیچ داده‌ای به سرور ارسال نمی‌شود. زبان، پوسته و ابزارهای اخیر فقط در حافظه محلی مرورگر شما ذخیره می‌شوند و می‌توانید آن‌ها را پاک کنید.', 'No data is sent to any server. Language, theme and recent tools are stored only in your browser, and you can clear them at any time.'],
  clear: ['پاک کردن داده‌ها', 'Clear data'], clear_q: ['همه داده‌های ذخیره‌شده پاک شود؟', 'Clear all saved data?'],
  cleared: ['داده‌ها پاک شد', 'Data cleared'], cancel: ['انصراف', 'Cancel'],
  copy: ['کپی', 'Copy'], copied: ['کپی شد', 'Copied'],
  err_empty: ['ورودی خالی است', 'Input is empty'], err_invalid: ['ورودی نامعتبر است', 'Invalid input'],
  err_num: ['یک عدد معتبر وارد کنید', 'Enter a valid number'], err_pool: ['حداقل یک نوع کاراکتر انتخاب کنید', 'Select at least one character type'],
  err_range: ['بازه یا تعداد نامعتبر است', 'Invalid range or quantity'],
  c_text: ['متن', 'Text'], c_security: ['امنیت', 'Security'], c_everyday: ['روزمره', 'Everyday'],
  c_unit: ['تبدیل واحد', 'Unit conversion'], c_web: ['وب', 'Web'], c_extra: ['ابزارهای دیگر', 'Additional'],
  input: ['ورودی', 'Input'], output: ['خروجی', 'Output'],
  words: ['کلمات', 'Words'], chars: ['نویسه‌ها', 'Characters'], sent: ['جملات', 'Sentences'], paras: ['پاراگراف‌ها', 'Paragraphs'],
  up: ['حروف بزرگ', 'UPPERCASE'], low: ['حروف کوچک', 'lowercase'], ttl: ['Title Case', 'Title Case'], rev: ['معکوس', 'Reverse'],
  clean: ['حذف فاصله‌های اضافه', 'Remove extra spaces'],
  length: ['طول', 'Length'], excl: ['حذف کاراکترهای مشابه (0O1lI)', 'Exclude similar (0O1lI)'], gen: ['تولید', 'Generate'],
  entropy: ['آنتروپی', 'Entropy'], bits: ['بیت', 'bits'], password: ['گذرواژه', 'Password'],
  weak: ['ضعیف', 'Weak'], fair: ['متوسط', 'Fair'], good: ['خوب', 'Good'], strong: ['قوی', 'Strong'],
  tip_len: ['حداقل ۱۲ کاراکتر استفاده کنید', 'Use at least 12 characters'], tip_up: ['حروف بزرگ انگلیسی اضافه کنید', 'Add uppercase letters'],
  tip_num: ['عدد اضافه کنید', 'Add digits'], tip_sym: ['نماد اضافه کنید', 'Add symbols'],
  eq: ['محاسبه', 'Calculate'], min: ['حداقل', 'Min'], max: ['حداکثر', 'Max'], qty: ['تعداد', 'Quantity'], unique: ['بدون تکرار', 'Unique'],
  value: ['مقدار', 'Value'], from: ['از', 'From'], to: ['به', 'To'],
  fmt: ['زیباسازی', 'Format'], mini: ['فشرده‌سازی', 'Minify'], val: ['اعتبارسنجی', 'Validate'], valid: ['JSON معتبر است', 'Valid JSON'],
  enc: ['رمزگذاری', 'Encode'], dec: ['رمزگشایی', 'Decode'],
  units: ['سیستم واحد', 'Units'], metric: ['متریک (کیلوگرم، سانتی‌متر)', 'Metric (kg, cm)'], imperial: ['امپریال (پوند، اینچ)', 'Imperial (lb, in)'],
  weight: ['وزن', 'Weight'], height: ['قد', 'Height'], under: ['کم‌وزن', 'Underweight'], normal: ['طبیعی', 'Normal'], over: ['اضافه‌وزن', 'Overweight'], obese: ['چاق', 'Obese'],
  roll: ['پرتاب تاس', 'Roll die'], flip: ['پرتاب سکه', 'Flip coin'], heads: ['شیر', 'Heads'], tails: ['خط', 'Tails']
};
const i18n = { fa: {}, en: {} };
for (const k in D) { i18n.fa[k] = D[k][0]; i18n.en[k] = D[k][1]; }

let lang = store.get(K.lang) || ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'fa');
const t = k => i18n[lang][k] ?? k;
// Intl gives Persian digits for fa-IR and Latin digits for en-US
const nf = (n, o = {}) => new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 6, ...o }).format(n);
const nm = x => x.n[lang === 'fa' ? 0 : 1], ds = x => x.d[lang === 'fa' ? 0 : 1];

/* ---------- shared UI pieces ---------- */
function toast(msg, type = 'info') {
  const b = h('div', { class: 't ' + type }, msg);
  $('#toast').append(b);
  setTimeout(() => b.remove(), 3000);
}
const copyBtn = get => h('button', {
  class: 'btn sec', type: 'button',
  onclick: async () => {
    const v = get();
    if (!v) return toast(t('err_empty'), 'error');
    try { await navigator.clipboard.writeText(v); toast(t('copied'), 'success'); } catch { toast(t('err_invalid'), 'error'); }
  }
}, t('copy'));
// field(label, attrs, tag) -> [wrapper label, control]
const field = (label, attrs = {}, tag = 'input') => { const c = h(tag, attrs); return [h('label', { class: 'f' }, h('span', {}, label), c), c]; };
const chk = (label, on) => { const c = h('input', { type: 'checkbox', checked: on ? '' : false }); return [h('label', { class: 'chk' }, c, label), c]; };
const errEl = () => h('p', { class: 'err', role: 'alert' });

/* Text-in / text-out tool factory. ops = [[i18nKey | '=Raw label', fn(string) -> string|Promise]] */
const txt = (ops, ltr) => b => {
  const cls = ltr ? 'ltr' : '';
  const [wi, i] = field(t('input'), { rows: 6, class: cls }, 'textarea');
  const [wo, o] = field(t('output'), { rows: 6, readonly: '', class: cls }, 'textarea');
  const e = errEl();
  const row = h('div', { class: 'row' }, ...ops.map(([k, fn]) => h('button', {
    class: 'btn', type: 'button',
    onclick: async () => {
      e.textContent = '';
      if (!i.value.trim()) { e.textContent = t('err_empty'); return; }
      try { o.value = await fn(i.value); } catch { o.value = ''; e.textContent = t('err_invalid'); }
    }
  }, k[0] === '=' ? k.slice(1) : t(k))));
  b.append(wi, row, e, wo, h('div', { class: 'row' }, copyBtn(() => o.value)));
};
const sha = a => async s => [...new Uint8Array(await crypto.subtle.digest(a, new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');

/* Safe expression parser (no eval): + - * / % ^ ( ) sin cos tan sqrt log ln abs pi e */
function calc(src) {
  const s = src.toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, '');
  const tk = s.match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+|[-+*/^%(),]/g) || [];
  if (tk.join('') !== s) throw 0; // unknown characters
  const F = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, log: Math.log10, ln: Math.log, abs: Math.abs };
  const C = { pi: Math.PI, e: Math.E };
  let p = 0;
  const pk = () => tk[p], nx = () => tk[p++];
  const ex = () => { let v = tm(); while (pk() === '+' || pk() === '-') v = nx() === '+' ? v + tm() : v - tm(); return v; };
  const tm = () => { let v = un(); while (['*', '/', '%'].includes(pk())) { const o = nx(), r = un(); v = o === '*' ? v * r : o === '/' ? v / r : v % r; } return v; };
  const un = () => pk() === '-' ? (nx(), -un()) : pk() === '+' ? (nx(), un()) : pw();
  const pw = () => { const b = at(); return pk() === '^' ? (nx(), b ** un()) : b; };
  const at = () => {
    const k = nx();
    if (k === undefined) throw 0;
    if (k === '(') { const v = ex(); if (nx() !== ')') throw 0; return v; }
    if (/^[\d.]/.test(k)) return parseFloat(k);
    if (Object.hasOwn(C, k)) return C[k];
    if (Object.hasOwn(F, k)) { if (nx() !== '(') throw 0; const v = ex(); if (nx() !== ')') throw 0; return F[k](v); }
    throw 0;
  };
  const v = ex();
  if (p < tk.length) throw 0;
  return v;
}

/* Unit tables: unit -> [toBase, fromBase] */
const lin = o => Object.fromEntries(Object.entries(o).map(([k, f]) => [k, [v => v * f, v => v / f]]));
const U = {
  len: lin({ m: 1, km: 1000, cm: .01, mm: .001, mi: 1609.344, yd: .9144, ft: .3048, in: .0254 }),
  wt: lin({ kg: 1, g: .001, mg: 1e-6, lb: .45359237, oz: .028349523125, t: 1000 }),
  tmp: { '°C': [v => v, v => v], '°F': [v => (v - 32) * 5 / 9, v => v * 9 / 5 + 32], K: [v => v - 273.15, v => v + 273.15] },
  vol: lin({ l: 1, ml: .001, gal: 3.785411784, qt: .946352946, cup: .2365882365, 'fl oz': .0295735295625 })
};
const conv = key => b => {
  const u = U[key], ks = Object.keys(u);
  const mk = (l, sel) => { const [w, s] = field(l, {}, 'select'); s.append(...ks.map(k => h('option', { value: k, selected: k === sel ? '' : false }, k))); return [w, s]; };
  const [wv, v] = field(t('value'), { type: 'number', step: 'any', value: '1', class: 'ltr' });
  const [wf, f] = mk(t('from'), ks[0]), [wt, to] = mk(t('to'), ks[1]);
  const o = h('output', { class: 'res' }), e = errEl();
  let raw = '';
  const run = () => {
    e.textContent = ''; o.textContent = ''; raw = '';
    const x = parseFloat(v.value);
    if (!isFinite(x)) { e.textContent = t('err_num'); return; }
    const r = u[to.value][1](u[f.value][0](x));
    raw = String(+r.toPrecision(10));
    o.textContent = nf(r, { maximumSignificantDigits: 8 }) + ' ' + to.value;
  };
  [v, f, to].forEach(c => c.addEventListener('input', run));
  run();
  b.append(wv, h('div', { class: 'row' }, wf, wt), e, o, h('div', { class: 'row' }, copyBtn(() => raw)));
};

/* ---------- tool registry ---------- */
const T = (id, cat, icon, n, d, init) => ({ id, cat, icon, n, d, init });
const TOOLS = [
  T('counter', 'text', '🔢', ['شمارنده متن', 'Text Counter'], ['کلمه، نویسه، جمله و پاراگراف', 'Words, characters, sentences, paragraphs'], b => {
    const [w, i] = field(t('input'), { rows: 8 }, 'textarea'), o = h('output', { class: 'res' });
    const u = () => {
      const s = i.value, tr = s.trim();
      const v = [[t('words'), tr ? tr.split(/\s+/).length : 0], [t('chars'), s.length], [t('sent'), (s.match(/[^.!?؟]+[.!?؟]+/g) || []).length], [t('paras'), s.split(/\n\s*\n/).filter(x => x.trim()).length]];
      o.textContent = v.map(([a, n]) => a + ': ' + nf(n)).join(' · ');
    };
    i.oninput = u; u(); b.append(w, o);
  }),
  T('transform', 'text', '🔠', ['تبدیل متن', 'Text Transform'], ['بزرگ، کوچک، عنوان و معکوس', 'Upper, lower, title, reverse'], txt([
    ['up', s => s.toUpperCase()], ['low', s => s.toLowerCase()],
    ['ttl', s => s.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase())], ['rev', s => [...s].reverse().join('')]])),
  T('clean', 'text', '🧹', ['پاک‌سازی فاصله‌ها', 'Space Cleaner'], ['حذف فاصله و خطوط خالی اضافه', 'Remove extra spaces and blank lines'], txt([
    ['clean', s => s.replace(/[ \t]+/g, ' ').replace(/^ | $/gm, '').replace(/\n{2,}/g, '\n').trim()]])),
  T('passgen', 'security', '🔑', ['تولید رمز عبور', 'Password Generator'], ['رمز قوی با تنظیمات دلخواه', 'Strong, customizable passwords'], b => {
    const sets = [['a-z', 'abcdefghijklmnopqrstuvwxyz'], ['A-Z', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'], ['0-9', '0123456789'], ['!@#', '!@#$%^&*()-_=+[]{};:,.?']];
    const [wl, l] = field(t('length'), { type: 'range', min: 4, max: 64, value: 16 }), lv = h('b', {}, nf(16));
    const cs = sets.map(([n], i) => chk(n, i < 3)), [wx, x] = chk(t('excl'));
    const o = h('output', { class: 'res ltr' }), en = h('p', {}), e = errEl();
    const gen = () => {
      let pool = sets.filter((_, i) => cs[i][1].checked).map(s => s[1]).join('');
      if (x.checked) pool = pool.replace(/[0O1lI]/g, '');
      if (!pool) { e.textContent = t('err_pool'); return; }
      e.textContent = '';
      const n = +l.value;
      o.textContent = [...crypto.getRandomValues(new Uint32Array(n))].map(v => pool[v % pool.length]).join('');
      en.textContent = t('entropy') + ': ' + nf(n * Math.log2(pool.length), { maximumFractionDigits: 0 }) + ' ' + t('bits');
    };
    l.oninput = () => { lv.textContent = nf(l.value); gen(); };
    [...cs.map(c => c[1]), x].forEach(c => c.addEventListener('change', gen));
    gen();
    b.append(h('div', { class: 'row' }, wl, lv), h('div', { class: 'row' }, ...cs.map(c => c[0]), wx), e, o, en,
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: gen }, t('gen')), copyBtn(() => o.textContent)));
  }),
  T('strength', 'security', '🛡️', ['سنجش قدرت رمز', 'Password Strength'], ['بررسی لحظه‌ای با نوار رنگی', 'Live check with a colored bar'], b => {
    const [w, i] = field(t('password'), { type: 'text', class: 'ltr', autocomplete: 'off' });
    const bar = h('i'), lab = h('p', { class: 'res' }), tips = h('ul');
    const u = () => {
      const p = i.value; tips.replaceChildren();
      if (!p) { bar.style.width = '0'; lab.textContent = ''; return; }
      const c = (/[a-z]/.test(p) ? 26 : 0) + (/[A-Z]/.test(p) ? 26 : 0) + (/\d/.test(p) ? 10 : 0) + (/[^a-zA-Z\d]/.test(p) ? 32 : 0);
      const bits = p.length * Math.log2(c || 1), lv = bits < 28 ? 0 : bits < 50 ? 1 : bits < 70 ? 2 : 3;
      bar.style.width = (lv + 1) * 25 + '%'; bar.style.background = ['#d64545', '#e5a21c', '#4aa3ff', '#1a9e5c'][lv];
      lab.textContent = t(['weak', 'fair', 'good', 'strong'][lv]) + ' · ' + t('entropy') + ': ' + nf(bits, { maximumFractionDigits: 0 });
      [[p.length < 12, 'tip_len'], [!/[A-Z]/.test(p), 'tip_up'], [!/\d/.test(p), 'tip_num'], [!/[^a-zA-Z\d]/.test(p), 'tip_sym']].forEach(([f, k]) => f && tips.append(h('li', {}, t(k))));
    };
    i.oninput = u; b.append(w, h('div', { class: 'meter' }, bar), lab, tips);
  }),
  T('calc', 'everyday', '🧮', ['ماشین حساب', 'Calculator'], ['ساده و علمی، بدون eval', 'Simple and scientific, no eval'], b => {
    const [w, i] = field(t('input'), { type: 'text', class: 'ltr', autocomplete: 'off', placeholder: 'sin(pi/2)+2^3*sqrt(16)' });
    const o = h('output', { class: 'res ltr' }), e = errEl(); let raw = '';
    const go = () => {
      e.textContent = ''; o.textContent = ''; raw = '';
      if (!i.value.trim()) { e.textContent = t('err_empty'); return; }
      try { const v = calc(i.value); if (!isFinite(v)) throw 0; raw = String(+v.toPrecision(12)); o.textContent = nf(v, { maximumSignificantDigits: 12 }); }
      catch { e.textContent = t('err_invalid'); }
    };
    i.onkeydown = ev => ev.key === 'Enter' && go();
    b.append(w, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: go }, t('eq')), copyBtn(() => raw)), e, o);
  }),
  T('random', 'everyday', '🎯', ['عدد تصادفی', 'Random Numbers'], ['اعداد تصادفی در یک بازه', 'Random numbers in a range'], b => {
    const mk = (k, v) => field(t(k), { type: 'number', value: v, class: 'ltr' });
    const [a, A] = mk('min', '1'), [c, C] = mk('max', '100'), [q, Q] = mk('qty', '5'), [u, X] = chk(t('unique'));
    const o = h('output', { class: 'res ltr' }), e = errEl(); let raw = '';
    const go = () => {
      e.textContent = ''; const lo = +A.value, hi = +C.value, n = +Q.value;
      if (A.value === '' || C.value === '' || ![lo, hi, n].every(Number.isInteger) || lo > hi || n < 1 || n > 1000 || (X.checked && n > hi - lo + 1)) {
        e.textContent = t('err_range'); o.textContent = ''; raw = ''; return;
      }
      const r = [], seen = new Set();
      while (r.length < n) {
        const x = lo + Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * (hi - lo + 1));
        if (X.checked) { if (seen.has(x)) continue; seen.add(x); }
        r.push(x);
      }
      raw = r.join(', ');
      o.textContent = r.map(x => nf(x, { useGrouping: false })).join(lang === 'fa' ? '، ' : ', ');
    };
    b.append(h('div', { class: 'row' }, a, c, q), u, e, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: go }, t('gen')), copyBtn(() => raw)), o);
  }),
  T('len', 'unit', '📏', ['تبدیل طول', 'Length Converter'], ['متر، فوت، اینچ، کیلومتر و …', 'Meter, foot, inch, kilometer…'], conv('len')),
  T('wt', 'unit', '⚖️', ['تبدیل وزن', 'Weight Converter'], ['کیلوگرم، پوند، گرم، اونس و …', 'Kilogram, pound, gram, ounce…'], conv('wt')),
  T('tmp', 'unit', '🌡️', ['تبدیل دما', 'Temperature Converter'], ['سلسیوس، فارنهایت، کلوین', 'Celsius, Fahrenheit, Kelvin'], conv('tmp')),
  T('vol', 'unit', '🧪', ['تبدیل حجم', 'Volume Converter'], ['لیتر، گالن، میلی‌لیتر و …', 'Liter, gallon, milliliter…'], conv('vol')),
  T('base64', 'web', '🔤', ['Base64', 'Base64'], ['رمزگذاری و رمزگشایی با یونیکد', 'Encode and decode, Unicode-safe'], txt([
    ['enc', s => btoa([...new TextEncoder().encode(s)].map(c => String.fromCharCode(c)).join(''))],
    ['dec', s => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(s.trim()), c => c.charCodeAt(0)))]], true)),
  T('hash', 'extra', '#️⃣', ['تولید هش', 'Hash Generator'], ['SHA-1، SHA-256 و SHA-512', 'SHA-1, SHA-256, SHA-512'], txt([
    ['=SHA-1', sha('SHA-1')], ['=SHA-256', sha('SHA-256')], ['=SHA-512', sha('SHA-512')]], true)),
  T('url', 'extra', '🔗', ['URL انکد/دیکد', 'URL Encode/Decode'], ['کدگذاری آدرس اینترنتی', 'Encode or decode URLs'], txt([
    ['enc', s => encodeURIComponent(s)], ['dec', s => decodeURIComponent(s)]], true)),
  T('json', 'extra', '🧾', ['فرمت JSON', 'JSON Formatter'], ['زیباسازی، فشرده‌سازی و اعتبارسنجی', 'Format, minify and validate'], txt([
    ['fmt', s => JSON.stringify(JSON.parse(s), null, 2)], ['mini', s => JSON.stringify(JSON.parse(s))], ['val', s => (JSON.parse(s), t('valid'))]], true)),
  T('bmi', 'extra', '💪', ['شاخص توده بدنی', 'BMI Calculator'], ['متریک و امپریال', 'Metric and imperial'], b => {
    const [wu, u] = field(t('units'), {}, 'select');
    u.append(h('option', { value: 'm' }, t('metric')), h('option', { value: 'i' }, t('imperial')));
    const [ww, w] = field('', { type: 'number', step: 'any', min: 0, class: 'ltr' }), [wh, hh] = field('', { type: 'number', step: 'any', min: 0, class: 'ltr' });
    const o = h('output', { class: 'res' }), e = errEl();
    const run = () => {
      const m = u.value === 'm';
      ww.firstChild.textContent = t('weight') + (m ? ' (kg)' : ' (lb)'); wh.firstChild.textContent = t('height') + (m ? ' (cm)' : ' (in)');
      const a = +w.value, c = +hh.value; e.textContent = ''; o.textContent = '';
      if (!(a > 0 && c > 0)) { if (w.value || hh.value) e.textContent = t('err_num'); return; }
      const v = m ? a / ((c / 100) ** 2) : 703 * a / (c ** 2);
      o.textContent = nf(v, { maximumFractionDigits: 1 }) + ' — ' + t(v < 18.5 ? 'under' : v < 25 ? 'normal' : v < 30 ? 'over' : 'obese');
    };
    [u, w, hh].forEach(c => c.addEventListener('input', run)); run();
    b.append(wu, ww, wh, e, o);
  }),
  T('dice', 'extra', '🎲', ['تاس و سکه', 'Dice & Coin'], ['پرتاب تاس و سکه', 'Roll a die or flip a coin'], b => {
    const o = h('div', { class: 'big', role: 'status', 'aria-live': 'polite' }, '🎲');
    const r = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const show = s => { o.textContent = s; o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop'); };
    b.append(h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onclick: () => show('⚀⚁⚂⚃⚄⚅'[r(6)]) }, t('roll')),
      h('button', { class: 'btn', type: 'button', onclick: () => show('🪙 ' + t(r(2) ? 'heads' : 'tails')) }, t('flip'))), o);
  })
];
const CATS = ['text', 'security', 'everyday', 'unit', 'web', 'extra'];
const PAGES = ['about', 'contact', 'privacy'];

/* ---------- recent tools (last 5) ---------- */
const recentIds = () => { try { const r = JSON.parse(store.get(K.recent)); return Array.isArray(r) ? r : []; } catch { return []; } };
const addRecent = id => store.set(K.recent, JSON.stringify([id, ...recentIds().filter(x => x !== id)].slice(0, 5)));

/* ---------- SEO: title, description, JSON-LD per tool and language ---------- */
function seo(ti, de) {
  document.title = ti;
  $('meta[name=description]').content = de;
  $('#ld').textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: ti, description: de, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' } });
}

/* ---------- views ---------- */
const app = $('#app');
const arrow = () => (lang === 'fa' ? '→ ' : '← ');
const card = x => h('a', { class: 'card', href: '#/' + x.id }, h('span', { class: 'ic', 'aria-hidden': 'true' }, x.icon), h('b', {}, nm(x)), h('small', {}, ds(x)));

function home() {
  const q = h('input', { type: 'search', class: 'search', placeholder: t('search'), 'aria-label': t('search') }), list = h('div');
  const draw = () => {
    const s = q.value.trim().toLowerCase(); // live filter on name + description of the active language
    const m = TOOLS.filter(x => (nm(x) + ' ' + ds(x)).toLowerCase().includes(s));
    list.replaceChildren();
    if (!m.length) { list.append(h('div', { class: 'empty' }, h('div', { class: 'big', 'aria-hidden': 'true' }, '🔍'), t('empty'))); return; }
    const rc = s ? [] : recentIds().map(id => TOOLS.find(x => x.id === id)).filter(Boolean);
    if (rc.length) list.append(h('h2', {}, t('recent')), h('div', { class: 'grid' }, ...rc.map(card)));
    CATS.forEach(c => { const g = m.filter(x => x.cat === c); if (g.length) list.append(h('h2', {}, t('c_' + c)), h('div', { class: 'grid' }, ...g.map(card))); });
  };
  q.oninput = draw; draw();
  app.append(h('section', { class: 'hero' }, h('h1', {}, 'RITM Tools'), h('p', {}, t('tagline')), q), list, h('p', { class: 'note' }, '🔒 ' + t('privacy_note')));
  seo(t('title'), t('desc'));
}
function toolView(x) {
  addRecent(x.id);
  const box = h('section', { class: 'panel' });
  app.append(h('a', { class: 'back', href: '#/' }, arrow() + t('back')), h('h1', {}, x.icon + ' ' + nm(x)), h('p', { class: 'sub' }, ds(x)), box, h('p', { class: 'note' }, '🔒 ' + t('privacy_note')));
  x.init(box);
  seo(nm(x) + ' | RITM Tools', ds(x));
}
function pageView(p) {
  app.append(h('a', { class: 'back', href: '#/' }, arrow() + t('back')), h('h1', {}, t(p)), h('p', { class: 'sub' }, t(p + '_b')));
  seo(t(p) + ' | RITM Tools', t(p + '_b'));
}

/* ---------- hash router: #/tool-id ---------- */
function route() {
  const id = location.hash.replace(/^#\/?/, '');
  const tool = TOOLS.find(x => x.id === id);
  app.replaceChildren();
  if (tool) toolView(tool); else if (PAGES.includes(id)) pageView(id); else home();
  window.scrollTo(0, 0);
}

/* ---------- chrome: dir, lang, fonts, header labels, footer ---------- */
const dlg = $('#dlg');
function askClear() {
  dlg.replaceChildren(h('p', {}, t('clear_q')), h('div', { class: 'row' },
    h('button', { class: 'btn', type: 'button', onclick: () => { Object.values(K).forEach(k => store.del(k)); dlg.close(); toast(t('cleared'), 'success'); route(); } }, t('clear')),
    h('button', { class: 'btn sec', type: 'button', onclick: () => dlg.close() }, t('cancel'))));
  dlg.showModal();
}
function chrome() {
  const d = document.documentElement;
  d.lang = lang; d.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
  $('#langBtn').textContent = lang === 'fa' ? 'EN' : 'فا';
  $('#langBtn').setAttribute('aria-label', 'Language / زبان');
  $('#themeBtn').textContent = d.dataset.theme === 'dark' ? '☀️' : '🌙';
  $('#themeBtn').setAttribute('aria-label', t('theme'));
  $('#foot').replaceChildren(...PAGES.map(p => h('a', { href: '#/' + p }, t(p))), h('button', { type: 'button', onclick: askClear }, t('clear')), h('span', {}, '© RITM Tools'));
}

/* ---------- init ---------- */
document.documentElement.dataset.theme = store.get(K.theme) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('#themeBtn').onclick = () => {
  const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark';
  store.set(K.theme, d.dataset.theme); chrome();
};
$('#langBtn').onclick = () => { lang = lang === 'fa' ? 'en' : 'fa'; store.set(K.lang, lang); chrome(); route(); }; // instant, no reload

const sb = $('#sitesBtn'), sm = $('#sitesMenu');
const closeSites = () => { sm.hidden = true; sb.setAttribute('aria-expanded', 'false'); };
sb.onclick = e => { e.stopPropagation(); sm.hidden = !sm.hidden; sb.setAttribute('aria-expanded', String(!sm.hidden)); };
document.addEventListener('click', e => { if (!sm.contains(e.target)) closeSites(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSites(); });

// Pointer-reactive card glow
app.addEventListener('pointermove', e => {
  const c = e.target.closest('.card');
  if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--x', e.clientX - r.left + 'px'); c.style.setProperty('--y', e.clientY - r.top + 'px'); }
});
addEventListener('hashchange', route);
chrome(); route();
