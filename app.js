const DB_NAME = "recipe-vault";
const DB_VERSION = 1;
const STORE = "recipes";
let db, editingId = null, viewingId = null, activeFilter = "all";
const APP_NAME_KEY = "recipe-vault-app-name";

const $ = id => document.getElementById(id);
const els = {
  list:$('list'), empty:$('empty'), search:$('search'), editor:$('editor'), form:$('recipeForm'),
  title:$('title'), recipeType:$('recipeType'), ingredientsEditor:$('ingredientsEditor'), instructionsEditor:$('instructionsEditor'), notesEditor:$('notesEditor'),
  deleteBtn:$('deleteBtn'), recipePhoto:$('recipePhoto'), ocrBtn:$('ocrBtn'), ocrStatus:$('ocrStatus'), ocrTools:$('ocrTools'), ocrPreview:$('ocrPreview'),
  rotateLeftBtn:$('rotateLeftBtn'), rotateRightBtn:$('rotateRightBtn'), clearPhotoBtn:$('clearPhotoBtn'), ocrReview:$('ocrReview'), ocrReviewForm:$('ocrReviewForm'),
  ocrReviewClose:$('ocrReviewClose'), ocrReviewCancel:$('ocrReviewCancel'), ocrText:$('ocrText'), editorTitle:$('editorTitle'), toast:$('toast'), fileInput:$('fileInput'),
  photoBtn:$('photoBtn'), backupDialog:$('backupDialog'), backupClose:$('backupClose'), viewer:$('viewer'), viewerTitle:$('viewerTitle'), viewerType:$('viewerType'),
  viewerIngredients:$('viewerIngredients'), viewerInstructions:$('viewerInstructions'), viewerNotes:$('viewerNotes'), viewerNotesWrap:$('viewerNotesWrap'), viewerClose:$('viewerClose'), viewerEdit:$('viewerEdit'),
  appName:$('appName'), appNameInput:$('appNameInput'), saveAppName:$('saveAppName'), newBtn:$('newBtn'), emptyNew:$('emptyNew'), closeBtn:$('closeBtn'), cancelBtn:$('cancelBtn'),
  menuBtn:$('menuBtn'), exportBtn:$('exportBtn'), importBtn:$('importBtn')
};

