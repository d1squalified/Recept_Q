
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
    recipe?.instructions || "", recipe?.ocrText || ""
  ].join("\n"));
}
function cookingMethodLabels(keys=[]){
  return [...new Set(keys)].map(k => COOKING_METHODS.find(m=>m.key===k)?.label || k);
}


/* v2.0 — local Swedish ingredient recognition */
const SWEDISH_INGREDIENTS = [
"potatis","morot","lök","gul lök","rödlök","vitlök","purjolök","schalottenlök",
"tomat","körsbärstomat","gurka","paprika","chili","jalapeño","aubergine","zucchini",
"squash","broccoli","blomkål","spenat","grönkål","sallad","selleri","palsternacka",
"rödbeta","rödbetor","sötpotatis","majs","ärtor","ärta","bönor","böna","linser","lins",
"champinjon","svamp","avokado","äpple","päron","banan","apelsin","citron","lime",
"jordgubbar","jordgubbe","hallon","blåbär","vinbär","rabarber","ananas","mango",
"persika","aprikos","plommon","kokos","ingefära","persilja","basilika","timjan",
"rosmarin","oregano","koriander","gräslök","dill","salvia","mynta","dragon",
"spiskummin","kummin","kanel","kardemumma","nejlika","paprikapulver","chiliflakes",
"chilipulver","curry","gurkmeja","vanilj","vaniljsocker","kakao","choklad",
"mörk choklad","ljus choklad","vit choklad","mjöl","vetemjöl","rågmjöl","havremjöl",
"mandelmjöl","potatismjöl","majsstärkelse","stärkelse","havregryn","ströbröd",
"panko","ris","risnudlar","nudlar","pasta","spaghetti","makaroner","lasagneplattor",
"quinoa","bulgur","couscous","bröd","tortilla","ägg","äggula","äggvita","mjölk",
"grädde","vispgrädde","matlagningsgrädde","crème fraiche","creme fraiche","gräddfil",
"yoghurt","naturell yoghurt","kvarg","keso","ost","parmesan","mozzarella","fetaost",
"ricotta","mascarpone","smör","margarin","olja","olivolja","rapsolja","matolja",
"sesamolja","kokosolja","vinäger","balsamvinäger","soja","sojasås","fisksås",
"ostronsås","worcestershiresås","senap","ketchup","majonnäs","honung","sirap",
"ljus sirap","mörk sirap","socker","florsocker","farinsocker","strösocker","salt",
"peppar","svartpeppar","vitpeppar","buljong","fond","kyckling","kycklingfilé",
"kycklingfärs","köttfärs","nötfärs","blandfärs","fläskkött","nötkött","fläskfilé",
"bacon","skinka","korv","chorizo","salami","kött","lamm","lammkött","fisk","lax",
"torsk","räkor","kräftor","musslor","tonfisk","ansjovis","sardeller","nötter",
"mandel","valnöt","hasselnöt","cashewnöt","jordnöt","jordnötssmör","sesamfrön",
"chiafrön","solrosfrön","pumpakärnor","russin","torkade aprikoser","torkade fikon",
"gelatin","agar agar","jäst","bakpulver","bikarbonat","hjorthornssalt","marsipan",
"mandelmassa","sylt","marmelad","vaniljkräm","pesto","hummus","sriracha"
];

const INGREDIENT_NOISE = new Set([
"ugn","ugnen","grad","grader","minut","minuter","sekund","sekunder","timme","timmar",
"steg","stegvis","skål","skålen","form","formen","panna","pannan","kastrull","gryta",
"visp","vispen","spatel","kniv","kniven","bräda","bakplåt","bakplåtspapper","plåt",
"lock","omrörning","omgång","portion","portioner","recept","ingredienser","instruktion",
"vatten","liter","dl","ml","cl","kg","gram","g","tsk","msk","krm","st","ca","några"
]);

