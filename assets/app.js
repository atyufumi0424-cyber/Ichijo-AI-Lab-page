const config = window.ICHJO_LAB_CONFIG || {};
const db = window.supabase?.createClient(config.supabaseUrl, config.supabasePublishableKey);
const defaultApps = [
  { id:'sample-1', title:'英会話 AIバディ', category:'ENGLISH', description:'AIが生徒役になり、教えることで三人称単数現在形を学べる対話型アプリ。', accent:'pink', url:'', code:'' },
  { id:'sample-2', title:'スーパー地層マスターズ', category:'SCIENCE', description:'地層の見方や地学の知識を、ゲーム感覚で身につける学習アプリ。', accent:'cyan', url:'', code:'' },
  { id:'sample-3', title:'数学ドリル エコマイナー', category:'MATHEMATICS', description:'問題を解きながら資源を集める、学習と達成感を組み合わせた数学ドリル。', accent:'yellow', url:'', code:'' },
  { id:'sample-4', title:'鹿を守るゲーム', category:'LOCAL ACTION', description:'奈良の鹿がごみを食べる問題を、遊びながら知り行動につなげるゲーム。', accent:'purple', url:'', code:'' }
];
const escapeHTML = (value='') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatDate = value => { const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric'}).format(d); };

async function getApps() {
  if (!db) return defaultApps;
  const {data,error}=await db.from('apps').select('*').order('created_at',{ascending:false});
  if (error) return defaultApps;
  return data.length ? data : defaultApps;
}
async function getPosts() {
  if (!db) return [];
  const {data,error}=await db.from('posts').select('*').order('published_on',{ascending:false});
  return error ? [] : data;
}

async function renderPublic() {
  const appList=document.querySelector('#app-list');
  if(appList){const apps=await getApps();appList.innerHTML=apps.map((app,i)=>{const action=app.code?`<a href="runner.html?id=${encodeURIComponent(app.id)}">ブラウザで開く <span>→</span></a>`:app.url?`<a href="${escapeHTML(app.url)}" target="_blank" rel="noopener">アプリを開く <span>↗</span></a>`:'<span class="coming-soon">COMING SOON</span>';return `<article class="project-card accent-${escapeHTML(app.accent||['pink','cyan','yellow','purple'][i%4])} reveal visible"><div class="project-top"><span>${String(i+1).padStart(2,'0')}</span><small>${escapeHTML(app.category)}</small></div><div class="project-visual" aria-hidden="true"><b>${escapeHTML(app.title.slice(0,1))}</b><i></i></div><h3>${escapeHTML(app.title)}</h3><p>${escapeHTML(app.description)}</p>${action}</article>`}).join('')}
  const blogList=document.querySelector('#blog-list');
  if(blogList){const posts=await getPosts();blogList.innerHTML=posts.length?posts.map(post=>`<article class="blog-card reveal visible"><time datetime="${escapeHTML(post.published_on)}">${escapeHTML(formatDate(post.published_on))}</time><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt)}</p><span class="read-more">READ STORY <b>→</b></span></article>`).join(''):'<p class="empty-state">記事はまだありません。最初の活動記録を準備中です。</p>'}
}

function initCommon(){
  const menu=document.querySelector('.menu-button'),nav=document.querySelector('.global-nav');
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('open',!open)});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');nav.classList.remove('open')}));
  document.querySelectorAll('[data-form-name]').forEach(form=>form.addEventListener('submit',submitMessage));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
}

async function submitMessage(event){
  event.preventDefault();const form=event.currentTarget,status=form.querySelector('.form-status'),button=form.querySelector('button[type="submit"]');
  const values=Object.fromEntries(new FormData(form));button.disabled=true;status.textContent='送信しています…';
  const record={kind:form.dataset.formName,name:values.name,email:values.email,organization:values.organization||'',request_type:values.type||'',message:values.message};
  try{
    if(!db)throw new Error('接続設定がありません');
    const {error}=await db.from('messages').insert(record);if(error)throw error;
    fetch(`https://formsubmit.co/ajax/${encodeURIComponent(config.notificationEmail)}`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({_subject:`Ichijo AI Lab：${record.kind}が届きました`,種別:record.kind,お名前:record.name,メールアドレス:record.email,所属:record.organization,依頼の種類:record.request_type,内容:record.message,_template:'table'})}).catch(()=>{});
    form.reset();status.textContent='ありがとうございます。内容を送信しました。';
  }catch(error){console.error(error);status.textContent='送信できませんでした。入力内容を残したまま、時間をおいて再度お試しください。'}finally{button.disabled=false}
}

function prepareAppCode(raw=''){const code=raw.trim();if(!code)return'';if(/<!doctype|<html[\s>]|<body[\s>]/i.test(code))return code;if(/<[a-z][\s\S]*>/i.test(code))return`<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px}</style></head><body>${code}</body></html>`;if(/\b(function|const|let|var|document\.|window\.|addEventListener|=>)\b/.test(code))return`<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px}</style></head><body><main id="app"></main><script>${code}<\/script></body></html>`;return`<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${code}</style></head><body><main id="app">アプリのHTMLを追加してください。</main></body></html>`}

