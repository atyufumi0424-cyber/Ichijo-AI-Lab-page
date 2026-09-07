const defaults = {
  apps: [
    { id: 'app-1', title: '英会話 AIバディ', category: 'ENGLISH', description: 'AIが生徒役になり、教えることで三人称単数現在形を学べる対話型アプリ。', accent: 'pink', url: '' },
    { id: 'app-2', title: 'スーパー地層マスターズ', category: 'SCIENCE', description: '地層の見方や地学の知識を、ゲーム感覚で身につける学習アプリ。', accent: 'cyan', url: '' },
    { id: 'app-3', title: '数学ドリル エコマイナー', category: 'MATHEMATICS', description: '問題を解きながら資源を集める、学習と達成感を組み合わせた数学ドリル。', accent: 'yellow', url: '' },
    { id: 'app-4', title: '鹿を守るゲーム', category: 'LOCAL ACTION', description: '奈良の鹿がごみを食べる問題を、遊びながら知り行動につなげるゲーム。', accent: 'purple', url: '' }
  ],
  posts: [
    { id: 'post-1', date: '2026-09-17', title: 'AIバディ活用探究、始動。', excerpt: 'AIを学習や身近な問題の解決にどう役立てられるのか。私たちの探究が始まりました。' },
    { id: 'post-2', date: '2026-08-24', title: 'AIの「本当の姿」と向き合う', excerpt: '便利さの裏にあるハルシネーションやバイアス。危険性を知ることから共創は始まります。' },
    { id: 'post-3', date: '2026-07-30', title: '5か月で50のアイデアを形に', excerpt: '「ほしい」ではなく「つくる」。試行錯誤から生まれた制作物を振り返ります。' }
  ]
};

const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(`ichijoLab:${key}`)) || defaults[key] || []; }
    catch { return defaults[key] || []; }
  },
  set(key, value) { localStorage.setItem(`ichijoLab:${key}`, JSON.stringify(value)); }
};

const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatDate = value => { const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('ja-JP', {year:'numeric', month:'long', day:'numeric'}).format(d); };

function renderPublic() {
  const appList = document.querySelector('#app-list');
  if (appList) {
    const apps = store.get('apps');
    appList.innerHTML = apps.length ? apps.map((app, i) => `<article class="project-card accent-${escapeHTML(app.accent || ['pink','cyan','yellow','purple'][i % 4])} reveal"><div class="project-top"><span>${String(i + 1).padStart(2, '0')}</span><small>${escapeHTML(app.category)}</small></div><div class="project-visual" aria-hidden="true"><b>${escapeHTML(app.title.slice(0, 1))}</b><i></i></div><h3>${escapeHTML(app.title)}</h3><p>${escapeHTML(app.description)}</p>${app.url ? `<a href="${escapeHTML(app.url)}" target="_blank" rel="noopener">アプリを開く <span>↗</span></a>` : '<span class="coming-soon">COMING SOON</span>'}</article>`).join('') : '<p class="empty-state">公開中のアプリはありません。</p>';
  }
  const blogList = document.querySelector('#blog-list');
  if (blogList) {
    const posts = store.get('posts');
    blogList.innerHTML = posts.length ? posts.map(post => `<article class="blog-card reveal"><time datetime="${escapeHTML(post.date)}">${escapeHTML(formatDate(post.date))}</time><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt)}</p><span class="read-more">READ STORY <b>→</b></span></article>`).join('') : '<p class="empty-state">記事はまだありません。</p>';
  }
}

function initCommon() {
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.global-nav');
  menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!open)); nav?.classList.toggle('open', !open); });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu?.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }));
  document.querySelectorAll('[data-form-name]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const messages = store.get('messages');
    messages.unshift({ id: `msg-${Date.now()}`, kind: form.dataset.formName, receivedAt: new Date().toISOString(), ...data });
    store.set('messages', messages);
    form.reset();
    const status = form.querySelector('.form-status');
    if (status) status.textContent = 'ありがとうございます。内容を受け付けました。';
  }));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), {threshold: .12});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  const year = document.querySelector('#year'); if (year) year.textContent = new Date().getFullYear();
}

function initAdmin() {
  const tabs = document.querySelectorAll('.admin-tab');
  if (!tabs.length) return;
  const switchTab = name => { tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name)); document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`)); };
  tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

  const render = () => {
    const apps = store.get('apps'), posts = store.get('posts'), messages = store.get('messages');
    document.querySelector('#app-count').textContent = apps.length;
    document.querySelector('#post-count').textContent = posts.length;
    document.querySelector('#message-count').textContent = messages.length;
    document.querySelector('#admin-app-list').innerHTML = apps.length ? apps.map(x => `<article><div><small>${escapeHTML(x.category)}</small><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.description)}</p></div><button class="delete-button" data-delete-app="${escapeHTML(x.id)}">削除</button></article>`).join('') : '<p class="empty-state">アプリはありません。</p>';
    document.querySelector('#admin-post-list').innerHTML = posts.length ? posts.map(x => `<article><div><small>${escapeHTML(formatDate(x.date))}</small><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.excerpt)}</p></div><button class="delete-button" data-delete-post="${escapeHTML(x.id)}">削除</button></article>`).join('') : '<p class="empty-state">記事はありません。</p>';
    document.querySelector('#admin-message-list').innerHTML = messages.length ? messages.map(x => `<article class="message-item"><div><small>${escapeHTML(x.kind)} · ${escapeHTML(new Date(x.receivedAt).toLocaleString('ja-JP'))}</small><h3>${escapeHTML(x.name)}</h3><p><a href="mailto:${escapeHTML(x.email)}">${escapeHTML(x.email)}</a>${x.organization ? ` · ${escapeHTML(x.organization)}` : ''}</p><p>${escapeHTML(x.message)}</p></div></article>`).join('') : '<p class="empty-state">受信内容はありません。</p>';
  };
  document.querySelector('#app-form').addEventListener('submit', e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); const apps = store.get('apps'); apps.unshift({id:`app-${Date.now()}`, accent:['pink','cyan','yellow','purple'][apps.length % 4], ...data}); store.set('apps', apps); e.currentTarget.reset(); render(); });
  document.querySelector('#post-form').addEventListener('submit', e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); const posts = store.get('posts'); posts.unshift({id:`post-${Date.now()}`, ...data}); store.set('posts', posts); e.currentTarget.reset(); render(); });
  document.addEventListener('click', e => { const appId = e.target.dataset?.deleteApp, postId = e.target.dataset?.deletePost; if (appId) { store.set('apps', store.get('apps').filter(x => x.id !== appId)); render(); } if (postId) { store.set('posts', store.get('posts').filter(x => x.id !== postId)); render(); } });
  document.querySelector('#clear-messages').addEventListener('click', () => { if (confirm('受信内容をすべて削除しますか？')) { store.set('messages', []); render(); } });
  render();
}

renderPublic();
initCommon();
initAdmin();
