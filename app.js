const DB_NAME = "recipe-vault";
const DB_VERSION = 1;
const STORE = "recipes";
let db, editingId = null, viewingId = null;
const APP_NAME_KEY = "recipe-vault-app-name";

const $ = id => document.getElementById(id);
const els = {
  list:$("list"), empty:$("empty"), search:$("search"), editor:$("editor"),
  form:$("recipeForm"), title:$("title"), ingredients:$("ingredients"),
  instructions:$("instructions"), notes:$("notes"), deleteBtn:$("deleteBtn"), recipePhoto:$("recipePhoto"), ocrBtn:$("ocrBtn"), ocrStatus:$("ocrStatus"), ocrTools:$("ocrTools"), ocrPreview:$("ocrPreview"), rotateLeftBtn:$("rotateLeftBtn"), rotateRightBtn:$("rotateRightBtn"), clearPhotoBtn:$("clearPhotoBtn"), ocrReview:$("ocrReview"), ocrReviewForm:$("ocrReviewForm"), ocrReviewClose:$("ocrReviewClose"), ocrReviewCancel:$("ocrReviewCancel"), ocrText:$("ocrText"),
  editorTitle:$("editorTitle"), toast:$("toast"), fileInput:$("fileInput"), photoBtn:$("photoBtn"), backupDialog:$("backupDialog"), backupClose:$("backupClose"),
  viewer:$("viewer"), viewerTitle:$("viewerTitle"), viewerIngredients:$("viewerIngredients"), viewerInstructions:$("viewerInstructions"), viewerNotes:$("viewerNotes"), viewerNotesWrap:$("viewerNotesWrap"), viewerClose:$("viewerClose"), viewerEdit:$("viewerEdit"),
  appName:$("appName"), appNameInput:$("appNameInput"), saveAppName:$("saveAppName"), newBtn:$("newBtn"), emptyNew:$("emptyNew"), closeBtn:$("closeBtn"), cancelBtn:$("cancelBtn"), menuBtn:$("menuBtn"), exportBtn:$("exportBtn"), importBtn:$("importBtn")
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() :
    Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
}
function openDB() {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:"id"});
    req.onsuccess=()=>{ db=req.result; resolve(db); };
    req.onerror=()=>reject(req.error);
  });
}
function allRecipes() {
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,"readonly").objectStore(STORE).getAll();
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
function putRecipe(recipe) {
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,"readwrite").objectStore(STORE).put(recipe);
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}
function deleteRecipe(id) {
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,"readwrite").objectStore(STORE).delete(id);
    req.onsuccess=()=>resolve(); req.onerror=()=>reject(req.error);
  });
}
function normalize(s){ return (s||"").toLocaleLowerCase("sv-SE").normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

async function render() {
  const q=normalize(els.search.value);
  let recipes=await allRecipes();
  recipes.sort((a,b)=>(b.modified||"").localeCompare(a.modified||""));
  if(q) recipes=recipes.filter(r=>normalize([r.title,r.ingredients,r.instructions,r.notes].join("\n")).includes(q));
  els.list.innerHTML="";
  els.empty.classList.toggle("hidden",recipes.length!==0);
  recipes.forEach(r=>{
    const card=document.createElement("article");
    card.className="recipe-card";
    card.innerHTML=`<h3></h3><p></p><div class="meta"></div>`;
    card.querySelector("h3").textContent=r.title||"Namnlöst recept";
    card.querySelector("p").textContent=[r.ingredients,r.instructions].filter(Boolean).join("\n\n");
    card.querySelector(".meta").textContent=new Date(r.modified).toLocaleDateString("sv-SE");
    card.onclick=()=>openViewer(r);
    els.list.appendChild(card);
  });
}
function openViewer(r){
  viewingId = r?.id || null;
  els.viewerTitle.textContent = r?.title || "Namnlöst recept";
  els.viewerIngredients.textContent = r?.ingredients || "—";
  els.viewerInstructions.textContent = r?.instructions || "—";
  els.viewerNotes.textContent = r?.notes || "";
  els.viewerNotesWrap.classList.toggle("hidden", !r?.notes);
  els.viewer.showModal();
}
function closeViewer(){
  if(els.viewer.open) els.viewer.close();
  viewingId = null;
}

function openEditor(r=null, startCamera=false){
  editingId=r?.id||null;
  els.editorTitle.textContent=r?"Redigera recept":"Nytt recept";
  els.title.value=r?.title||"";
  els.ingredients.value=r?.ingredients||"";
  els.instructions.value=r?.instructions||"";
  els.notes.value=r?.notes||"";
  els.deleteBtn.classList.toggle("hidden",!r);
  resetOCRPreview();
  els.editor.showModal();

  // Keep the camera/file picker directly inside the original user tap.
  // This is more reliable on iPhone than opening it from a delayed callback.
  if(startCamera) {
    els.recipePhoto.click();
  } else {
    setTimeout(()=>els.title.focus(),50);
  }
}
function closeEditor(){ els.editor.close(); editingId=null; resetOCRPreview(); }
function toast(msg){
  els.toast.textContent=msg; els.toast.classList.add("show");
  setTimeout(()=>els.toast.classList.remove("show"),2200);
}
async function saveCurrent(){
  const old=editingId ? (await allRecipes()).find(x=>x.id===editingId) : null;
  const now=new Date().toISOString();
  const recipe={
    id:editingId||uid(), title:els.title.value.trim(),
    ingredients:els.ingredients.value.trim(), instructions:els.instructions.value.trim(),
    notes:els.notes.value.trim(), created:old?.created||now, modified:now
  };
  if(!recipe.title) return;
  await putRecipe(recipe); closeEditor(); await render(); toast("Recept sparat");
}
function loadAppName(){
  const name=localStorage.getItem(APP_NAME_KEY) || "Recept";
  els.appName.textContent=name;
  document.title=name;
  els.appNameInput.value=name;
}
function saveAppName(){
  const name=els.appNameInput.value.trim() || "Recept";
  localStorage.setItem(APP_NAME_KEY,name);
  els.appName.textContent=name;
  document.title=name;
  els.appNameInput.value=name;
  toast("Appnamnet sparat");
}

async function exportJSON(){
  const recipes=await allRecipes();
  const payload={format:"recipe-vault",version:1,exportedAt:new Date().toISOString(),recipes};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url;
  a.download=`receptvalvet-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url); toast("Backup skapad");
}
async function importJSON(file){
  try{
    const text=await file.text(), data=JSON.parse(text);
    const incoming=Array.isArray(data)?data:data.recipes;
    if(!Array.isArray(incoming)) throw new Error("Ogiltig fil");
    let count=0;
    for(const r of incoming){
      if(!r || typeof r!=="object" || !r.id) continue;
      await putRecipe({
        id:String(r.id), title:String(r.title||""),
        ingredients:String(r.ingredients||""), instructions:String(r.instructions||""),
        notes:String(r.notes||""), created:r.created||new Date().toISOString(),
        modified:r.modified||r.created||new Date().toISOString()
      });
      count++;
    }
    await render(); toast(`${count} recept importerade`);
  }catch(e){ alert("Kunde inte importera filen. Kontrollera att det är en Recipe Vault JSON-backup."); }
}

els.newBtn.onclick=()=>openEditor(null,true);
els.emptyNew.onclick=()=>openEditor(null,true);
els.viewerClose.onclick=closeViewer;
els.viewerEdit.onclick=async()=>{
  const id=viewingId;
  closeViewer();
  if(id){
    const r=(await allRecipes()).find(x=>x.id===id);
    if(r) openEditor(r,false);
  }
};
els.closeBtn.onclick=closeEditor;
els.cancelBtn.onclick=closeEditor;
els.form.onsubmit=e=>{e.preventDefault();saveCurrent();};
els.deleteBtn.onclick=async()=>{ if(editingId && confirm("Radera receptet?")){await deleteRecipe(editingId);closeEditor();render();toast("Recept raderat");}};
els.search.oninput=render;
els.photoBtn.onclick=()=>els.recipePhoto.click();
els.menuBtn.onclick=()=>{ loadAppName(); els.backupDialog.showModal(); };
els.saveAppName.onclick=saveAppName;
els.backupClose.onclick=()=>els.backupDialog.close();
els.exportBtn.onclick=async()=>{ await exportJSON(); els.backupDialog.close(); };
els.importBtn.onclick=()=>els.fileInput.click();
els.fileInput.onchange=()=>{ if(els.fileInput.files[0]) { importJSON(els.fileInput.files[0]); els.backupDialog.close(); } els.fileInput.value=""; };

(async()=>{
  loadAppName();
  try{await openDB(); await render();}
  catch(e){console.error(e); alert("Din webbläsare stöder inte lokal lagring för appen.");}
  if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=3", { updateViaCache: "none" })
      .then(registration => {
        // Check for a new deployment whenever the app becomes visible again.
        const checkForUpdate = () => registration.update().catch(() => {});
        checkForUpdate();
        document.addEventListener("visibilitychange", () => {
          if(document.visibilityState === "visible") checkForUpdate();
        });

        // If a new worker takes control, reload once so the fresh app shell is used.
        let reloading = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if(reloading) return;
          reloading = true;
          window.location.reload();
        });
      })
      .catch(console.error);
  }
})();



let ocrImageUrl = null;
let ocrImageRotation = 0;

function resetOCRPreview() {
  if (ocrImageUrl) URL.revokeObjectURL(ocrImageUrl);
  ocrImageUrl = null;
  els.recipePhoto.value = "";
  els.ocrPreview.removeAttribute("src");
  els.ocrTools.classList.add("hidden");
  els.ocrStatus.textContent = "Ta ett tydligt foto. Du kan rotera det innan OCR körs.";
  ocrImageRotation = 0;
}

els.recipePhoto.onchange = () => {
  const file = els.recipePhoto.files[0];
  if (!file) return;
  if (ocrImageUrl) URL.revokeObjectURL(ocrImageUrl);
  ocrImageUrl = URL.createObjectURL(file);
  els.ocrPreview.src = ocrImageUrl;
  els.ocrPreview.style.transform = `rotate(0deg)`;
  els.ocrTools.classList.remove("hidden");
  ocrImageRotation = 0;
  els.ocrStatus.textContent = "Foto klart. Rotera vid behov och tryck sedan Läs text.";
};

els.rotateLeftBtn.onclick = () => {
  ocrImageRotation = (ocrImageRotation - 90 + 360) % 360;
  els.ocrPreview.style.transform = `rotate(${ocrImageRotation}deg)`;
};
els.rotateRightBtn.onclick = () => {
  ocrImageRotation = (ocrImageRotation + 90) % 360;
  els.ocrPreview.style.transform = `rotate(${ocrImageRotation}deg)`;
};
els.clearPhotoBtn.onclick = resetOCRPreview;

async function makeOCRImage(file, rotation) {
  const bitmap = await createImageBitmap(file);
  const swap = rotation % 180 !== 0;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? bitmap.height : bitmap.width;
  canvas.height = swap ? bitmap.width : bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.drawImage(bitmap, -bitmap.width/2, -bitmap.height/2);
  bitmap.close();
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .92));
}

els.ocrBtn.onclick = async () => {
  const file = els.recipePhoto.files[0];
  if (!file) { toast("Välj först ett foto"); return; }
  if (!window.Tesseract) {
    alert("OCR-motorn kunde inte laddas. Öppna appen med internet första gången.");
    return;
  }
  els.ocrBtn.disabled = true;
  els.ocrStatus.textContent = "Förbereder bilden…";
  try {
    const prepared = await makeOCRImage(file, ocrImageRotation);
    const worker = await Tesseract.createWorker("swe", 1, {
      logger: m => {
        if (m.status && typeof m.progress === "number")
          els.ocrStatus.textContent = `${m.status} ${Math.round(m.progress*100)}%`;
      }
    });

    // A page/recipe is normally a block of text. PSM 6 is a good
    // general starting point for photographed recipe pages.
    await worker.setParameters({ tessedit_pageseg_mode: "6" });
    const result = await worker.recognize(prepared);
    await worker.terminate();

    const text = (result.data.text || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) throw new Error("Ingen text hittades");

    els.ocrText.value = text;
    els.ocrReview.showModal();
    els.ocrStatus.textContent = "Text uppläst. Kontrollera den innan du använder den.";
  } catch (e) {
    console.error(e);
    els.ocrStatus.textContent = "OCR misslyckades.";
    alert("OCR kunde inte läsa bilden. Försök med ett skarpare foto, bättre belysning eller mindre lutning.");
  } finally {
    els.ocrBtn.disabled = false;
  }
};

function closeOCRReview() {
  if (els.ocrReview.open) els.ocrReview.close();
}
els.ocrReviewClose.onclick = closeOCRReview;
els.ocrReviewCancel.onclick = closeOCRReview;
els.ocrReviewForm.onsubmit = e => {
  e.preventDefault();
  const text = els.ocrText.value.trim();
  if (!text) return;
  const existing = els.instructions.value.trim();
  els.instructions.value = existing ? existing + "\n\n" + text : text;
  closeOCRReview();
  els.ocrStatus.textContent = "OCR-text infogad i receptet. Kontrollera texten och spara.";
  toast("OCR-text infogad");
};

