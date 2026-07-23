// ============================================================
// AMSAMA STYLE — Admin
// Utilise la vraie lib Supabase (auth + storage).
// Colonnes alignées sur le site : reviews(name,city,rating,message,approved)
// orders(first_name,last_name,email,phone,description,product_name,status)
// messages(name,email,message,is_read) ; products(...)
// ============================================================

const SUPABASE_URL = 'https://lrlnsehmfqyjvfrygcyf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybG5zZWhtZnF5anZmcnlnY3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTg4OTYsImV4cCI6MjA5MTAzNDg5Nn0.QA8lbZS_atYb5iUrqSP2XoW7i0nb38DdvRnJv20no50';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = s => document.querySelector(s);
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(m,e){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);}t.textContent=m;t.classList.toggle('err',!!e);t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}
function money(p){return p==null||p===''?'Sur devis':new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(p);}
function dt(d){return new Date(d).toLocaleString('fr-CA',{dateStyle:'medium',timeStyle:'short'});}
const CAT = {robe:'Robe',boubou:'Boubou',ensemble:'Ensemble',tissu:'Tissu',accessoire:'Accessoire'};

// ---------- AUTH ----------
async function checkAuth(){
  const { data:{ session } } = await sb.auth.getSession();
  if (session){ $('#login').style.display='none'; $('#dash').style.display='block'; loadAll(); }
  else { $('#login').style.display='grid'; $('#dash').style.display='none'; }
}
$('#login-form').addEventListener('submit', async e=>{
  e.preventDefault();
  const f = e.target, err = $('#login-err'); err.style.display='none';
  const { error } = await sb.auth.signInWithPassword({ email:f.email.value, password:f.password.value });
  if (error){ err.textContent='Email ou mot de passe incorrect.'; err.style.display='block'; return; }
  checkAuth();
});
$('#logout').addEventListener('click', async ()=>{ await sb.auth.signOut(); checkAuth(); });

// ---------- ONGLETS ----------
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); $('#p-'+t.dataset.tab).classList.add('active');
}));

function loadAll(){ loadProducts(); loadOrders(); loadMessages(); loadReviews(); loadContent(); loadServicesAdmin(); loadTrendsAdmin(); }

// ---------- PRODUITS ----------
let _prodFilter='all', _prods=[];
document.querySelectorAll('.filt').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filt').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); _prodFilter=b.dataset.f; renderProds();
}));

async function loadProducts(){
  const { data, error } = await sb.from('products').select('*').order('sort_order');
  if (error){ $('#prod-grid').innerHTML=`<p class="empty">${esc(error.message)}</p>`; return; }
  _prods = data||[]; renderProds();
}
function renderProds(){
  const g=$('#prod-grid');
  const list=_prodFilter==='all'?_prods:_prods.filter(p=>p.category===_prodFilter);
  if(!list.length){g.innerHTML='<p class="empty">Aucun article.</p>';return;}
  g.innerHTML=list.map(p=>`
    <div class="pcard">
      <img src="${esc(p.image||'')}" alt="${esc(p.name_fr)}">
      <div class="b">
        <span class="cat">${esc(CAT[p.category]||p.category)}</span>
        <h4>${esc(p.name_fr)}</h4>
        <span class="pr">${money(p.price)}${esc(p.unit||'')}</span>
        <span class="chip ${p.published?'on':'off'}">${p.published?'Visible':'Masqué'}</span>
        <div class="acts">
          <button class="btn btn-outline btn-sm" onclick='openProduct(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Modifier</button>
          <button class="btn btn-danger btn-sm" onclick="delProduct('${p.id}')">Suppr.</button>
        </div>
      </div>
    </div>`).join('');
}

const modal=$('#modal'), pForm=$('#prod-form'), prev=$('#prev');
function openProduct(p){
  pForm.reset(); prev.style.display='none';
  $('#modal-title').textContent = p?'Modifier l\'article':'Ajouter un article';
  if(p){
    pForm.id.value=p.id;
    pForm.name_fr.value=p.name_fr||''; pForm.name_en.value=p.name_en||'';
    pForm.category.value=p.category||'robe'; pForm.unit.value=p.unit||'';
    pForm.badge_fr.value=p.badge_fr||''; pForm.badge_en.value=p.badge_en||'';
    pForm.price.value=p.price??''; pForm.old_price.value=p.old_price??'';
    pForm.sort_order.value=p.sort_order??0; pForm.image_url.value=p.image||'';
    pForm.published.checked=!!p.published;
    if(p.image){prev.src=p.image;prev.style.display='block';}
  } else pForm.id.value='';
  modal.classList.add('open');
}
window.openProduct=openProduct;
function closeModal(){modal.classList.remove('open');}
window.closeModal=closeModal;