async function initAdmin(){
  const shell=document.querySelector('.admin-shell');if(!shell||!db)return;
  const loginScreen=document.querySelector('#login-screen'),loginForm=document.querySelector('#login-form'),loginStatus=document.querySelector('#login-status');
  const showSession=async session=>{const signedIn=Boolean(session);loginScreen.hidden=signedIn;shell.hidden=!signedIn;document.querySelector('.admin-header').classList.toggle('signed-in',signedIn);document.querySelector('#admin-email').textContent=session?.user?.email||'';if(signedIn)await renderAdmin()};
  const {data:{session}}=await db.auth.getSession();await showSession(session);
  db.auth.onAuthStateChange((_event,nextSession)=>setTimeout(()=>showSession(nextSession),0));
  loginForm.addEventListener('submit',async e=>{e.preventDefault();loginStatus.textContent='確認しています…';const values=Object.fromEntries(new FormData(loginForm));const {error}=await db.auth.signInWithPassword(values);loginStatus.textContent=error?'メールアドレスまたはパスワードが正しくありません。':''});
  document.querySelector('#logout-button').addEventListener('click',()=>db.auth.signOut());
  document.querySelectorAll('.admin-tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.admin-tab').forEach(t=>t.classList.toggle('active',t===tab));document.querySelectorAll('.admin-panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${tab.dataset.tab}`))}));
  document.querySelector('#app-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form));const {error}=await db.from('apps').insert({title:data.title,category:data.category,description:data.description,url:data.url||'',code:prepareAppCode(data.code),accent:['pink','cyan','yellow','purple'][Math.floor(Math.random()*4)]});if(error)return alert(`追加できませんでした：${error.message}`);form.reset();await renderAdmin()});
  document.querySelector('#post-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form));const {error}=await db.from('posts').insert({title:data.title,published_on:data.date,excerpt:data.excerpt});if(error)return alert(`追加できませんでした：${error.message}`);form.reset();await renderAdmin()});
  document.addEventListener('click',async e=>{const appId=e.target.dataset?.deleteApp,postId=e.target.dataset?.deletePost,messageId=e.target.dataset?.deleteMessage;if(appId){await db.from('apps').delete().eq('id',appId);await renderAdmin()}if(postId){await db.from('posts').delete().eq('id',postId);await renderAdmin()}if(messageId){await db.from('messages').delete().eq('id',messageId);await renderAdmin()}});
  document.querySelector('#clear-messages').addEventListener('click',async()=>{if(confirm('受信内容をすべて削除しますか？')){const {data}=await db.from('messages').select('id');for(const item of data||[])await db.from('messages').delete().eq('id',item.id);await renderAdmin()}});
}

async function renderAdmin(){
  const [{data:apps=[],error:appError},{data:posts=[],error:postError},{data:messages=[],error:messageError}]=await Promise.all([db.from('apps').select('*').order('created_at',{ascending:false}),db.from('posts').select('*').order('published_on',{ascending:false}),db.from('messages').select('*').order('created_at',{ascending:false})]);
  if(appError||postError||messageError){document.querySelector('#panel-overview .admin-card').innerHTML='<h3>初期設定が必要です</h3><p>SupabaseのSQL Editorで、リポジトリ内の supabase-setup.sql を実行してください。</p>';return}
  document.querySelector('#app-count').textContent=apps.length;document.querySelector('#post-count').textContent=posts.length;document.querySelector('#message-count').textContent=messages.length;
  document.querySelector('#admin-app-list').innerHTML=apps.length?apps.map(x=>`<article><div><small>${escapeHTML(x.category)}${x.code?' · CODE READY':''}</small><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.description)}</p>${x.code?`<a class="admin-preview-link" href="runner.html?id=${encodeURIComponent(x.id)}" target="_blank">プレビューを開く ↗</a>`:''}</div><button class="delete-button" data-delete-app="${x.id}">削除</button></article>`).join(''):'<p class="empty-state">アプリはありません。</p>';
  document.querySelector('#admin-post-list').innerHTML=posts.length?posts.map(x=>`<article><div><small>${escapeHTML(formatDate(x.published_on))}</small><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.excerpt)}</p></div><button class="delete-button" data-delete-post="${x.id}">削除</button></article>`).join(''):'<p class="empty-state">記事はありません。</p>';
  document.querySelector('#admin-message-list').innerHTML=messages.length?messages.map(x=>`<article class="message-item"><div><small>${escapeHTML(x.kind)} · ${escapeHTML(new Date(x.created_at).toLocaleString('ja-JP'))}</small><h3>${escapeHTML(x.name)}</h3><p><a href="mailto:${escapeHTML(x.email)}">${escapeHTML(x.email)}</a>${x.organization?` · ${escapeHTML(x.organization)}`:''}</p><p>${escapeHTML(x.message)}</p></div><button class="delete-button" data-delete-message="${x.id}">削除</button></article>`).join(''):'<p class="empty-state">受信内容はありません。</p>';
}

async function initRunner(){const frame=document.querySelector('#app-frame');if(!frame)return;const id=new URLSearchParams(location.search).get('id');const {data:app}=db?await db.from('apps').select('*').eq('id',id).maybeSingle():{data:null};const error=document.querySelector('#runner-error');if(!app?.code){error.hidden=false;error.textContent='アプリコードが見つかりません。管理者ページからコードを登録してください。';frame.hidden=true;return}document.title=`${app.title} | Ichijo AI Lab`;document.querySelector('#runner-title').textContent=app.title;frame.srcdoc=app.code}

initCommon();renderPublic();initAdmin();initRunner();
