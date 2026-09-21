const config = window.ICHJO_LAB_CONFIG || {};
const db = window.supabase?.createClient(config.supabaseUrl, config.supabasePublishableKey);
const defaultApps = [];
const postContentPrefix = '__ICHJO_POST_V1__:';
const escapeHTML = (value='') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatDate = value => { const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric'}).format(d); };
function makeResponsiveAppDocument(code=''){
  const responsiveHead=`<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style id="ichijo-responsive-app">html,body{max-width:100%;min-width:0;overflow-x:hidden}body{margin:0!important;padding:clamp(8px,3vw,18px)!important}*,*::before,*::after{box-sizing:border-box}img,video,svg,canvas,iframe{max-width:100%!important;height:auto}main,.container,.wrapper,.app,[id*="game"],[class*="game"]{max-width:100%!important}@media(max-width:600px){h1{font-size:clamp(1.5rem,8vw,2.4rem)!important}button,input,select,textarea{max-width:100%;font-size:16px}}</style>`;
  if(/<\/head>/i.test(code))return code.replace(/<\/head>/i,`${responsiveHead}</head>`);
  if(/<body[\s>]/i.test(code))return code.replace(/<body([^>]*)>/i,`${responsiveHead}<body$1>`);
  return `${responsiveHead}${code}`;
}
const parsePostContent = post => {
  if(post.image_url)return {text:post.excerpt||'',image:post.image_url};
  if(!String(post.excerpt||'').startsWith(postContentPrefix))return {text:post.excerpt||'',image:''};
  try{const content=JSON.parse(post.excerpt.slice(postContentPrefix.length));return {text:content.text||'',image:content.image||''}}catch{return {text:post.excerpt||'',image:''}}
};

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
  if(appList){const apps=await getApps();appList.innerHTML=apps.length?apps.map((app,i)=>{const action=app.code?`<a href="runner.html?id=${encodeURIComponent(app.id)}">ブラウザで開く <span>→</span></a>`:app.url?`<a href="${escapeHTML(app.url)}" target="_blank" rel="noopener">アプリを開く <span>↗</span></a>`:'<span class="coming-soon">COMING SOON</span>';return `<article class="project-card accent-${escapeHTML(app.accent||['pink','cyan','yellow','purple'][i%4])} reveal visible"><div class="project-top"><span>${String(i+1).padStart(2,'0')}</span><small>${escapeHTML(app.category)}</small></div><div class="project-visual" aria-hidden="true"><b>${escapeHTML(app.title.slice(0,1))}</b><i></i></div><h3>${escapeHTML(app.title)}</h3><p>${escapeHTML(app.description)}</p>${action}</article>`}).join(''):'<p class="empty-state">現在、公開中の作品はありません。</p>'}
  const blogList=document.querySelector('#blog-list');
  if(blogList){const posts=await getPosts();blogList.innerHTML=posts.length?posts.map(post=>{const content=parsePostContent(post);return `<a class="blog-card blog-card-link reveal visible" href="blog.html?id=${encodeURIComponent(post.id)}" aria-label="${escapeHTML(post.title)}を読む">${content.image?`<img class="blog-image" src="${escapeHTML(content.image)}" alt="${escapeHTML(post.title)}" loading="lazy">`:''}<div class="blog-card-body"><h3>${escapeHTML(post.title)}</h3><span class="read-more">記事を読む <b>→</b></span></div></a>`}).join(''):'<p class="empty-state">記事はまだありません。最初の活動記録を準備中です。</p>'}
}

async function initBlogDetail(){
  const root=document.querySelector('#blog-detail');if(!root)return;
  const id=new URLSearchParams(location.search).get('id');
  if(!id||!db){root.innerHTML='<p class="article-error">記事を読み込めませんでした。</p>';return}
  const {data:post,error}=await db.from('posts').select('*').eq('id',id).maybeSingle();
  if(error||!post){root.innerHTML='<p class="article-error">記事が見つかりませんでした。</p>';return}
  const content=parsePostContent(post);document.title=`${post.title} | Ichijo AI Lab`;
  root.innerHTML=`<p class="eyebrow">ACTIVITY REPORT</p><time datetime="${escapeHTML(post.published_on)}">${escapeHTML(formatDate(post.published_on))}</time><h1>${escapeHTML(post.title)}</h1>${content.image?`<figure><img src="${escapeHTML(content.image)}" alt="${escapeHTML(post.title)}"></figure>`:''}<div class="article-body"><p>${escapeHTML(content.text).replace(/\n/g,'<br>')}</p></div>`;
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
  const submittedAtJst=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  try{
    const databaseRequest=db?db.from('messages').insert(record):Promise.resolve({error:new Error('接続設定がありません')});
    const emailDestination=config.formSubmitEndpoint||config.notificationEmail;
    const emailRequest=fetch(`https://formsubmit.co/ajax/${encodeURIComponent(emailDestination)}`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({_subject:`【Ichijo AI Lab】${record.kind}を受け付けました`,'送信日時（日本時間）':submittedAtJst,種別:record.kind,お名前:record.name,メールアドレス:record.email,所属:record.organization,依頼の種類:record.request_type,内容:record.message,_template:'table'})}).then(async response=>{const result=await response.json().catch(()=>({}));if(!response.ok||String(result.success)==='false')throw new Error(result.message||'メール通知に失敗しました');return result});
    const [databaseResult,emailResult]=await Promise.allSettled([databaseRequest,emailRequest]);
    const databaseSaved=databaseResult.status==='fulfilled'&&!databaseResult.value.error;
    const emailSent=emailResult.status==='fulfilled';
    if(!databaseSaved&&!emailSent)throw new Error('送信先へ接続できませんでした');
    form.reset();
    status.textContent=databaseSaved&&emailSent?'ありがとうございます。内容を送信しました。':emailSent?'ありがとうございます。メールで内容を送信しました。':'内容を管理者ページに保存しました。メール通知は現在確認中です。';
  }catch(error){console.error(error);status.textContent='送信できませんでした。入力内容を残したまま、時間をおいて再度お試しください。'}finally{button.disabled=false}
}

async function initRunner(){const frame=document.querySelector('#app-frame');if(!frame)return;const id=new URLSearchParams(location.search).get('id');const {data:app}=db?await db.from('apps').select('*').eq('id',id).maybeSingle():{data:null};const error=document.querySelector('#runner-error');if(!app?.code){error.hidden=false;error.textContent='アプリコードが見つかりません。管理者ページからコードを登録してください。';frame.hidden=true;return}document.title=`${app.title} | Ichijo AI Lab`;document.querySelector('#runner-title').textContent=app.title;frame.srcdoc=makeResponsiveAppDocument(app.code)}

initCommon();renderPublic();initBlogDetail();initRunner();
