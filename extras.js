/* Extra features: summary cards, site map, acknowledge alarm, CSV export, demo scenarios */
let ackUntil=0;
const ZONES=[{n:"Zone A - Entry",x:10,y:10,w:180,h:220},{n:"Zone B - Tunnel",x:200,y:10,w:230,h:105},{n:"Gas area",x:200,y:125,w:230,h:105,hot:1},{n:"Zone C - Exit",x:440,y:10,w:150,h:220}];
const HOME={1:{x:100,y:120},2:{x:300,y:60},3:{x:320,y:180},4:{x:510,y:120}};
const POS=JSON.parse(JSON.stringify(HOME));

function drawSummary(){
  const on=WORKERS.filter(w=>!w.offline).length,act=WORKERS.filter(w=>!w.offline&&status(w).level>0).length;
  const day=new Date().toDateString();
  const n=WORKERS.reduce((a,w)=>a+w.log.filter(e=>e.bad&&!/offline/i.test(e.msg)&&new Date(e.t).toDateString()===day).length,0);
  const card=(l,v,bad)=>`<div class="tile ${bad?"bad":""}"><span>${l}</span><div class="big">${v}</div></div>`;
  $("sum").innerHTML=card("Workers online",on+" / "+WORKERS.length,0)+card("Active alerts",act,act>0)+card("Alerts today",n,0)+
    card("Last live update",WORKERS[0].seen?new Date(WORKERS[0].seen).toLocaleTimeString():"--",0);
}
function drawMap(){
  const col=w=>w.offline?"var(--mute)":["var(--ok)","var(--warn)","var(--bad)"][status(w).level];
  let h=ZONES.map(z=>`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="8" fill="${z.hot?"var(--warnbg)":"var(--bg)"}" stroke="var(--line)"/><text x="${z.x+8}" y="${z.y+18}" font-size="12" fill="var(--mute)">${z.n}</text>`).join("");
  h+=WORKERS.map(w=>{const p=POS[w.id],c=col(w),bad=!w.offline&&status(w).level===2;
    return `<g data-id="${w.id}" style="cursor:pointer">${bad?`<circle cx="${p.x}" cy="${p.y}" r="18" fill="none" stroke="${c}" stroke-width="3" opacity=".5"/>`:""}<circle cx="${p.x}" cy="${p.y}" r="${w.id===sel?11:8}" fill="${c}" stroke="${w.id===sel?"var(--ink)":"#fff"}" stroke-width="2"/><text x="${p.x}" y="${p.y-16}" text-anchor="middle" font-size="12" font-weight="600" fill="currentColor">W${w.id}</text></g>`}).join("");
  $("map").innerHTML=h;
  $("map").querySelectorAll("g").forEach(g=>g.onclick=()=>{sel=+g.dataset.id;render();renderList()});
}
function refresh(){
  drawSummary();drawMap();
  $("ack").style.display=status(WORKERS.find(x=>x.id===sel)).level===2?"":"none";
}
const _render=render;render=function(){_render();refresh()};
const _push=push;push=function(w){_push(w);drawSummary();drawMap()};

/* acknowledge: silences the repeating alarm for 60 s */
const _beep=beep;beep=function(){if(Date.now()>ackUntil)_beep()};
$("ack").onclick=()=>{ackUntil=Date.now()+60000;
  WORKERS.find(x=>x.id===sel).log.unshift({t:Date.now(),msg:"Alarm acknowledged by operator",bad:false});render()};
setInterval(()=>{if(WORKERS.some(w=>!w.offline&&status(w).level===2))beep()},3000);

/* CSV report of the selected worker */
$("csv").onclick=()=>{
  const w=WORKERS.find(x=>x.id===sel);
  const rows=[["time","temperature_C","gas_level"],...w.hist.map(p=>[new Date(p.t).toISOString(),p.temp,p.gas]),[],["time","event"],...w.log.map(e=>[new Date(e.t).toISOString(),e.msg])];
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"}));
  a.download=`worker${w.id}_report.csv`;a.click();
};

/* demo scenarios for the simulated workers (12 s each) */
const SCEN={gas:[3,{gas:"EMERGENCY",gasLevel:3800,overall:"EMERGENCY"}],fall:[2,{fall:"FALL DETECTED",overall:"EMERGENCY"}],sos:[4,{sos:"SOS EMERGENCY",overall:"EMERGENCY"}]};
document.querySelectorAll("[data-scn]").forEach(b=>b.onclick=()=>{
  const [id,d]=SCEN[b.dataset.scn];WORKERS[id-1].demo={until:Date.now()+12000,d};sel=id;render();renderList()});
setInterval(()=>{WORKERS.slice(1).forEach(w=>{
  const p=POS[w.id],h=HOME[w.id];p.x=h.x+(Math.random()-.5)*14;p.y=h.y+(Math.random()-.5)*14;
  if(w.demo&&w.demo.until>Date.now()){Object.assign(w.d,w.demo.d);push(w)}})},700);
refresh();
