const VERSION="2.8";
const T={team:"Team",teams:"Team_ref",motifs:"Motifs_RH",alerts:"Parametres_Alertes"};
const S={team:[],teams:[],motifs:[],alerts:[],editing:null,available:[],errors:{},log:[],currentView:"ressources"};

const $=id=>document.getElementById(id);
const esc=(s="")=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const toast=m=>{const t=$("toast");if(!t)return; t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)};

function logError(action, message){
  S.log.unshift({time:new Date(),action,message:String(message)});
  if(S.log.length>100)S.log.length=100;
  renderDiagnostic();
}
function clearLog(){S.log=[];renderDiagnostic();}

function normalizeRecords(raw, tableId){
  // Format 1 : tableau de lignes [{id:1, ...}, ...]
  if(Array.isArray(raw)){
    return raw;
  }

  // Format 2 : objet colonne-par-colonne :
  // {id:[1,2], nom:["A","B"], actif:[true,false], ...}
  if(raw && typeof raw === "object"){
    // Certaines versions/wrappers peuvent encapsuler les colonnes.
    const candidate =
      (raw.columns && typeof raw.columns === "object" ? raw.columns : null) ||
      (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : null) ||
      raw;

    const keys=Object.keys(candidate).filter(k=>Array.isArray(candidate[k]));
    if(keys.length){
      const length=Math.max(...keys.map(k=>candidate[k].length));
      const records=[];
      for(let i=0;i<length;i++){
        const rec={};
        for(const key of keys){
          rec[key]=candidate[key][i];
        }
        // Grist doit normalement fournir id. On le conserve tel quel.
        records.push(rec);
      }
      return records;
    }

    // Format éventuel : {records:[...]}
    if(Array.isArray(raw.records)){
      return raw.records;
    }
  }

  throw new Error(
    `Format de données non reconnu pour ${tableId}. Type=${typeof raw}; clés=`+
    (raw && typeof raw==="object" ? Object.keys(raw).slice(0,20).join(",") : "aucune")
  );
}

async function safeFetch(tableId){
  if(!S.available.includes(tableId)){
    S.errors[tableId]=`Table absente : ${tableId}`;
    return [];
  }
  try{
    const raw=await grist.docApi.fetchTable(tableId);
    const rows=normalizeRecords(raw,tableId);
    return rows;
  }catch(e){
    S.errors[tableId]=`${tableId} : ${e?.message||String(e)}`;
    logError(`Chargement ${tableId}`, e?.message||String(e));
    return [];
  }
}

async function load(){
  $("sync").textContent=`V${VERSION} · Synchronisation…`;
  S.errors={};
  try{
    S.available=await grist.docApi.listTables();
  }catch(e){
    $("sync").textContent=`V${VERSION} · Erreur`;
    logError("Liste des tables", e?.message||String(e));
    renderDiagnostic();
    return;
  }

  // Les quatre tables sont chargées indépendamment. Une table RH absente ne bloque plus Team.
  const [team,teams,motifs,alerts]=await Promise.all([
    safeFetch(T.team), safeFetch(T.teams), safeFetch(T.motifs), safeFetch(T.alerts)
  ]);
  S.team=team; S.teams=teams; S.motifs=motifs; S.alerts=alerts;

  $("sync").textContent=`V${VERSION} · Team ${S.team.length} · Équipes ${S.teams.length}`;
  render();
}

function render(){
  resources();
  thresholds();
  motifs();
  teams();
  renderDiagnostic();
}

function teamName(id){
  return S.teams.find(x=>x.id===Number(id))?.Libelle || S.teams.find(x=>x.id===Number(id))?.Code || "—";
}