$('#prod-file').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f)return;
  prev.src=URL.createObjectURL(f); prev.style.display='block';
});

async function uploadImage(file){
  const ext=file.name.split('.').pop().toLowerCase();
  const name=`prod-${Date.now()}.${ext}`;
  const { error }=await sb.storage.from('product-images').upload(name,file,{upsert:true});
  if(error) throw error;
  return sb.storage.from('product-images').getPublicUrl(name).data.publicUrl;
}

pForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const file=$('#prod-file').files[0];
  let image_url=pForm.image_url.value.trim();
  try{
    if(file) image_url=await uploadImage(file);
    const payload={
      name_fr:pForm.name_fr.value.trim(),
      name_en:pForm.name_en.value.trim()||null,
      category:pForm.category.value,
      badge_fr:pForm.badge_fr.value.trim()||null,
      badge_en:pForm.badge_en.value.trim()||null,
      unit:pForm.unit.value.trim()||'',
      price:pForm.price.value===''?null:Number(pForm.price.value),
      old_price:pForm.old_price.value===''?null:Number(pForm.old_price.value),
      sort_order:Number(pForm.sort_order.value||0),
      image:image_url||null,
      published:pForm.published.checked,
      updated_at:new Date().toISOString()
    };
    const res=pForm.id.value
      ? await sb.from('products').update(payload).eq('id',pForm.id.value)
      : await sb.from('products').insert(payload);
    if(res.error) throw res.error;
    toast('Article enregistré'); closeModal(); loadProducts();
  }catch(err){ toast('Erreur : '+err.message,true); }
});

async function delProduct(id){
  if(!confirm('Supprimer cet article ?'))return;
  const { error }=await sb.from('products').delete().eq('id',id);
  if(error)return toast('Erreur',true);
  toast('Supprimé'); loadProducts();
}
window.delProduct=delProduct;

// ---------- COMMANDES ----------
async function loadOrders(){
  const { data, error }=await sb.from('orders').select('*').order('created_at',{ascending:false});
  const w=$('#order-list'); if(error){w.innerHTML=`<p class="empty">${esc(error.message)}</p>`;return;}
  const nb=data.filter(o=>o.status==='nouvelle').length; $('#b-orders').textContent=nb||'';
  if(!data.length){w.innerHTML='<p class="empty">Aucune commande.</p>';return;}
  const st=['nouvelle','en_cours','terminee','annulee'];
  w.innerHTML=data.map(o=>`
    <div class="item ${o.status==='nouvelle'?'new':''}">
      <div class="meta">${dt(o.created_at)}</div>
      <strong>${esc(o.first_name||'')} ${esc(o.last_name||'')}</strong>
      ${o.product_name?` — <em>${esc(o.product_name)}</em>`:''}
      <p>${esc(o.description||'')}</p>
      <div class="meta">${o.phone?'📞 '+esc(o.phone)+'  ':''}${o.email?'✉️ '+esc(o.email):''}</div>
      <div class="acts">
        <select onchange="setOrderStatus('${o.id}',this.value)">
          ${st.map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
        ${o.phone?`<a class="btn btn-ok btn-sm" target="_blank" href="https://wa.me/${esc(o.phone.replace(/\D/g,''))}">WhatsApp</a>`:''}
        <button class="btn btn-danger btn-sm" onclick="delRow('orders','${o.id}',loadOrders)">Suppr.</button>
      </div>
    </div>`).join('');
}
async function setOrderStatus(id,status){await sb.from('orders').update({status}).eq('id',id);toast('Statut mis à jour');loadOrders();}
window.setOrderStatus=setOrderStatus;