function uid(){ return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+"-"+Math.random().toString(36).slice(2); }
function openDB(){ return new Promise((resolve,reject)=>{ const req=indexedDB.open(DB_NAME,DB_VERSION); req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'}); req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error); }); }
function allRecipes(){ return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}); }
function putRecipe(r){ return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readwrite').objectStore(STORE).put(r);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);}); }
function deleteRecipe(id){ return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);}); }
function normalize(s){ return (s||'').toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function htmlToText(html){ const d=document.createElement('div');d.innerHTML=html||'';return (d.textContent||'').replace(/\u00a0/g,' ').replace(/\n{3,}/g,'\n\n').trim(); }
function legacyToHtml(value){ if(!value)return ''; if(/<\/?[a-z][\s\S]*>/i.test(value)) return sanitizeHtml(value); return value.split(/\n/).map(line=>line.trim()?`<div>${escapeHtml(line)}</div>`:'<div><br></div>').join(''); }
function escapeHtml(s){ const d=document.createElement('div');d.textContent=s||'';return d.innerHTML; }
function sanitizeHtml(html){
  const allowed=['B','STRONG','I','EM','U','H4','P','DIV','BR','UL','OL','LI','SPAN'];
  const src=document.createElement('div');src.innerHTML=html||'';
  const clean=document.createElement('div');
  function walk(node,parent){
    if(node.nodeType===3){parent.appendChild(document.createTextNode(node.nodeValue));return;}
    if(node.nodeType!==1)return;
    const tag=node.tagName.toUpperCase();
    if(!allowed.includes(tag)){ node.childNodes.forEach(c=>walk(c,parent)); return; }
    const el=document.createElement(tag.toLowerCase());
    node.childNodes.forEach(c=>walk(c,el)); parent.appendChild(el);
  }
  src.childNodes.forEach(n=>walk(n,clean));
  return clean.innerHTML;
}
function getEditorHtml(el){ return sanitizeHtml(el.innerHTML).trim(); }
function setEditorHtml(el,value){ el.innerHTML=legacyToHtml(value); }
function editorHasContent(el){ return htmlToText(el.innerHTML).trim().length>0; }

function recipeSearchText(r){ return [r.title,r.type,htmlToText(r.ingredients),htmlToText(r.instructions),htmlToText(r.notes)].join('\n'); }

async function render(){
  const q=normalize(els.search.value); let recipes=await allRecipes();
  recipes.sort((a,b)=>(b.modified||'').localeCompare(a.modified||''));
  if(activeFilter!=='all') recipes=recipes.filter(r=>(r.type||'måltid')===activeFilter);
  if(q) recipes=recipes.filter(r=>normalize(recipeSearchText(r)).includes(q));
  els.list.innerHTML=''; els.empty.classList.toggle('hidden',recipes.length!==0);
  recipes.forEach(r=>{
    const card=document.createElement('article'); card.className='recipe-card';
    const title=document.createElement('h3'); title.textContent=r.title||'Namnlöst recept';
    const type=document.createElement('span'); type.className='recipe-type'; type.textContent=(r.type||'måltid')==='efterrätt'?'Efterrätt':'Måltid';
    const p=document.createElement('p'); p.textContent=[htmlToText(r.ingredients),htmlToText(r.instructions)].filter(Boolean).join('\n\n');
    const meta=document.createElement('div');meta.className='meta';meta.textContent=new Date(r.modified||Date.now()).toLocaleDateString('sv-SE');
    card.append(title,type,p,meta); card.onclick=()=>openViewer(r); els.list.appendChild(card);
  });
}
function openViewer(r){
  viewingId=r?.id||null; els.viewerTitle.textContent=r?.title||'Namnlöst recept';
  const type=r?.type||'måltid'; els.viewerType.textContent=type==='efterrätt'?'Efterrätt':'Måltid'; els.viewerType.classList.remove('hidden');
  els.viewerIngredients.innerHTML=sanitizeHtml(legacyToHtml(r?.ingredients||''))||'—';
  els.viewerInstructions.innerHTML=sanitizeHtml(legacyToHtml(r?.instructions||''))||'—';
  els.viewerNotes.innerHTML=sanitizeHtml(legacyToHtml(r?.notes||'')); els.viewerNotesWrap.classList.toggle('hidden',!r?.notes);
  els.viewer.showModal();
}
function closeViewer(){if(els.viewer.open)els.viewer.close();viewingId=null;}
function openEditor(r=null,startCamera=false){
  editingId=r?.id||null; els.editorTitle.textContent=r?'Redigera recept':'Nytt recept'; els.title.value=r?.title||''; els.recipeType.value=r?.type||'måltid';
  setEditorHtml(els.ingredientsEditor,r?.ingredients||''); setEditorHtml(els.instructionsEditor,r?.instructions||''); setEditorHtml(els.notesEditor,r?.notes||'');
  els.deleteBtn.classList.toggle('hidden',!r); resetOCRPreview(); els.editor.showModal();
  if(startCamera) els.recipePhoto.click(); else setTimeout(()=>els.title.focus(),50);
}
function closeEditor(){els.editor.close();editingId=null;resetOCRPreview();}
function toast(msg){els.toast.textContent=msg;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),2200);}
function loadAppName(){const name=localStorage.getItem(APP_NAME_KEY)||'Recept';els.appName.textContent=name;document.title=name;els.appNameInput.value=name;}
function saveAppName(){const name=els.appNameInput.value.trim()||'Recept';localStorage.setItem(APP_NAME_KEY,name);els.appName.textContent=name;document.title=name;els.appNameInput.value=name;toast('Appnamnet sparat');}