const INGREDIENT_UNITS = /\b(?:kg|g|hg|mg|l|dl|cl|ml|msk|tsk|krm|st|burk|burkar|paket|påse|påsar|förp|förpackning|knippe|klyfta|klyftor|skiva|skivor|bit|bitar)\b/i;
const INGREDIENT_HEADINGS = /^(?:ingredienser|ingredienser:|du behöver|du behöver:|till ingredienserna)\s*$/i;

function ingredientBaseForm(word){
  let w = word.toLocaleLowerCase("sv-SE").trim();
  w = w.replace(/^[,.;:()"'“”]+|[,.;:()"'“”]+$/g,"");
  // Common Swedish recipe inflections.
  const exact = SWEDISH_INGREDIENTS.find(x => normalizeIngredientWord(x) === normalizeIngredientWord(w));
  if (exact) return exact;
  const rules = [
    [/arna$/,""], [/erna$/,""], [/orna$/,""], [/ande$/,""], [/aste$/,""],
    [/en$/,""], [/et$/,""], [/an$/,""], [/at$/,""], [/ar$/,""], [/er$/,""],
    [/or$/,""], [/s$/,""]
  ];
  for (const [rx,rep] of rules){
    const b=w.replace(rx,rep);
    if (b.length >= 3 && SWEDISH_INGREDIENTS.some(x => normalizeIngredientWord(x) === normalizeIngredientWord(b))) return b;
  }
  return w;
}

function normalizeIngredientWord(s=""){
  return s.toLocaleLowerCase("sv-SE").normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/å/g,"a").replace(/ä/g,"a").replace(/ö/g,"o")
    .replace(/[^a-z0-9\s-]/g," ").replace(/\s+/g," ").trim();
}

function extractIngredientCandidates(text=""){
  const lines = text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const found = new Map();

  function add(value, score){
    const clean = value.replace(/\s+/g," ").trim().replace(/^[,;:.•\-–—]+|[,;:.•\-–—]+$/g,"");
    if (!clean || clean.length < 2) return;
    const key = normalizeIngredientWord(clean);
    if (!key || INGREDIENT_NOISE.has(key)) return;
    const canonical = SWEDISH_INGREDIENTS.find(x=>normalizeIngredientWord(x)===key) || clean;
    const prev = found.get(normalizeIngredientWord(canonical));
    if (!prev || score > prev.score) found.set(normalizeIngredientWord(canonical), {name:canonical, score});
  }

  for (const line of lines){
    const low = line.toLocaleLowerCase("sv-SE");
    if (INGREDIENT_HEADINGS.test(line)) continue;

    // Strong signal: quantity/unit followed by a known ingredient.
    const knownMatches = SWEDISH_INGREDIENTS
      .slice().sort((a,b)=>b.length-a.length)
      .filter(x => new RegExp("(^|[^a-zåäö])"+normalizeIngredientWord(x).replace(/\s+/g,"\\s+")+"([^a-zåäö]|$)","i").test(normalizeIngredientWord(low)));

    for (const ing of knownMatches) {
      const key = normalizeIngredientWord(ing);
      add(ing, INGREDIENT_UNITS.test(low) ? 100 : 70);
    }

    // Heuristic: after a quantity, capture a short Swedish noun phrase.
    const q = low.match(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|hg|mg|l|dl|cl|ml|msk|tsk|krm|st|burk|burkar|paket|påse|påsar|knippe|klyftor?|skivor?|bitar?)\b\s+([^,;:.()]+)/i);
    if (q){
      const phrase = q[1].trim().split(/\s+(?:och|eller|samt|plus)\s+/i)[0];
      if (phrase) add(phrase.split(/\s+/).slice(0,4).join(" "), 55);
    }
  }

  return [...found.values()].sort((a,b)=>b.score-a.score);
}

function suggestIngredientsFromOCR(text=""){
  const candidates = extractIngredientCandidates(text);
  // Only show candidates with a meaningful recipe signal.
  return candidates.filter(x => x.score >= 55).slice(0, 40);
}