// ---------- MESSAGES ----------
async function loadMessages(){
  const { data, error }=await sb.from('messages').select('*').order('created_at',{ascending:false});
  const w=$('#msg-list'); if(error){w.innerHTML=`<p class="empty">${esc(error.message)}</p>`;return;}
  const nb=data.filter(m=>!m.is_read).length; $('#b-messages').textContent=nb||'';
  if(!data.length){w.innerHTML='<p class="empty">Aucun message.</p>';return;}
  w.innerHTML=data.map(m=>`
    <div class="item ${m.is_read?'':'new'}">
      <div class="meta">${dt(m.created_at)}</div>
      <strong>${esc(m.name)}</strong>
      <div class="meta">${m.email?'✉️ '+esc(m.email):''}</div>
      <p>${esc(m.message)}</p>
      <div class="acts">
        ${m.is_read?'':`<button class="btn btn-ok btn-sm" onclick="markRead('${m.id}')">Marquer lu</button>`}
        <button class="btn btn-danger btn-sm" onclick="delRow('messages','${m.id}',loadMessages)">Suppr.</button>
      </div>
    </div>`).join('');
}
async function markRead(id){await sb.from('messages').update({is_read:true}).eq('id',id);loadMessages();}
window.markRead=markRead;

// ---------- AVIS ----------
async function loadReviews(){
  const { data, error }=await sb.from('reviews').select('*').order('created_at',{ascending:false});
  const w=$('#rev-list'); if(error){w.innerHTML=`<p class="empty">${esc(error.message)}</p>`;return;}
  const nb=data.filter(r=>!r.approved).length; $('#b-reviews').textContent=nb||'';
  if(!data.length){w.innerHTML='<p class="empty">Aucun avis.</p>';return;}
  w.innerHTML=data.map(r=>`
    <div class="item ${r.approved?'':'new'}">
      <div class="meta">${dt(r.created_at)}</div>
      <div style="color:var(--gold-dark);letter-spacing:3px">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <strong>${esc(r.name)}</strong> <span class="meta">${esc(r.city||'')}</span>
      <p style="font-style:italic;color:var(--terre)">Avis original : "${esc(r.message||'')}"</p>
      <label>Version française</label>
      <textarea id="rev-fr-${r.id}" rows="2">${esc(r.message_fr||r.message||'')}</textarea>
      <label>Version anglaise (English)</label>
      <textarea id="rev-en-${r.id}" rows="2">${esc(r.message_en||'')}</textarea>
      <div class="acts">
        <button class="btn btn-sm" onclick="saveReviewTranslation('${r.id}')">💾 Enregistrer traductions</button>
        ${r.approved
          ?`<button class="btn btn-outline btn-sm" onclick="approve('${r.id}',false)">Masquer</button>`
          :`<button class="btn btn-ok btn-sm" onclick="approve('${r.id}',true)">Approuver</button>`}
        <button class="btn btn-danger btn-sm" onclick="delRow('reviews','${r.id}',loadReviews)">Suppr.</button>
      </div>
    </div>`).join('');
}
async function saveReviewTranslation(id){
  const fr=document.getElementById('rev-fr-'+id).value.trim();
  const en=document.getElementById('rev-en-'+id).value.trim();
  const { error }=await sb.from('reviews').update({message_fr:fr, message_en:en}).eq('id',id);
  if(error) return toast('Erreur : '+error.message,true);
  toast('Traductions enregistrées ✅');
}
window.saveReviewTranslation=saveReviewTranslation;
async function approve(id,val){await sb.from('reviews').update({approved:val}).eq('id',id);toast(val?'Avis publié':'Avis masqué');loadReviews();}
window.approve=approve;

// ---------- TEXTES ----------
// ---------- TEXTES groupés par section ----------
const GRP_LABELS = {accueil:'🏠 Accueil', apropos:'👤 À propos', contact:'📞 Contact', general:'Divers'};
async function loadContent(){
  const { data, error }=await sb.from('site_content').select('*').order('grp').order('sort');
  const w=$('#content-form'); if(error){w.innerHTML=`<p class="empty">${esc(error.message)}</p>`;return;}
  // grouper par grp
  const groups={};
  (data||[]).forEach(c=>{ (groups[c.grp||'general']=groups[c.grp||'general']||[]).push(c); });
  let html='';
  Object.keys(groups).forEach(g=>{
    html+=`<h3 style="font-family:'Playfair Display',serif;margin:1.5rem 0 .8rem;color:var(--gold-dark)">${GRP_LABELS[g]||g}</h3>`;
    groups[g].forEach(c=>{
      html+=`<label>${esc(c.label||c.key)}</label>
        <textarea data-key="${esc(c.key)}" rows="${(c.value||'').length>60?3:1}">${esc(c.value||'')}</textarea>`;
    });
  });
  html+=`<button class="btn" onclick="saveContent()" style="margin-top:1rem">Enregistrer les textes</button>`;
  w.innerHTML=html;
}
async function saveContent(){
  const rows=[...document.querySelectorAll('#content-form textarea')].map(t=>({key:t.dataset.key,value:t.value,updated_at:new Date().toISOString()}));
  const { error }=await sb.from('site_content').upsert(rows);
  if(error)return toast('Erreur : '+error.message,true);
  toast('Textes enregistrés ✅');
}
window.saveContent=saveContent;

