(function(){
'use strict';
const data=window.LabPhotoData;
if(!data)throw new Error('Photo catalog missing');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function credit(p){return esc(p.credit)+' · <a href="'+esc(p.licenseUrl)+'" target="_blank" rel="noopener">'+esc(p.license==='Public domain'?'Общественное достояние':p.license)+'</a> · <a href="'+esc(p.source)+'" target="_blank" rel="noopener">Источник ↗</a>';}
function card(id,options={}){
 const p=data.photos[id];if(!p)return '';
 const note=options.note||p.compare,heading=options.gallery?'h2':'h4';
 return '<figure class="real-photo'+(options.gallery?' gallery-photo':'')+'" data-photo-id="'+esc(id)+'"'+(options.gallery?' id="photo-'+esc(id)+'" data-photo-chapters="'+p.chapters.join(' ')+'"':'')+'><a class="photo-open" href="'+esc(p.src)+'" data-photo-open="'+esc(id)+'" data-photo-note="'+esc(note)+'" aria-label="Увеличить фото: '+esc(p.title)+'"><img src="'+esc(p.thumb)+'" width="'+p.thumbWidth+'" height="'+p.thumbHeight+'" alt="'+esc(p.alt)+'" loading="lazy" decoding="async"><span>Увеличить фото ↗</span></a><figcaption><p class="photo-kind">'+(options.gallery?'':'В РЕАЛЬНОМ МИРЕ · ')+esc(p.kind)+'</p><'+heading+'>'+esc(p.title)+'</'+heading+'><p>'+esc(p.caption)+'</p><p class="photo-compare">'+esc(note)+'</p><p class="photo-credit">'+credit(p)+'<br>Полный кадр · уменьшено, JPEG.</p></figcaption></figure>';
}
function cardFor(model){const entry=data.models[model];return entry?card(entry.photo,{note:entry.note}):'';}
function galleryHTML(){return Object.keys(data.photos).map(id=>{
 const p=data.photos[id];
 const links=Object.entries(data.models).filter(([,m])=>m.photo===id).map(([model,m])=>'<a href="index.html#chapter-'+m.chapter+'-model-'+esc(model)+'">'+esc(m.label)+' · гл. '+m.chapter+' →</a>');
 if(id==='earth')links.push('<a href="life-universe.html#planets">Сохранённая модель планет →</a>');
 if(id==='sun')links.push('<a href="life-universe.html#stars">Сохранённая модель звёзд →</a>');
 return '<div class="gallery-item" data-gallery-chapters="'+p.chapters.join(' ')+'">'+card(id,{gallery:true})+'<div class="photo-model-links">'+links.join('')+'</div></div>';
}).join('');}
window.LabPhotos=Object.freeze({card,cardFor,galleryHTML});
if(typeof document==='undefined')return;
let dialog=null;
function showPhoto(id,note){
 const p=data.photos[id];if(!p||!('HTMLDialogElement' in window))return false;
 if(!dialog){
  dialog=document.createElement('dialog');dialog.className='photo-dialog';dialog.setAttribute('aria-labelledby','photo-dialog-title');
  document.body.append(dialog);
  dialog.addEventListener('close',()=>document.documentElement.classList.remove('photo-modal-open'));
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 }
 dialog.innerHTML='<div class="photo-dialog-bar"><span>Наблюдение и модель</span><button type="button" data-photo-close aria-label="Закрыть фотографию" autofocus>Закрыть ×</button></div><figure><img src="'+esc(p.src)+'" width="'+p.width+'" height="'+p.height+'" alt="'+esc(p.alt)+'"><figcaption><p class="photo-kind">'+esc(p.kind)+'</p><h2 id="photo-dialog-title">'+esc(p.title)+'</h2><p>'+esc(p.caption)+'</p><p class="photo-compare">'+esc(note||p.compare)+'</p><p class="photo-credit">'+credit(p)+'</p><p class="photo-credit">Уменьшенная копия полного кадра; повторное кодирование JPEG. <a href="'+esc(p.src)+'" target="_blank" rel="noopener">Открыть изображение отдельно ↗</a>'+(p.reference?' · <a href="'+esc(p.reference)+'" target="_blank" rel="noopener">Научный источник ↗</a>':'')+'</p></figcaption></figure>';
 dialog.querySelector('[data-photo-close]').onclick=()=>dialog.close();
 dialog.showModal();dialog.scrollTop=0;document.documentElement.classList.add('photo-modal-open');return true;
}
document.addEventListener('click',e=>{
 const link=e.target.closest?.('a[data-photo-open]');
 if(!link||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 if(showPhoto(link.dataset.photoOpen,link.dataset.photoNote))e.preventDefault();
});
// Broken local images retain a working link to the original source.
document.addEventListener('error',e=>{
 if(e.target.tagName!=='IMG'||!e.target.closest('.real-photo,.photo-dialog'))return;
 const img=e.target;if(img.dataset.photoFailed)return;img.dataset.photoFailed='true';
 const message=document.createElement('p');message.className='photo-load-error';message.setAttribute('role','status');message.textContent='Изображение не загрузилось. Откройте источник по ссылке в подписи.';img.after(message);
},true);
function init(){
 document.querySelectorAll('[data-photo-model]').forEach(el=>el.innerHTML=cardFor(el.dataset.photoModel));
 document.querySelectorAll('[data-photo-single]').forEach(el=>el.innerHTML=card(el.dataset.photoSingle));
 const filter=document.querySelector('.photo-filters');if(!filter)return;
 const items=Array.from(document.querySelectorAll('.gallery-item')),count=document.getElementById('photo-count');
 function apply(value){
  let visible=0;items.forEach(el=>{el.hidden=value!=='all'&&!el.dataset.galleryChapters.split(' ').includes(value);if(!el.hidden)visible++;});
  filter.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.photoFilter===value)));
  count.textContent='Показано '+visible+' из '+items.length+' снимков';
 }
 filter.addEventListener('click',e=>{const b=e.target.closest('button[data-photo-filter]');if(b){const value=b.dataset.photoFilter;apply(value);const url=new URL(location.href);if(value==='all')url.searchParams.delete('chapter');else url.searchParams.set('chapter',value);history.replaceState(null,'',url);}});
 const initial=new URLSearchParams(location.search).get('chapter');apply(/^[0-6]$/.test(initial)?initial:'all');
}
window.addEventListener('hashchange',()=>{if(dialog?.open)dialog.close();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