function resources(){
  const tbody=$("resourceRows");
  const select=$("resEquipe");
  if(!tbody||!select)return;
  const rows=S.team.slice().sort((a,b)=>String(a.nom||"").localeCompare(String(b.nom||"")));
  tbody.innerHTML=rows.length
    ? rows.map(r=>`<tr class="clickable" data-id="${r.id}">
        <td>${esc(r.nom||"")}</td>
        <td>${esc(teamName(r.equipe))}</td>
        <td>${esc(r.role||"")}</td>
        <td>${num(r.capacite_ETP).toFixed(1)}</td>
        <td>${r.actif?"Oui":"Non"}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="empty">${S.errors[T.team] ? esc(S.errors[T.team]) : "La table Team est présente mais ne contient aucune ressource."}</td></tr>`;
  tbody.querySelectorAll("tr[data-id]").forEach(tr=>tr.addEventListener("click",()=>edit(Number(tr.dataset.id))));
  select.innerHTML='<option value="0">—</option>'+
    S.teams.map(t=>`<option value="${t.id}">${esc(t.Libelle||t.Code||`Équipe ${t.id}`)}</option>`).join("");
}

function edit(id){
  const r=S.team.find(x=>x.id===id); if(!r)return;
  S.editing=id;
  $("resourceFormTitle").textContent=`Modifier ${r.nom||""}`;
  $("resNom").value=r.nom||"";
  $("resEmail").value=r.email||"";
  $("resEquipe").value=r.equipe||0;
  $("resRole").value=r.role||"";
  $("resEtp").value=num(r.capacite_ETP,1);
  $("resCost").value=num(r.cout_Journalier);
  $("resActif").checked=!!r.actif;
}

function reset(){
  S.editing=null;
  $("resourceFormTitle").textContent="Nouvelle ressource";
  ["resNom","resEmail","resRole","resCost"].forEach(x=>$(x).value="");
  $("resEtp").value=1;
  $("resEquipe").value=0;
  $("resActif").checked=true;
}

async function saveResource(){
  if(S.errors[T.team]) return toast("Impossible d'écrire : table Team indisponible.");
  const nom=$("resNom").value.trim();
  if(!nom)return toast("Nom obligatoire");
  const fields={
    nom,
    email:$("resEmail").value.trim(),
    equipe:Number($("resEquipe").value||0),
    role:$("resRole").value.trim(),
    capacite_ETP:num($("resEtp").value,1),
    cout_Journalier:num($("resCost").value),
    actif:$("resActif").checked
  };
  const table=grist.getTable(T.team);
  if(S.editing) await table.update({id:S.editing,fields});
  else await table.create({fields});
  reset(); toast("Ressource enregistrée"); await load();
}


const ALERT_HELP={
  ABS_IND:{
    title:"Absence prévisionnelle individuelle",
    text:"Mesure, pour chaque ressource, le cumul d'absence prévu sur la fenêtre configurée. A = 1 jour ; 1/2 M et 1/2 AM = 0,5 jour. Orange à partir du seuil Orange, Rouge à partir du seuil Rouge.",
    formula:"Somme des Absence_Equivalent par ressource sur les X prochains jours.",
    sense:"Plus la valeur monte, plus le niveau d'alerte est élevé."
  },
  ABS_EQ:{
    title:"Taux d'absence prévisionnel équipe",
    text:"Mesure la part de capacité de l'équipe prévue en absence sur la fenêtre configurée. Les week-ends et jours fériés ne doivent pas entrer dans la capacité travaillable.",
    formula:"Jours-ressources d'absence ÷ jours-ressources travaillables × 100.",
    sense:"Plus le pourcentage monte, plus le niveau d'alerte est élevé."
  },
  CAP_MIN:{
    title:"Capacité disponible minimale",
    text:"Mesure la capacité de travail restante pour une journée, après prise en compte des absences. P, TL, TE/TLE et FO restent de la capacité disponible selon leur coefficient de présence.",
    formula:"Présence équivalente disponible ÷ capacité travaillable × 100.",
    sense:"Ici le sens est inversé : Orange si la capacité descend sous le seuil Orange, Rouge si elle descend sous le seuil Rouge."
  },
  PRES_PHY:{
    title:"Présence physique minimale",
    text:"Compte les ressources physiquement présentes sur site. Seul le motif P est considéré comme présence physique. TL, TE/TLE et FO peuvent rester de la capacité disponible mais ne comptent pas comme présence sur site.",
    formula:"Nombre de ressources avec motif P pour la journée.",
    sense:"Sens inversé : plus le nombre descend, plus l'alerte est forte."
  },
  ABS_CONS:{
    title:"Absence consécutive individuelle",
    text:"Repère les séries continues de jours d'absence d'une même ressource sur la fenêtre configurée.",
    formula:"Nombre maximal de jours consécutifs comportant une absence pour la ressource.",
    sense:"Orange à partir du seuil Orange, Rouge à partir du seuil Rouge."
  },
  TL_SIM:{
    title:"Télétravail simultané",
    text:"Mesure la proportion de ressources en télétravail le même jour. Les motifs TL, TE et TLE sont comptés comme télétravail. Cet indicateur aide à anticiper une faible présence physique, même si la capacité de travail reste disponible.",
    formula:"Ressources en TL/TE/TLE ÷ ressources actives de l'équipe × 100.",
    sense:"Plus le pourcentage monte, plus le niveau d'alerte est élevé."
  },
  FO_SIM:{
    title:"Formation simultanée",
    text:"Mesure la proportion de ressources en formation le même jour. La formation est considérée comme temps travaillé, mais plusieurs formations simultanées peuvent réduire la capacité opérationnelle disponible pour l'activité courante.",
    formula:"Ressources en FO ÷ ressources actives de l'équipe × 100.",
    sense:"Plus le pourcentage monte, plus le niveau d'alerte est élevé."
  }
};

function alertHelpHtml(code){
  const h=ALERT_HELP[code];
  if(!h)return "";
  const content=`<strong>${esc(h.title)}</strong><span>${esc(h.text)}</span><span><b>Formule :</b> ${esc(h.formula)}</span><span><b>Lecture :</b> ${esc(h.sense)}</span>`;
  return `<span class="help-wrap">
    <button type="button" class="help-dot" aria-label="Explication ${esc(h.title)}">i</button>
    <span class="help-popover" role="tooltip">${content}</span>
  </span>`;
}


const ALERT_RECOMMENDED={
  ABS_IND:{window:30,orange:5,red:10,unit:"jours",sens:"MAX"},
  ABS_EQ:{window:7,orange:20,red:30,unit:"%",sens:"MAX"},
  CAP_MIN:{window:1,orange:70,red:50,unit:"%",sens:"MIN"},
  PRES_PHY:{window:1,orange:50,red:35,unit:"%",sens:"MIN"},
  ABS_CONS:{window:30,orange:5,red:10,unit:"jours",sens:"MAX"},
  TL_SIM:{window:1,orange:50,red:65,unit:"%",sens:"MAX"},
  FO_SIM:{window:1,orange:20,red:35,unit:"%",sens:"MAX"}
};
async function applyRecommendedThresholds(){
  const rows=S.alerts.map(r=>{
    const x=ALERT_RECOMMENDED[r.Code_Alerte];
    return x?{id:r.id,fields:{
      Actif:true,
      Fenetre_Jours:x.window,
      Seuil_Orange:x.orange,
      Seuil_Rouge:x.red,
      Unite:x.unit,
      Sens:x.sens
    }}:null
  }).filter(Boolean);
  if(!rows.length)return toast("Aucun seuil RH reconnu");
  if(!window.confirm("Appliquer le profil recommandé à tous les seuils RH ?"))return;
  try{
    await grist.getTable(T.alerts).update(rows);
    toast("Seuils recommandés appliqués");
    await load();
  }catch(e){
    logError("Application seuils recommandés",e?.message||String(e));
    toast(e?.message||String(e));
  }
}
function thresholds(){
  const tbody=$("alertRows"); if(!tbody)return;
  if(S.errors[T.alerts]){
    tbody.innerHTML=`<tr><td colspan="7" class="empty">${esc(S.errors[T.alerts])}. Applique d'abord la migration RH.</td></tr>`;
    return;
  }
  tbody.innerHTML=S.alerts.length ? S.alerts.map(r=>{
    const rec=ALERT_RECOMMENDED[r.Code_Alerte];
    const legacyPhysical=r.Code_Alerte==="PRES_PHY" && String(r.Unite||"").trim()!=="%";
    const orange=legacyPhysical?50:num(r.Seuil_Orange);
    const red=legacyPhysical?35:num(r.Seuil_Rouge);
    const unit=legacyPhysical?"%":String(r.Unite||rec?.unit||"");
    return `<tr data-id="${r.id}">
      <td><input class="act" type="checkbox" ${r.Actif?"checked":""}></td>
      <td><div class="alert-name"><strong>${esc(r.Libelle||"")}</strong>${alertHelpHtml(r.Code_Alerte)}</div><small>${esc(r.Code_Alerte||"")}</small></td>
      <td><input class="win" type="number" min="1" value="${num(r.Fenetre_Jours)}"></td>
      <td><input class="orange" type="number" step="0.1" value="${orange}"></td>
      <td><input class="red" type="number" step="0.1" value="${red}"></td>
      <td><select class="unit">
        <option value="%" ${unit==="%"?"selected":""}>%</option>
        <option value="jours" ${unit==="jours"?"selected":""}>jours</option>
        <option value="personnes" ${unit==="personnes"?"selected":""}>personnes</option>
      </select></td>
      <td><button class="btn secondary save-alert">Sauver</button></td>
    </tr>`
  }).join("") : '<tr><td colspan="7" class="empty">La table Parametres_Alertes est vide.</td></tr>';

  tbody.querySelectorAll(".save-alert").forEach(b=>b.addEventListener("click",async()=>{
    const tr=b.closest("tr"),id=Number(tr.dataset.id),row=S.alerts.find(x=>x.id===id);
    try{
      const fields={
        Actif:tr.querySelector(".act").checked,
        Fenetre_Jours:num(tr.querySelector(".win").value),
        Seuil_Orange:num(tr.querySelector(".orange").value),
        Seuil_Rouge:num(tr.querySelector(".red").value),
        Unite:tr.querySelector(".unit").value
      };
      if(row?.Code_Alerte==="PRES_PHY"){
        fields.Unite="%";
        fields.Sens="MIN";
      }
      await grist.getTable(T.alerts).update({id,fields});
      toast("Seuil enregistré"); await load();
    }catch(e){logError("Enregistrement seuil",e?.message||String(e));toast(e?.message||String(e));}
  }));
}
function motifs(){
  const tbody=$("motifRows"); if(!tbody)return;
  if(S.errors[T.motifs]){
    tbody.innerHTML=`<tr><td colspan="7" class="empty">${esc(S.errors[T.motifs])}. Applique d'abord la migration RH.</td></tr>`;
    return;
  }
  tbody.innerHTML=S.motifs.length ? S.motifs.map(r=>`<tr data-id="${r.id}">
    <td><input class="act" type="checkbox" ${r.Actif?"checked":""}></td>
    <td><strong>${esc(r.Code||"")}</strong></td>
    <td><input class="lib" value="${esc(r.Libelle||"")}"></td>
    <td><input class="pres" type="number" step="0.1" value="${num(r.Presence_Equivalent)}"></td>
    <td><input class="abs" type="number" step="0.1" value="${num(r.Absence_Equivalent)}"></td>
    <td><input class="cap" type="checkbox" ${r.Compte_Capacite?"checked":""}></td>
    <td><button class="btn secondary save-motif">Sauver</button></td>
  </tr>`).join("") : '<tr><td colspan="7" class="empty">La table Motifs_RH est vide.</td></tr>';
  tbody.querySelectorAll(".save-motif").forEach(b=>b.addEventListener("click",async()=>{
    const tr=b.closest("tr");
    try{
      await grist.getTable(T.motifs).update({id:Number(tr.dataset.id),fields:{
        Actif:tr.querySelector(".act").checked,
        Libelle:tr.querySelector(".lib").value.trim(),
        Presence_Equivalent:num(tr.querySelector(".pres").value),
        Absence_Equivalent:num(tr.querySelector(".abs").value),
        Compte_Capacite:tr.querySelector(".cap").checked
      }});
      toast("Motif enregistré"); await load();
    }catch(e){logError("Enregistrement motif",e?.message||String(e));toast(e?.message||String(e));}
  }));
}

function teams(){
  const tbody=$("teamRows"); if(!tbody)return;
  tbody.innerHTML=S.teams.length
    ? S.teams.map(r=>`<tr><td>${esc(r.Code||"")}</td><td>${esc(r.Libelle||"")}</td><td>${esc(r.Description||"")}</td></tr>`).join("")
    : `<tr><td colspan="3" class="empty">${S.errors[T.teams] ? esc(S.errors[T.teams]) : "La table Team_ref est présente mais vide."}</td></tr>`;
}

function renderDiagnostic(){
  const tableBody=$("diagTables"), logBody=$("diagLog"), badge=$("diagBadge");
  if(!tableBody||!logBody)return;
  const defs=[
    [T.team,S.team],[T.teams,S.teams],[T.motifs,S.motifs],[T.alerts,S.alerts]
  ];
  tableBody.innerHTML=defs.map(([name,rows])=>{
    const err=S.errors[name];
    const visible=S.available.includes(name);
    const state=err?"Erreur":(visible?"OK":"Absente");
    const detail=err||(!visible?"Table non visible par le widget":"");
    return `<tr><td><strong>${esc(name)}</strong></td><td>${esc(state)}</td><td>${visible&&!err?rows.length:"—"}</td><td>${esc(detail)}</td></tr>`;
  }).join("");
  logBody.innerHTML=S.log.length?S.log.map(x=>`<tr><td>${x.time.toLocaleTimeString("fr-FR")}</td><td>${esc(x.action)}</td><td>${esc(x.message)}</td></tr>`).join(""):'<tr><td colspan="3" class="empty">Aucune erreur enregistrée pendant cette session.</td></tr>';
  if(badge){
    badge.textContent=S.log.length?`• ${S.log.length}`:"";
    badge.className=S.log.length?"diag-count":"";
  }
}

function nav(){
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
    S.currentView=b.dataset.view; const target=b.dataset.view==="diagnostic"?$("diagnosticView"):$(b.dataset.view); window.PmoPresence?.touch?.();
    if(target)target.classList.add("active");
    const t={
      ressources:["Ressources","Référentiel Team partagé avec le PMO"],
      seuils:["Seuils","Paramètres des alertes RH"],
      motifs:["Motifs RH","Règles de présence et capacité"],
      equipes:["Équipes","Référentiel Team_ref partagé avec le PMO"],
      diagnostic:["Diagnostic","État technique du widget et erreurs de la session"]
    };
    if(t[b.dataset.view]){
      $("title").textContent=t[b.dataset.view][0];
      $("subtitle").textContent=t[b.dataset.view][1];
    }
  }));
}


