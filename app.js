
/* v1.9 — searchable cooking methods */
const COOKING_METHODS = [
  {key:"ugn", label:"Ugn", terms:["ugn","ugnsbaka","ugnsbakad","ugnsbakas","i ugnen","stek i ugn","baka i ugn","rosta i ugn"]},
  {key:"fritera", label:"Fritera", terms:["fritera","friteras","friterad","fritering","deep fry","deep-fry","deepfry"]},
  {key:"steka", label:"Steka", terms:["stek","steka","stekes","stekas","stekt","stekning","stekpanna","fräs","fräsa","fräses","fräst"]},
  {key:"koka", label:"Koka", terms:["koka","kokas","kokt","kokning","koka upp","kokar"]},
  {key:"sjuda", label:"Sjuda", terms:["sjud","sjuda","sjuder","sjudas","sjudning"]},
  {key:"grilla", label:"Grilla", terms:["grilla","grillas","grillad","grillning","grill"]},
  {key:"baka", label:"Baka", terms:["baka","bakas","bakad","bakning"]},
  {key:"ånga", label:"Ånga", terms:["ånga","ångas","ångkok","ångkoka","ångkokt"]},
  {key:"rosta", label:"Rosta", terms:["rosta","rostas","rostad","rostning"]},
  {key:"woka", label:"Woka", terms:["woka","wokas","wokad","wokning","wok"]},
  {key:"airfryer", label:"Airfryer", terms:["airfryer","air fryer","varmluftsfritös","varmluftsfritös","varmluftsfritera"]},
  {key:"mikro", label:"Mikro", terms:["mikro","mikrovågsugn","mikrovågsugnen","mikra","mikras"]},
  {key:"gratinera", label:"Gratinera", terms:["gratinera","gratineras","gratinerad","gratinering"]},
  {key:"pochera", label:"Pochera", terms:["pochera","pocheras","pocherad","pochering"]}
];

function normalizeCookingSearch(s=""){
  return s.toLocaleLowerCase("sv-SE")
    .replace(/å/g,"a").replace(/ä/g,"a").replace(/ö/g,"o")
    .replace(/[^a-z0-9\s-]/g," ");
}
function extractCookingMethods(text=""){
  const n = " " + normalizeCookingSearch(text) + " ";
  const found = [];
  for (const method of COOKING_METHODS) {
    if (method.terms.some(term => {
      const t = normalizeCookingSearch(term).trim().replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\s+/g,"\\s+");
      return new RegExp("(^|[^a-z0-9])" + t + "([^a-z0-9]|$)", "i").test(n);
    })) found.push(method.key);
  }
  return found;
}
function recipeCookingMethods(recipe){
  if (Array.isArray(recipe?.cookingMethods)) return recipe.cookingMethods;
  return extractCookingMethods([
    recipe?.name || "", recipe?.ingredients || "",
    recipe?.instructions || ""
  ].join("\n"));
}
function cookingMethodLabels(keys=[]){
  return [...new Set(keys)].map(k => COOKING_METHODS.find(m=>m.key===k)?.label || k);
}


const DB_NAME = "recipe-vault";
const DB_VERSION = 1;
const STORE = "recipes";
let db, editingId = null, viewingId = null, activeFilter = "all";
const APP_NAME_KEY = "recipe-vault-app-name";