function enrichRecipeIngredients(recipe){
  if (!recipe) return recipe;
  const suggestions = suggestIngredientsFromOCR([
    recipe.ingredients || "", recipe.instructions || "", recipe.ocrText || ""
  ].join("\n"));
  const current = Array.isArray(recipe.ingredientKeywords) ? recipe.ingredientKeywords : [];
  recipe.ingredientKeywords = [...new Set([
    ...current,
    ...suggestions.map(x=>normalizeIngredientWord(x.name))
  ])];
  return recipe;
}

function ingredientKeywordsFromRecipe(recipe){
  const direct = Array.isArray(recipe?.ingredientKeywords) ? recipe.ingredientKeywords : [];
  const suggestions = suggestIngredientsFromOCR([
    recipe?.ingredients || "", recipe?.instructions || "", recipe?.ocrText || ""
  ].join("\n")).map(x=>x.name);
  return [...new Set([...direct, ...suggestions].map(normalizeIngredientWord).filter(Boolean))];
}

/* ---------- OCR → lines (works with Tesseract.js v5 and v6) ---------- */
function ocrResultToLines(result){
  const d = result?.data || {};
  let raw = d.lines && d.lines.length ? d.lines.map(l => ({...l, para: 0})) : [];
  if (!raw.length && Array.isArray(d.blocks)) {
    let p = 0;
    raw = d.blocks.flatMap(b => (b.paragraphs || []).flatMap(par => {
      p++;
      return (par.lines || []).map(l => ({...l, para: p}));
    }));
  }
  let lines = raw.map(l => ({
    text: (l.text || '').replace(/[ \t]+/g, ' ').trim(),
    confidence: Number(l.confidence || 0),
    height: Math.max(1, (l.bbox?.y1 || 0) - (l.bbox?.y0 || 0)),
    x: l.bbox?.x0 || 0, y: l.bbox?.y0 || 0,
    para: l.para || 0
  })).filter(l => l.text);

  if (!lines.length) {
    return cleanOCRLines(d.text || '').filter(Boolean)
      .map(text => ({text, confidence: 50, height: 20, x: 0, y: 0, para: 0}));
  }
  const hs = lines.map(l => l.height).sort((a, b) => a - b);
  const median = hs[Math.floor(hs.length / 2)] || 1;
  const filtered = lines.filter(l => l.confidence >= 32 && (l.height >= median * 0.52 || l.text.length >= 55));
  // Keep Tesseract's reading order — it already handles columns. Do NOT re-sort by y.
  return filtered.length >= Math.max(3, Math.floor(lines.length * 0.45)) ? filtered : lines;
}

/* ---------- Edge noise: don't eat "225 C" ---------- */
function cleanOCREdgeNoise(line){
  let s = (line || '').replace(/[ \t]+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  s = s.replace(/^([A-ZÅÄÖ])\s+(?=[A-Za-zÅÄÖåäö]{2})/u, '');
  // Only strip a trailing lone capital after a letter — never after a digit or °.
  s = s.replace(/(?<=[A-Za-zÅÄÖåäö])\s+([A-ZÅÄÖ])$/u, '');
  return s.trim();
}

/* ---------- Line classification ---------- */
const OCR_UNIT = '(?:dl|cl|ml|l|g|hg|kg|mg|krm|tsk|msk|st|stycken?|pkt|paket|burkar?|förp|förpackning|påsar?|nypa|nypor|knippe|klyftor?|skivor?|bitar?)';
const OCR_QTY  = '(?:ca\\.?\\s*)?(?:\\d+(?:[.,]\\d+)?(?:\\s*[-–]\\s*\\d+)?(?:\\s+\\d\\/\\d)?|\\d\\/\\d|[½¼¾⅓⅔⅛])';
const QTY_LINE  = new RegExp(`^${OCR_QTY}\\s*(?:${OCR_UNIT}\\b)?`, 'i');
const STEP_LINE = /^\d+[.)]\s+\p{L}/u;
const NOT_INGREDIENT = /\b(grader|°|minuter|min\b|timmar?|portioner|personer)/i;
const INSTR_HEADING = /^(gör så här|gor sa har|tillagning|instruktion(er)?|metod|så här gör du|sa har gor du|tillredning)\b/i;
const INGR_HEADING  = /^(ingredienser(na)?|du behöver|du behover)\b/i;

