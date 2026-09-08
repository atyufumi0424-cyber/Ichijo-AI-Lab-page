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

async function initRunner(){const frame=document.querySelector('#app-frame');if(!frame)return;const id=new URLSearchParams(location.search).get('id');const {data:app}=db?await db.from('apps').select('*').eq('id',id).maybeSingle():{data:null};const error=document.querySelector('#runner-error');if(!app?.code){error.hidden=false;error.textContent='アプリコードが見つかりません。管理者ページからコードを登録してください。';frame.hidden=true;return}document.title=`${app.title} | Ichijo AI Lab`;document.querySelector('#runner-title').textContent=app.title;frame.srcdoc=app.code}

initCommon();renderPublic();initRunner();