const $ = id => document.getElementById(id);
const els = {
  list:$('list'), empty:$('empty'), search:$('search'), editor:$('editor'), form:$('recipeForm'),
  title:$('title'), recipeType:$('recipeType'), ingredientsEditor:$('ingredientsEditor'), instructionsEditor:$('instructionsEditor'), notesEditor:$('notesEditor'),
  deleteBtn:$('deleteBtn'), editorTitle:$('editorTitle'), toast:$('toast'), fileInput:$('fileInput'),
  backupDialog:$('backupDialog'), backupClose:$('backupClose'), viewer:$('viewer'), viewerTitle:$('viewerTitle'), viewerType:$('viewerType'),
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
function htmlToText(html){
  const d=document.createElement('div'); d.innerHTML=html||'';
  const blocks=new Set(['DIV','P','H1','H2','H3','H4','H5','H6','LI','BR']);
  function walk(node){
    if(node.nodeType===3) return node.nodeValue||'';
    if(node.nodeType!==1) return '';
    const tag=node.tagName.toUpperCase();
    let out='';
    node.childNodes.forEach(c=>out+=walk(c));
    if(blocks.has(tag)) out+='\n';
    return out;
  }
  return walk(d).replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

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
function openEditor(r=null){
  editingId=r?.id||null; els.editorTitle.textContent=r?'Redigera recept':'Nytt recept'; els.title.value=r?.title||''; els.recipeType.value=r?.type||'måltid';
  setEditorHtml(els.ingredientsEditor,r?.ingredients||''); setEditorHtml(els.instructionsEditor,r?.instructions||''); setEditorHtml(els.notesEditor,r?.notes||'');
  els.deleteBtn.classList.toggle('hidden',!r); els.editor.showModal();
  setTimeout(()=>els.title.focus(),50);
}
function closeEditor(){els.editor.close();editingId=null;}
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

els.newBtn.onclick=()=>openEditor(null); els.emptyNew.onclick=()=>openEditor(null); els.viewerClose.onclick=closeViewer;
els.viewerEdit.onclick=async()=>{const id=viewingId;closeViewer();if(id){const r=(await allRecipes()).find(x=>x.id===id);if(r)openEditor(r,false);}};
els.closeBtn.onclick=closeEditor;els.cancelBtn.onclick=closeEditor;els.form.onsubmit=e=>{e.preventDefault();saveCurrent()};
els.deleteBtn.onclick=async()=>{if(editingId&&confirm('Radera receptet?')){await deleteRecipe(editingId);closeEditor();render();toast('Recept raderat');}};
els.search.oninput=render;
document.querySelectorAll('.filter-btn').forEach(btn=>btn.onclick=()=>{activeFilter=btn.dataset.filter;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b===btn));render();});
els.menuBtn.onclick=()=>{loadAppName();els.backupDialog.showModal();};els.saveAppName.onclick=saveAppName;els.backupClose.onclick=()=>els.backupDialog.close();
els.exportBtn.onclick=async()=>{await exportJSON();els.backupDialog.close();};els.importBtn.onclick=()=>els.fileInput.click();els.fileInput.onchange=()=>{if(els.fileInput.files[0]){importJSON(els.fileInput.files[0]);els.backupDialog.close();}els.fileInput.value='';};

document.querySelectorAll('.toolbar').forEach(toolbar=>toolbar.addEventListener('mousedown',e=>e.preventDefault()));
document.querySelectorAll('.toolbar button').forEach(btn=>btn.addEventListener('click',()=>{const target=$(btn.closest('.toolbar').dataset.target);target.focus();const cmd=btn.dataset.cmd;document.execCommand(cmd,false,btn.dataset.value||null);}));