function isLikelyIngredient(line){
  if (STEP_LINE.test(line) || NOT_INGREDIENT.test(line)) return false;
  if (/^[-•*]\s+/.test(line)) return true;
  if (QTY_LINE.test(line) && line.length <= 70) return true;
  // Short, no full stop, mentions a known ingredient: "Salt och peppar", "Olja till stekning"
  return line.length <= 40 && !/[.!?]$/.test(line) && looksLikeIngredientLine(line);
}
function looksLikeIngredientLine(line){
  const l = normalizeIngredientWord(line);
  return SWEDISH_INGREDIENTS.some(x =>
    new RegExp('(^|[^a-z0-9])' + normalizeIngredientWord(x).replace(/\s+/g, '\\s+') + '([^a-z0-9]|$)').test(l));
}
function joinHyphenated(lines){
  const out = [];
  for (const l of lines) {
    const prev = out[out.length - 1];
    if (prev && /[a-zåäö]-$/.test(prev.text) && /^[a-zåäö]/.test(l.text)) {
      prev.text = prev.text.slice(0, -1) + l.text;
    } else out.push({...l});
  }
  return out;
}

/* ---------- Structure detection: takes line objects, not a string ---------- */
function detectOCRStructure(lineObjs){
  let lines = joinHyphenated(lineObjs)
    .map(l => ({...l, text: cleanOCREdgeNoise(l.text)}))
    .filter(l => !looksLikeNoise(l.text));
  if (!lines.length) return {title: '', ingredients: [], instructions: []};

  // Title: tallest non-ingredient, non-heading line among the first 5.
  const head = lines.slice(0, 5).map((l, i) => ({...l, i}))
    .filter(l => l.text.length >= 3 && l.text.length <= 80 && !isSectionHeading(l.text)
              && !isLikelyIngredient(l.text) && !STEP_LINE.test(l.text));
  const titleObj = head.sort((a, b) => b.height - a.height)[0];
  const title = titleObj?.text || '';
  const rest = lines.filter((_, i) => i !== titleObj?.i).map(l => l.text);

  const iH = rest.findIndex(l => INGR_HEADING.test(normalize(l)) || INGR_HEADING.test(l));
  const sH = rest.findIndex(l => INSTR_HEADING.test(l) || INSTR_HEADING.test(normalize(l)));

  let ingredients, instructions;
  if (iH >= 0 && sH > iH) {
    ingredients  = rest.slice(iH + 1, sH);
    instructions = rest.slice(sH + 1);
  } else if (sH >= 0 && iH > sH) {          // instructions printed first
    instructions = rest.slice(sH + 1, iH);
    ingredients  = rest.slice(iH + 1);
  } else {
    // No reliable headings: classify every line.
    const body = rest.filter(l => !isSectionHeading(l));
    ingredients  = body.filter(isLikelyIngredient);
    instructions = body.filter(l => !ingredients.includes(l));
  }
  return {
    title,
    ingredients: ingredients.filter(l => !isSectionHeading(l)),
    instructions: instructions.filter(l => !isSectionHeading(l))
  };
}


