const T={team:"Team",teams:"Team_ref",motifs:"Motifs_RH",alerts:"Parametres_Alertes"};const S={team:[],teams:[],motifs:[],alerts:[],editing:null};const $=id=>document.getElementById(id),esc=(s="")=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])),num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;const toast=m=>{const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)};
async function load(){
  $("sync").textContent="Synchronisation…";
  try {
    const available = await grist.docApi.listTables();
    const missing = Object.values(T).filter(name => !available.includes(name));
    if (missing.length) throw new Error(`Tables Grist absentes : ${missing.join(", ")}`);
    const [a,b,c,d]=await Promise.all([
      grist.docApi.fetchTable(T.team),
      grist.docApi.fetchTable(T.teams),
      grist.docApi.fetchTable(T.motifs),
      grist.docApi.fetchTable(T.alerts)
    ]);
    S.team=a||[]; S.teams=b||[]; S.motifs=c||[]; S.alerts=d||[];
    $("sync").textContent=`Synchronisé · Team ${S.team.length} · Équipes ${S.teams.length}`;
    render();
    if (!S.team.length) toast("La table Team est vide");
  } catch(e) {
    console.error(e);
    $("sync").textContent="Erreur de chargement";
    toast(e.message||String(e));
    throw e;
  }
}
function render(){resources();thresholds();motifs();teams()}
function resources(){
  const rows=S.team.slice().sort((a,b)=>String(a.nom||"").localeCompare(String(b.nom||"")));
  $("resourceRows").innerHTML=rows.length
    ? rows.map(r=>`<tr class="clickable" data-id="${r.id}"><td>${esc(r.nom)}</td><td>${esc(teamName(r.equipe))}</td><td>${esc(r.role||"")}</td><td>${num(r.capacite_ETP).toFixed(1)}</td><td>${r.actif?"Oui":"Non"}</td></tr>`).join("")
    : '<tr><td colspan="5" class="empty">La table Team ne contient aucune ressource.</td></tr>';
  $("resourceRows").querySelectorAll("tr[data-id]").forEach(tr=>tr.onclick=()=>edit(Number(tr.dataset.id)));
  $("resEquipe").innerHTML='<option value="0">—</option>'+S.teams.map(t=>`<option value="${t.id}">${esc(t.Libelle||t.Code||`Équipe ${t.id}`)}</option>`).join("");
}
function edit(id){const r=S.team.find(x=>x.id===id);if(!r)return;S.editing=id;$("resourceFormTitle").textContent=`Modifier ${r.nom}`;$("resNom").value=r.nom||"";$("resEmail").value=r.email||"";$("resEquipe").value=r.equipe||0;$("resRole").value=r.role||"";$("resEtp").value=num(r.capacite_ETP,1);$("resCost").value=num(r.cout_Journalier);$("resActif").checked=!!r.actif}
function reset(){S.editing=null;$("resourceFormTitle").textContent="Nouvelle ressource";["resNom","resEmail","resRole","resCost"].forEach(x=>$(x).value="");$("resEtp").value=1;$("resEquipe").value=0;$("resActif").checked=true}
async function saveResource(){const nom=$("resNom").value.trim();if(!nom)return toast("Nom obligatoire");const fields={nom,email:$("resEmail").value.trim(),equipe:Number($("resEquipe").value||0),role:$("resRole").value.trim(),capacite_ETP:num($("resEtp").value,1),cout_Journalier:num($("resCost").value),actif:$("resActif").checked};const table=grist.getTable(T.team);S.editing?await table.update({id:S.editing,fields}):await table.create({fields});reset();toast("Ressource enregistrée");await load()}
function thresholds(){$("alertRows").innerHTML=S.alerts.map(r=>`<tr data-id="${r.id}"><td><input class="act" type="checkbox" ${r.Actif?"checked":""}></td><td><strong>${esc(r.Libelle)}</strong><br><small>${esc(r.Code_Alerte)}</small></td><td><input class="win" type="number" value="${num(r.Fenetre_Jours)}"></td><td><input class="orange" type="number" step="0.1" value="${num(r.Seuil_Orange)}"></td><td><input class="red" type="number" step="0.1" value="${num(r.Seuil_Rouge)}"></td><td>${esc(r.Unite||"")}</td><td><button class="btn secondary save-alert">Sauver</button></td></tr>`).join("");$("alertRows").querySelectorAll(".save-alert").forEach(b=>b.onclick=async()=>{const tr=b.closest("tr");await grist.getTable(T.alerts).update({id:Number(tr.dataset.id),fields:{Actif:tr.querySelector(".act").checked,Fenetre_Jours:num(tr.querySelector(".win").value),Seuil_Orange:num(tr.querySelector(".orange").value),Seuil_Rouge:num(tr.querySelector(".red").value)}});toast("Seuil enregistré");await load()})}
function motifs(){$("motifRows").innerHTML=S.motifs.map(r=>`<tr data-id="${r.id}"><td><input class="act" type="checkbox" ${r.Actif?"checked":""}></td><td><strong>${esc(r.Code)}</strong></td><td><input class="lib" value="${esc(r.Libelle)}"></td><td><input class="pres" type="number" step="0.1" value="${num(r.Presence_Equivalent)}"></td><td><input class="abs" type="number" step="0.1" value="${num(r.Absence_Equivalent)}"></td><td><input class="cap" type="checkbox" ${r.Compte_Capacite?"checked":""}></td><td><button class="btn secondary save-motif">Sauver</button></td></tr>`).join("");$("motifRows").querySelectorAll(".save-motif").forEach(b=>b.onclick=async()=>{const tr=b.closest("tr");await grist.getTable(T.motifs).update({id:Number(tr.dataset.id),fields:{Actif:tr.querySelector(".act").checked,Libelle:tr.querySelector(".lib").value.trim(),Presence_Equivalent:num(tr.querySelector(".pres").value),Absence_Equivalent:num(tr.querySelector(".abs").value),Compte_Capacite:tr.querySelector(".cap").checked}});toast("Motif enregistré");await load()})}
function teams(){
  $("teamRows").innerHTML=S.teams.length
    ? S.teams.map(r=>`<tr><td>${esc(r.Code||"")}</td><td>${esc(r.Libelle||"")}</td><td>${esc(r.Description||"")}</td></tr>`).join("")
    : '<tr><td colspan="3" class="empty">La table Team_ref est vide.</td></tr>';
}
function nav(){document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$(b.dataset.view).classList.add("active");const t={ressources:["Ressources","Référentiel Team partagé avec le PMO"],seuils:["Seuils","Paramètres des alertes RH"],motifs:["Motifs RH","Règles de présence et capacité"],equipes:["Équipes","Référentiel Team_ref partagé avec le PMO"]};$("title").textContent=t[b.dataset.view][0];$("subtitle").textContent=t[b.dataset.view][1]})}
nav();$("refresh").onclick=load;$("newResource").onclick=reset;$("resetResource").onclick=reset;$("saveResource").onclick=()=>saveResource().catch(e=>toast(e.message||e));grist.ready({requiredAccess:"full"});load().catch(e=>toast(e.message||e));