// ---------- SERVICES ----------
async function loadServicesAdmin(){
  const w=$('#services-list'); if(!w) return;
  const { data, error }=await sb.from('services').select('*').order('sort_order');
  if(error){w.innerHTML=`<p class="empty">${esc(error.message)}</p>`;return;}
  w.innerHTML=(data||[]).map(s=>`
    <div class="item">
      <div class="row2">
        <div><label>Icône</label><input value="${esc(s.icon||'')}" onchange="updSvc('${s.id}','icon',this.value)"></div>
        <div><label>Prix</label><input value="${esc(s.price||'')}" onchange="updSvc('${s.id}','price',this.value)"></div>
      </div>
      <label>Titre FR</label><input value="${esc(s.title_fr||'')}" onchange="updSvc('${s.id}','title_fr',this.value)">
      <label>Titre EN</label><input value="${esc(s.title_en||'')}" onchange="updSvc('${s.id}','title_en',this.value)">
      <label>Description FR</label><textarea onchange="updSvc('${s.id}','desc_fr',this.value)">${esc(s.desc_fr||'')}</textarea>
      <label>Description EN</label><textarea onchange="updSvc('${s.id}','desc_en',this.value)">${esc(s.desc_en||'')}</textarea>
      <button class="btn btn-danger btn-sm" onclick="delRow('services','${s.id}',loadServicesAdmin)">Supprimer</button>
    </div>`).join('')+`<button class="btn" onclick="addSvc()">+ Ajouter un service</button>`;
}
async function updSvc(id,field,val){ await sb.from('services').update({[field]:val}).eq('id',id); toast('Service mis à jour'); }
window.updSvc=updSvc;
async function addSvc(){ await sb.from('services').insert({title_fr:'Nouveau service',icon:'✨',sort_order:99}); toast('Service ajouté'); loadServicesAdmin(); }
window.addSvc=addSvc;

// ---------- TRENDS ----------
async function loadTrendsAdmin(){
  const w=$('#trends-list'); if(!w) return;
  const { data, error }=await sb.from('trends').select('*').order('sort_order');
  if(error){w.innerHTML=`<p class="empty">${esc(error.message)}</p>`;return;}
  w.innerHTML=(data||[]).map(t=>`
    <div class="item">
      <label>Titre FR</label><input value="${esc(t.title_fr||'')}" onchange="updTrend('${t.id}','title_fr',this.value)">
      <label>Titre EN</label><input value="${esc(t.title_en||'')}" onchange="updTrend('${t.id}','title_en',this.value)">
      <label>Description FR</label><textarea onchange="updTrend('${t.id}','desc_fr',this.value)">${esc(t.desc_fr||'')}</textarea>
      <label>Description EN</label><textarea onchange="updTrend('${t.id}','desc_en',this.value)">${esc(t.desc_en||'')}</textarea>
      <button class="btn btn-danger btn-sm" onclick="delRow('trends','${t.id}',loadTrendsAdmin)">Supprimer</button>
    </div>`).join('')+`<button class="btn" onclick="addTrend()">+ Ajouter une tendance</button>`;
}
async function updTrend(id,field,val){ await sb.from('trends').update({[field]:val}).eq('id',id); toast('Tendance mise à jour'); }
window.updTrend=updTrend;
async function addTrend(){ await sb.from('trends').insert({title_fr:'Nouvelle tendance',sort_order:99}); toast('Tendance ajoutée'); loadTrendsAdmin(); }
window.addTrend=addTrend;


// ---------- Suppression générique ----------
async function delRow(table,id,reload){
  if(!confirm('Confirmer la suppression ?'))return;
  const { error }=await sb.from(table).delete().eq('id',id);
  if(error)return toast('Erreur',true);
  toast('Supprimé'); reload();
}
window.delRow=delRow;

checkAuth();