function applyOcrFieldsToEditor(text=""){
  const parsed=parseOcrIntoRecipeFields(text);

  const setField=(selectors,value)=>{
    const el=document.querySelector(selectors);
    if(!el) return false;
    el.value=value||"";
    el.dispatchEvent(new Event("input",{bubbles:true}));
    el.dispatchEvent(new Event("change",{bubbles:true}));
    return true;
  };

  setField("#name, #recipeName, input[name='name'], input[name='title']",parsed.name);
  setField("#ingredients, #ingredientInput, textarea[name='ingredients'], input[name='ingredients']",parsed.ingredients);

  // Instructions may be a textarea or contenteditable rich-text area.
  const instr=document.querySelector("#instructions, textarea[name='instructions']");
  if(instr){
    instr.value=parsed.instructions||"";
    instr.dispatchEvent(new Event("input",{bubbles:true}));
    instr.dispatchEvent(new Event("change",{bubbles:true}));
  }else{
    const ce=document.querySelector("[contenteditable='true'][data-field='instructions'], #instructionsEditor, #instructions");
    if(ce){
      ce.innerHTML=typeof textToHtml==="function" ? textToHtml(parsed.instructions||"") : (parsed.instructions||"").split(/\n+/).map(x=>`<div>${typeof escapeHtml==="function"?escapeHtml(x):x}</div>`).join("");
      ce.dispatchEvent(new Event("input",{bubbles:true}));
    }
  }

  // If the app has current draft state, update common global draft objects too.
  try{
    if(window.currentRecipe){
      window.currentRecipe.name=parsed.name;
      window.currentRecipe.ingredients=parsed.ingredients;
      window.currentRecipe.instructions=parsed.instructions;
      window.currentRecipe.ingredientKeywords=parsed.ingredientKeywords;
      window.currentRecipe.cookingMethods=parsed.cookingMethods;
    }
  }catch(e){}

  // Keep suggestions visible so the user can see what was recognized.
  if(typeof renderIngredientSuggestions==="function"){
    renderIngredientSuggestions(text);
  }
  return parsed;
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
function getEditorHtml(el){
  if(!el) return '';
  if(el.matches('textarea, input')) return el.value.trim();
  return sanitizeHtml(el.innerHTML).trim();
}
function setEditorHtml(el,value){
  if(!el) return;
  if(el.matches('textarea, input')){ el.value=htmlToText(value||''); return; }
  el.innerHTML=legacyToHtml(value);
}
function editorHasContent(el){
  if(!el) return false;
  return (el.matches('textarea, input') ? el.value : htmlToText(el.innerHTML)).trim().length>0;
}

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


(async()=>{loadAppName();try{await openDB();await render();}catch(e){console.error(e);alert('Din webbläsare stöder inte lokal lagring för appen.');}
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js?v=8',{updateViaCache:'none'}).then(reg=>{const check=()=>reg.update().catch(()=>{});check();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;window.location.reload();});}).catch(console.error);}})();

let ocrImageUrl=null,ocrImageRotation=0;
function resetOCRPreview(){if(ocrImageUrl)URL.revokeObjectURL(ocrImageUrl);ocrImageUrl=null;els.recipePhoto.value='';els.ocrPreview.removeAttribute('src');els.ocrTools.classList.add('hidden');els.ocrStatus.textContent='Ta ett tydligt foto. Rak bild och bra ljus ger bäst resultat.';ocrImageRotation=0;}
els.recipePhoto.onchange=()=>{const file=els.recipePhoto.files[0];if(!file)return;if(ocrImageUrl)URL.revokeObjectURL(ocrImageUrl);ocrImageUrl=URL.createObjectURL(file);els.ocrPreview.src=ocrImageUrl;els.ocrPreview.style.transform='rotate(0deg)';els.ocrTools.classList.remove('hidden');ocrImageRotation=0;els.ocrStatus.textContent='Foto klart. Rotera vid behov och tryck sedan Läs text.';};
els.rotateLeftBtn.onclick=()=>{ocrImageRotation=(ocrImageRotation-90+360)%360;els.ocrPreview.style.transform=`rotate(${ocrImageRotation}deg)`};els.rotateRightBtn.onclick=()=>{ocrImageRotation=(ocrImageRotation+90)%360;els.ocrPreview.style.transform=`rotate(${ocrImageRotation}deg)`};els.clearPhotoBtn.onclick=resetOCRPreview;
async function makeOCRImage(file,rotation){const bitmap=await createImageBitmap(file);const scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));const swap=rotation%180!==0;const w=Math.round((swap?bitmap.height:bitmap.width)*scale),h=Math.round((swap?bitmap.width:bitmap.height)*scale);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.translate(w/2,h/2);ctx.rotate(rotation*Math.PI/180);ctx.drawImage(bitmap,-bitmap.width*scale/2,-bitmap.height*scale/2,bitmap.width*scale,bitmap.height*scale);bitmap.close();
// Leave a tiny white safety margin around the photographed page so border marks are less likely to become letters.
const marginX=Math.round(w*0.012),marginY=Math.round(h*0.012);
const cropped=document.createElement('canvas');cropped.width=Math.max(1,w-marginX*2);cropped.height=Math.max(1,h-marginY*2);
const cropCtx=cropped.getContext('2d');cropCtx.fillStyle='#fff';cropCtx.fillRect(0,0,cropped.width,cropped.height);cropCtx.drawImage(canvas,marginX,marginY,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
const image=cropCtx.getImageData(0,0,cropped.width,cropped.height),d=image.data;for(let i=0;i<d.length;i+=4){const y=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];const boosted=Math.max(0,Math.min(255,(y-128)*1.45+128));d[i]=d[i+1]=d[i+2]=boosted;}cropCtx.putImageData(image,0,0);return new Promise(resolve=>cropped.toBlob(resolve,'image/jpeg',.95));}
function cleanOCREdgeNoise(line){
  let s=(line||'').replace(/[ \t]+/g,' ').replace(/\s+([,.;:!?])/g,'$1').trim();
  // Tesseract can pick up isolated capital letters from the very edge of a photographed page.
  // Remove only standalone one-letter edge tokens; keep normal words and all recipe content.
  s=s.replace(/^([A-ZÅÄÖ])\s+(?=[A-Za-zÅÄÖåäö])/u,'');
  s=s.replace(/(?<=[A-Za-zÅÄÖåäö0-9)])\s+([A-ZÅÄÖ])$/u,'');
  return s.trim();
}
function cleanOCRLines(text){
  return (text||'').replace(/\r/g,'').split('\n').map(cleanOCREdgeNoise);
}
function isSectionHeading(line){
  const n=normalize(line).replace(/[:\-–—]+$/,'').trim();
  return /^(ingredienser|ingredienserna|du behover|du behöver|gor sa har|gör så här|tillagning|instruktioner|instruktion|metod|sa har gor du|så här gör du|tillredning)$/.test(n);
}
function isLikelyIngredient(line){
  const n=normalize(line);
  return /^(\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s*(dl|cl|ml|l|g|kg|mg|krm|tsk|msk|st|stycken?|paket|pkt|burk|burkar|förp|förpackning|nypa|nypor|cm|grad)/i.test(line)
    || /^\d+\s*[x×]\s*/i.test(line)
    || /^[-•*]\s+/.test(line)
    || /^(ca\.?\s*)?\d+(?:[.,]\d+)?\s+/.test(line);
}
function looksLikeNoise(line){
  if(!line) return true;
  if(line.length<2) return true;
  if(/^[^\p{L}\p{N}]+$/u.test(line)) return true;
  return false;
}
function detectOCRStructure(text){
  const raw=cleanOCRLines(text).filter((line,i,a)=>line || (i>0 && i<a.length-1));
  const lines=raw.filter(l=>!looksLikeNoise(l));
  if(!lines.length) return {title:'',ingredients:[],instructions:[]};
  const titleIndex=lines.findIndex(l=>l.length>=3 && l.length<=100 && !isSectionHeading(l));
  const title=titleIndex>=0?lines[titleIndex]:'';
  const afterTitle=titleIndex>=0?lines.slice(titleIndex+1):lines;
  const ingredientHeading=afterTitle.findIndex(isSectionHeading);
  let ingredients=[], instructions=[];
  if(ingredientHeading>=0 && /ingredien|behov|du behöver|du behover/i.test(normalize(afterTitle[ingredientHeading]))){
    const rest=afterTitle.slice(ingredientHeading+1);
    const instructionIndex=rest.findIndex(l=>/^(gör så här|gor sa har|tillagning|instruktion|instruktioner|metod|så här gör du|sa har gor du|tillredning)\b/i.test(l));
    ingredients=(instructionIndex>=0?rest.slice(0,instructionIndex):rest).filter(l=>!isSectionHeading(l));
    instructions=instructionIndex>=0?rest.slice(instructionIndex+1):[];
  }else{
    const firstInstruction=afterTitle.findIndex(l=>/^(gör så här|gor sa har|tillagning|instruktion|instruktioner|metod|så här gör du|sa har gor du)\b/i.test(l));
    if(firstInstruction>=0){
      const possible=afterTitle.slice(0,firstInstruction);
      ingredients=possible.filter(isLikelyIngredient);
      instructions=afterTitle.slice(firstInstruction+1);
    }else{
      ingredients=afterTitle.filter(isLikelyIngredient);
      instructions=afterTitle.filter(l=>!ingredients.includes(l));
    }
  }
  return {title,ingredients,instructions};
}
function normalizeIngredientLines(lines){
  return lines.map(line=>line.replace(/^[-•*]\s*/,'').replace(/\s{2,}/g,' ').trim()).filter(Boolean);
}
function normalizeInstructionLines(lines){
  const out=[];
  for(const line of lines){
    if(!line) continue;
    const prev=out[out.length-1];
    if(prev && !/^[\d]+[.)]\s/.test(line) && !/^[-•*]\s/.test(line) && !/^[A-ZÅÄÖ][A-ZÅÄÖ0-9 \-]{4,}$/.test(line)){
      out[out.length-1]=`${prev} ${line}`.replace(/\s+/g,' ').trim();
    }else out.push(line);
  }
  return out;
}
function ocrToHtml(text){
  const lines=cleanOCRLines(text).filter(Boolean); let html='';
  for(const line of lines){
    if(isSectionHeading(line)){html+=`<h4>${escapeHtml(line.replace(/:$/,''))}</h4>`;continue;}
    if(/^\d+[.)]\s+/.test(line)){html+=`<div>${escapeHtml(line)}</div>`;continue;}
    if(/^[-•–*]\s+/.test(line)){html+=`<div>• ${escapeHtml(line.replace(/^[-•–*]\s+/,''))}</div>`;continue;}
    html+=`<div>${escapeHtml(line)}</div>`;
  }
  return html;
}
function ocrResultToLines(result){
  const lines=(result?.data?.lines||[]).map(l=>({
    text:(l.text||'').replace(/[ \t]+/g,' ').trim(),
    confidence:Number(l.confidence||0),
    height:Math.max(1,(l.bbox?.y1||0)-(l.bbox?.y0||0)),
    x:l.bbox?.x0||0,y:l.bbox?.y0||0
  })).filter(l=>l.text);
  if(!lines.length) return cleanOCRLines(result?.data?.text||'').filter(Boolean).map(text=>({text,confidence:50,height:20,x:0,y:0}));
  const heights=lines.map(l=>l.height).sort((a,b)=>a-b); const median=heights[Math.floor(heights.length/2)]||1;
  // Background/side text is often much smaller and lower-confidence than the main recipe text.
  const filtered=lines.filter(l=>l.confidence>=32 && (l.height>=median*0.52 || l.text.length>=55));
  return (filtered.length>=Math.max(3,Math.floor(lines.length*0.45))?filtered:lines).sort((a,b)=>a.y-b.y||a.x-b.x);
}
els.ocrBtn.onclick=async()=>{
  const file=els.recipePhoto.files[0]; if(!file){toast('Välj först ett foto');return;}
  if(!window.Tesseract){alert('OCR-motorn kunde inte laddas. Öppna appen med internet första gången.');return;}
  els.ocrBtn.disabled=true; els.ocrStatus.textContent='Förbättrar bilden…';
  try{
    const prepared=await makeOCRImage(file,ocrImageRotation);
    const worker=await Tesseract.createWorker('swe',1,{logger:m=>{if(m.status&&typeof m.progress==='number')els.ocrStatus.textContent=`${m.status} ${Math.round(m.progress*100)}%`;}});
    await worker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1',user_defined_dpi:'300'});
    const result=await worker.recognize(prepared);
    await worker.terminate();
    const lines=ocrResultToLines(result);
    const text=lines.map(l=>l.text).join('\n').trim();
    if(!text) throw new Error('Ingen text hittades');
    const structure=detectOCRStructure(text);
    els.ocrText.value=text;
    els.ocrReview.dataset.detectedTitle=structure.title||'';
    els.ocrReview.dataset.detectedIngredients=normalizeIngredientLines(structure.ingredients).join('\n');
    els.ocrReview.dataset.detectedInstructions=normalizeInstructionLines(structure.instructions).join('\n');
    els.ocrReview.showModal();
    els.ocrStatus.textContent='Text uppläst. Kontrollera titel och ingredienser innan du använder den.';
  }catch(e){console.error(e);els.ocrStatus.textContent='OCR misslyckades.';alert('OCR kunde inte läsa bilden. Försök med ett skarpare, rakare foto och bättre ljus.');}
  finally{els.ocrBtn.disabled=false;}
};
function closeOCRReview(){if(els.ocrReview.open)els.ocrReview.close();}els.ocrReviewClose.onclick=closeOCRReview;els.ocrReviewCancel.onclick=closeOCRReview;
els.ocrReviewForm.onsubmit=e=>{e.preventDefault();const text=els.ocrText.value.trim();if(!text)return;const detectedTitle=els.ocrReview.dataset.detectedTitle||'';const detectedIngredients=els.ocrReview.dataset.detectedIngredients||'';const detectedInstructions=els.ocrReview.dataset.detectedInstructions||'';if(!els.title.value.trim()&&detectedTitle)els.title.value=detectedTitle;if(!editorHasContent(els.ingredientsEditor)&&detectedIngredients)setEditorHtml(els.ingredientsEditor,detectedIngredients);setEditorHtml(els.instructionsEditor,text);closeOCRReview();els.ocrStatus.textContent='OCR-text infogad. Titel och ingredienser fylldes i där de kunde identifieras, och hela OCR-texten sparades i Metod.';toast('OCR-text infogad');};


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
document.addEventListener("DOMContentLoaded",()=>setTimeout(rv8Wire,0));/* v2.0 ingredient suggestion UI */
function renderIngredientSuggestions(text){
  const box = document.getElementById("ingredientSuggestions");
  const list = document.getElementById("ingredientSuggestionsList");
  if (!box || !list) return;
  const candidates = suggestIngredientsFromOCR(text);
  if (!candidates.length){ box.hidden = true; list.innerHTML = ""; return; }
  box.hidden = false;
  list.innerHTML = candidates.map((x,i)=>
    `<label class="ingredient-suggestion-row">
      <input type="checkbox" data-ingredient-suggestion="${i}" checked>
      <span class="ingredient-suggestion-name">${typeof escapeHtml==="function"?escapeHtml(x.name):x.name}</span>
    </label>`).join("");
  box._candidates = candidates;
}