function presenceContext(){
  const labels={ressources:"Ressources",seuils:"Seuils",motifs:"Motifs RH",equipes:"Équipes",diagnostic:"Diagnostic"};
  return {module:"Admin RH",context:labels[S.currentView]||"Administration RH",contextId:""};
}

function wireUI(){
  nav();
  $("refresh").addEventListener("click",load);
  if($("applyRecommended"))$("applyRecommended").addEventListener("click",()=>applyRecommendedThresholds());
  $("newResource").addEventListener("click",reset);
  $("resetResource").addEventListener("click",reset);
  $("saveResource").addEventListener("click",()=>saveResource().catch(e=>{logError("Enregistrement ressource",e?.message||String(e));toast(e?.message||String(e));}));
  $("diagRefresh").addEventListener("click",load);
  $("diagClear").addEventListener("click",clearLog);
}

grist.ready({requiredAccess:"full"});
async function bootAdminRH(){
  const allowed=await window.PmoAccess?.guard({module:"ADMIN_RH",label:"Administration RH"});
  if(!allowed)return;
  wireUI();
  window.PmoPresence?.start({widget:"ADMIN_RH",version:VERSION,getContext:presenceContext});
  await load();
}
bootAdminRH().catch(e=>{console.error(e);window.PmoAccess?.guard({module:"ADMIN_RH",label:"Administration RH"});});