(async()=>{loadAppName();try{await openDB();await render();}catch(e){console.error(e);alert('Din webbläsare stöder inte lokal lagring för appen.');}
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js?v=7',{updateViaCache:'none'}).then(reg=>{const check=()=>reg.update().catch(()=>{});check();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;window.location.reload();});}).catch(console.error);}})();

/* v1.8 safe JSON sharing */
const RV8_FORMAT="recipe-vault", RV8_VERSION=2;
let rv8PendingImport=null, rv8SelectedIds=new Set();

function rv8Stamp(){const d=new Date(),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;}
function rv8GetAll(){return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readonly"),q=tx.objectStore(STORE).getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}
function rv8Open(){const d=document.getElementById("sharingDialog");if(d)d.showModal();}
function rv8Close(){const d=document.getElementById("sharingDialog");if(d?.open)d.close();rv8PendingImport=null;}
function rv8Fingerprint(r){return [r.title,r.ingredients,r.instructions].map(x=>String(x||"").replace(/\s+/g," ").trim().toLocaleLowerCase("sv-SE")).join("|");}
function rv8Package(rs,type){return {format:RV8_FORMAT,version:RV8_VERSION,fileType:type,exportedAt:new Date().toISOString(),source:"Receptvalvet",recipes:rs};}
function rv8Send(blob,name){
  const f=new File([blob],name,{type:"application/json"});
  if(navigator.share && navigator.canShare?.({files:[f]})){navigator.share({title:"Receptvalvet",text:"Recept från Receptvalvet",files:[f]}).catch(()=>{});return;}
  const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
async function rv8Share(){
  const rs=await rv8GetAll(),scope=document.getElementById("shareScope").value;
  let chosen=rs;
  if(scope==="meal")chosen=rs.filter(r=>r.type==="meal");
  if(scope==="dessert")chosen=rs.filter(r=>r.type==="dessert");
  if(scope==="selected")chosen=rs.filter(r=>rv8SelectedIds.has(String(r.id)));
  if(!chosen.length){alert(scope==="selected"?"Välj minst ett recept.":"Det finns inga recept i detta urval.");return;}
  const blob=new Blob([JSON.stringify(rv8Package(chosen,"transfer"),null,2)],{type:"application/json"});
  rv8Send(blob,`Receptvalvet_${rv8Stamp()}_${chosen.length}recept.json`);
}
async function rv8Preview(file){
  let data;try{data=JSON.parse(await file.text());}catch{alert("Filen kunde inte läsas som JSON.");return;}
  const rs=Array.isArray(data)?data:data?.recipes;
  if(!Array.isArray(rs)){alert("Det här är inte en giltig Receptvalvet-fil.");return;}
  const local=await rv8GetAll(),byId=new Map(local.map(r=>[String(r.id),r])),byFp=new Map(local.map(r=>[rv8Fingerprint(r),r]));
  let n=0,u=0,d=0;
  rs.forEach(r=>{const same=byId.get(String(r.id)),fp=byFp.get(rv8Fingerprint(r));if(same){const it=Date.parse(r.modified||r.created||"")||0,lt=Date.parse(same.modified||same.created||"")||0;it>lt?u++:d++;}else if(fp)d++;else n++;});
  rv8PendingImport={rs,byId,byFp};
  document.getElementById("importPreview").innerHTML=`<div class="import-summary"><strong>Receptvalvet-fil hittad</strong><div class="import-stats"><span>🆕 ${n} nya</span><span>↻ ${u} nyare</span><span>✓ ${d} redan finns</span></div><p>Importen skriver inte över en nyare lokal version automatiskt.</p></div>`;
  document.getElementById("importPreview").hidden=false;document.getElementById("importActions").hidden=false;
  document.getElementById("importConfirmBtn").textContent=`Importera ${n+u} recept`;
}
async function rv8Import(asNew=false){
  if(!rv8PendingImport)return;const {rs,byId,byFp}=rv8PendingImport;let added=0,updated=0,skipped=0;
  const tx=db.transaction(STORE,"readwrite"),st=tx.objectStore(STORE);
  for(const original of rs){const r=JSON.parse(JSON.stringify(original));
    if(asNew){r.id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;r.created=new Date().toISOString();r.modified=r.created;st.put(r);added++;continue;}
    const same=byId.get(String(r.id)),fp=byFp.get(rv8Fingerprint(r));
    if(same){const it=Date.parse(r.modified||r.created||"")||0,lt=Date.parse(same.modified||same.created||"")||0;if(it>lt){st.put(r);updated++;}else skipped++;}
    else if(fp)skipped++;else{if(!r.id)r.id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;st.put(r);added++;}
  }
  await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);});
  rv8PendingImport=null;document.getElementById("importPreview").hidden=true;document.getElementById("importActions").hidden=true;
  if(typeof render==="function")render();alert(`Import klar.\n\n${added} nya recept\n${updated} uppdaterade\n${skipped} hoppades över`);
}
function rv8Wire(){
  document.getElementById("sharingClose")?.addEventListener("click",rv8Close);
  document.getElementById("shareRecipesBtn")?.addEventListener("click",()=>{document.getElementById("shareOptions").hidden=false;});
  document.getElementById("createShareFileBtn")?.addEventListener("click",rv8Share);
  document.getElementById("receiveRecipesBtn")?.addEventListener("click",()=>document.getElementById("importFileInput").click());
  document.getElementById("importFileInput")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)rv8Preview(f);e.target.value="";});
  document.getElementById("importConfirmBtn")?.addEventListener("click",()=>rv8Import(false));
  document.getElementById("importAsNewBtn")?.addEventListener("click",()=>rv8Import(true));
  document.getElementById("importCancelBtn")?.addEventListener("click",()=>{document.getElementById("importPreview").hidden=true;document.getElementById("importActions").hidden=true;rv8PendingImport=null;});
  const menu=document.getElementById("menuBtn");
  if(menu&&!document.getElementById("rv8SharingOpenBtn")){
    const b=document.createElement("button");b.id="rv8SharingOpenBtn";b.type="button";b.className="icon-btn";b.title="Dela & ta emot recept";b.setAttribute("aria-label","Dela & ta emot recept");b.textContent="⇄";menu.parentElement?.insertBefore(b,menu.nextSibling);b.addEventListener("click",rv8Open);
  }
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(rv8Wire,0));