function addSelectedIngredientSuggestions(){
  const box = document.getElementById("ingredientSuggestions");
  if (!box || !box._candidates) return;
  const selected = [...box.querySelectorAll("[data-ingredient-suggestion]:checked")]
    .map(el => box._candidates[Number(el.dataset.ingredientSuggestion)]?.name)
    .filter(Boolean);
  if (!selected.length) return;

  // Find the ingredients field using common ids/names.
  const field = document.querySelector("#ingredients, #ingredientInput, textarea[name='ingredients'], input[name='ingredients']");
  if (!field) return;
  const existing = field.value.trim();
  const additions = selected.filter(x => !normalizeIngredientWord(existing).includes(normalizeIngredientWord(x)));
  field.value = [existing, ...additions].filter(Boolean).join(existing ? "\n" : "");
  field.dispatchEvent(new Event("input",{bubbles:true}));
}

document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("addSelectedIngredientsBtn");
  if (btn) btn.addEventListener("click", addSelectedIngredientSuggestions);

  // Watch OCR textareas so suggestions appear while reviewing OCR.
  const ocr = document.querySelector("#ocrText, textarea[name='ocrText'], #ocrOutput");
  if (ocr){
    const refresh = ()=>renderIngredientSuggestions(ocr.value || "");
    ocr.addEventListener("input", refresh);
    refresh();
  }
});