async function saveCurrent(){
  const old=editingId?(await allRecipes()).find(x=>x.id===editingId):null; const now=new Date().toISOString();
  const recipe={id:editingId||uid(),title:els.title.value.trim(),type:els.recipeType.value,ingredients:getEditorHtml(els.ingredientsEditor),instructions:getEditorHtml(els.instructionsEditor),notes:getEditorHtml(els.notesEditor),created:old?.created||now,modified:now};
  if(!recipe.title){toast('Skriv ett namn på receptet');return;} await putRecipe(recipe);closeEditor();await render();toast('Recept sparat');
}
async function exportJSON(){const recipes=await allRecipes();const payload={format:'recipe-vault',version:2,exportedAt:new Date().toISOString(),recipes};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`recept-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast('Backup skapad');}
async function importJSON(file){try{const data=JSON.parse(await file.text()),incoming=Array.isArray(data)?data:data.recipes;if(!Array.isArray(incoming))throw new Error('Ogiltig fil');let count=0;for(const r of incoming){if(!r||typeof r!=='object'||!r.id)continue;await putRecipe({id:String(r.id),title:String(r.title||''),type:r.type==='efterrätt'?'efterrätt':'måltid',ingredients:String(r.ingredients||''),instructions:String(r.instructions||''),notes:String(r.notes||''),created:r.created||new Date().toISOString(),modified:r.modified||r.created||new Date().toISOString()});count++;}await render();toast(`${count} recept importerade`);}catch(e){console.error(e);alert('Kunde inte importera filen. Kontrollera att det är en Recipe Vault JSON-backup.');}}

els.newBtn.onclick=()=>openEditor(null,true); els.emptyNew.onclick=()=>openEditor(null,true); els.viewerClose.onclick=closeViewer;
els.viewerEdit.onclick=async()=>{const id=viewingId;closeViewer();if(id){const r=(await allRecipes()).find(x=>x.id===id);if(r)openEditor(r,false);}};
els.closeBtn.onclick=closeEditor;els.cancelBtn.onclick=closeEditor;els.form.onsubmit=e=>{e.preventDefault();saveCurrent()};
els.deleteBtn.onclick=async()=>{if(editingId&&confirm('Radera receptet?')){await deleteRecipe(editingId);closeEditor();render();toast('Recept raderat');}};
els.search.oninput=render;
document.querySelectorAll('.filter-btn').forEach(btn=>btn.onclick=()=>{activeFilter=btn.dataset.filter;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b===btn));render();});
els.photoBtn.onclick=()=>els.recipePhoto.click();els.menuBtn.onclick=()=>{loadAppName();els.backupDialog.showModal();};els.saveAppName.onclick=saveAppName;els.backupClose.onclick=()=>els.backupDialog.close();
els.exportBtn.onclick=async()=>{await exportJSON();els.backupDialog.close();};els.importBtn.onclick=()=>els.fileInput.click();els.fileInput.onchange=()=>{if(els.fileInput.files[0]){importJSON(els.fileInput.files[0]);els.backupDialog.close();}els.fileInput.value='';};

document.querySelectorAll('.toolbar').forEach(toolbar=>toolbar.addEventListener('mousedown',e=>e.preventDefault()));
document.querySelectorAll('.toolbar button').forEach(btn=>btn.addEventListener('click',()=>{const target=$(btn.closest('.toolbar').dataset.target);target.focus();const cmd=btn.dataset.cmd;document.execCommand(cmd,false,btn.dataset.value||null);}));

(async()=>{loadAppName();try{await openDB();await render();}catch(e){console.error(e);alert('Din webbläsare stöder inte lokal lagring för appen.');}
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js?v=6',{updateViaCache:'none'}).then(reg=>{const check=()=>reg.update().catch(()=>{});check();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;window.location.reload();});}).catch(console.error);}})();

let ocrImageUrl=null,ocrImageRotation=0;
function resetOCRPreview(){if(ocrImageUrl)URL.revokeObjectURL(ocrImageUrl);ocrImageUrl=null;els.recipePhoto.value='';els.ocrPreview.removeAttribute('src');els.ocrTools.classList.add('hidden');els.ocrStatus.textContent='Ta ett tydligt foto. Rak bild och bra ljus ger bäst resultat.';ocrImageRotation=0;}
els.recipePhoto.onchange=()=>{const file=els.recipePhoto.files[0];if(!file)return;if(ocrImageUrl)URL.revokeObjectURL(ocrImageUrl);ocrImageUrl=URL.createObjectURL(file);els.ocrPreview.src=ocrImageUrl;els.ocrPreview.style.transform='rotate(0deg)';els.ocrTools.classList.remove('hidden');ocrImageRotation=0;els.ocrStatus.textContent='Foto klart. Rotera vid behov och tryck sedan Läs text.';};
els.rotateLeftBtn.onclick=()=>{ocrImageRotation=(ocrImageRotation-90+360)%360;els.ocrPreview.style.transform=`rotate(${ocrImageRotation}deg)`};els.rotateRightBtn.onclick=()=>{ocrImageRotation=(ocrImageRotation+90)%360;els.ocrPreview.style.transform=`rotate(${ocrImageRotation}deg)`};els.clearPhotoBtn.onclick=resetOCRPreview;
async function makeOCRImage(file,rotation){const bitmap=await createImageBitmap(file);const scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));const swap=rotation%180!==0;const w=Math.round((swap?bitmap.height:bitmap.width)*scale),h=Math.round((swap?bitmap.width:bitmap.height)*scale);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.translate(w/2,h/2);ctx.rotate(rotation*Math.PI/180);ctx.drawImage(bitmap,-bitmap.width*scale/2,-bitmap.height*scale/2,bitmap.width*scale,bitmap.height*scale);bitmap.close();
const image=ctx.getImageData(0,0,w,h),d=image.data;for(let i=0;i<d.length;i+=4){const y=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];const boosted=Math.max(0,Math.min(255,(y-128)*1.45+128));d[i]=d[i+1]=d[i+2]=boosted;}ctx.putImageData(image,0,0);return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));}
function ocrToHtml(text){const lines=text.split(/\n/).map(s=>s.trim()).filter((s,i,a)=>s||i===0);let html='';for(const line of lines){if(!line){html+='<div><br></div>';continue;}if(/^\d+[.)]\s+/.test(line)){html+=`<div>${escapeHtml(line)}</div>`;continue;}if(/^(ingredienser|ingredienser:|gör så här|gör sa här|tillagning|instruktioner|så här gör du)\s*:?$/i.test(line)||(/^[A-ZÅÄÖ0-9][A-ZÅÄÖ0-9 \-]{4,}$/.test(line)&&line.length<45)){html+=`<h4>${escapeHtml(line.replace(/:$/,''))}</h4>`;continue;}if(/^[-•–]\s+/.test(line)){html+=`<div>• ${escapeHtml(line.replace(/^[-•–]\s+/,''))}</div>`;continue;}html+=`<div>${escapeHtml(line)}</div>`;}return html;}
els.ocrBtn.onclick=async()=>{const file=els.recipePhoto.files[0];if(!file){toast('Välj först ett foto');return;}if(!window.Tesseract){alert('OCR-motorn kunde inte laddas. Öppna appen med internet första gången.');return;}els.ocrBtn.disabled=true;els.ocrStatus.textContent='Förbättrar bilden…';try{const prepared=await makeOCRImage(file,ocrImageRotation);const worker=await Tesseract.createWorker('swe',1,{logger:m=>{if(m.status&&typeof m.progress==='number')els.ocrStatus.textContent=`${m.status} ${Math.round(m.progress*100)}%`}});await worker.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1'});const result=await worker.recognize(prepared);await worker.terminate();const text=(result.data.text||'').replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();if(!text)throw new Error('Ingen text hittades');els.ocrText.value=text;els.ocrReview.showModal();els.ocrStatus.textContent='Text uppläst. Kontrollera den innan du använder den.';}catch(e){console.error(e);els.ocrStatus.textContent='OCR misslyckades.';alert('OCR kunde inte läsa bilden. Försök med ett skarpare, rakare foto och bättre ljus.');}finally{els.ocrBtn.disabled=false;}};
function closeOCRReview(){if(els.ocrReview.open)els.ocrReview.close();}els.ocrReviewClose.onclick=closeOCRReview;els.ocrReviewCancel.onclick=closeOCRReview;
els.ocrReviewForm.onsubmit=e=>{e.preventDefault();const text=els.ocrText.value.trim();if(!text)return;const html=ocrToHtml(text);const existing=getEditorHtml(els.instructionsEditor);els.instructionsEditor.innerHTML=existing?existing+`<div><br></div>`+html:html;closeOCRReview();els.ocrStatus.textContent='OCR-text infogad. Kontrollera texten och spara.';toast('OCR-text infogad');};
