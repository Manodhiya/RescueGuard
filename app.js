

try{const t=localStorage.getItem("rg_token"),s=localStorage.getItem("rg_server");
  if(t)CONFIG.TOKEN=t;if(s)CONFIG.SERVER=s}catch(e){}
document.addEventListener("DOMContentLoaded",()=>{});
window.addEventListener("load",()=>{
  const $$=id=>document.getElementById(id);
  if(!CONFIG.TOKEN.startsWith("PASTE")){$$("tok").value=CONFIG.TOKEN}else{$$("setup").open=true}
  $$("srv").value=CONFIG.SERVER;
  $$("save").onclick=()=>{
    CONFIG.TOKEN=$$("tok").value.trim()||CONFIG.TOKEN;CONFIG.SERVER=$$("srv").value;
    try{localStorage.setItem("rg_token",CONFIG.TOKEN);localStorage.setItem("rg_server",CONFIG.SERVER)}catch(e){}
    pollBlynk();
  };
});
const WORKERS = [
  {id:1,name:"Worker 1",role:"Helmet RG-01 (live)",live:true},
  {id:2,name:"Worker 2",role:"Helmet RG-02 (demo)"},
  {id:3,name:"Worker 3",role:"Helmet RG-03 (demo)"},
  {id:4,name:"Worker 4",role:"Helmet RG-04 (demo)"}
];
WORKERS.forEach(w=>{w.d={temp:30,gas:"SAFE",gasLevel:1500,fall:"NORMAL",sos:"NORMAL",overall:"SAFE"};
  w.hist=[];w.log=[];w.prev=null;w.seen=0;w.offline=false;w.fallUntil=0;w.sosUntil=0});
let sel=1, sound=false, actx=null;
const $=id=>document.getElementById(id);
const isNormal=v=>v==null||v===0||/^(normal|safe|ok|0|false)$/i.test(String(v).trim());

function status(w){
  const d=w.d,r=[];let lv=0;
  const up=(l,t)=>{r.push(t);lv=Math.max(lv,l)};
  if(!isNormal(d.sos))up(2,"SOS pressed");
  if(!isNormal(d.fall))up(2,"Fall detected");
  if(/emerg/i.test(d.gas))up(2,"Gas emergency");else if(/warn/i.test(d.gas))up(1,"Gas warning");
  const t=Number(d.temp);
  if(t>=CONFIG.TEMP_EMERGENCY)up(2,"High temperature");else if(t>=CONFIG.TEMP_WARN)up(1,"Temperature warning");
  if(/emerg/i.test(d.overall))lv=Math.max(lv,2);else if(/warn/i.test(d.overall))lv=Math.max(lv,1);
  return{level:lv,reasons:r};
}

/* ---- live data from Blynk ---- */
async function pollBlynk(){
  const w=WORKERS[0],p=CONFIG.PINS,base=`https://${CONFIG.SERVER}/external/api/`;
  if(CONFIG.TOKEN.startsWith("PASTE")){setConn("off","Add your Blynk token in the CONFIG section");return}
  try{
    const on=await (await fetch(`${base}isHardwareConnected?token=${CONFIG.TOKEN}`)).text();
    w.offline=on.trim()!=="true";
    const q=Object.values(p).map(x=>x.toLowerCase()).join("&");
    const r=await fetch(`${base}get?token=${CONFIG.TOKEN}&${q}`);
    if(!r.ok)throw new Error("HTTP "+r.status);
    const j=await r.json(),g=k=>j[p[k].toLowerCase()],now=Date.now();document.getElementById("raw").textContent=JSON.stringify(j);
    const d={temp:g("temp"),gas:g("gasStatus"),gasLevel:g("gasLevel"),fall:g("fall"),sos:g("sos"),overall:g("overall")};
    if(!isNormal(d.fall))w.fallUntil=now+CONFIG.LATCH_MS;
    if(!isNormal(d.sos))w.sosUntil=now+CONFIG.LATCH_MS;
    if(w.fallUntil>now)d.fall="FALL DETECTED";
    if(w.sosUntil>now)d.sos="SOS EMERGENCY";
    w.d=d;push(w);
    setConn(w.offline?"off":"on",w.offline?"Helmet offline · showing last known values":"Helmet online · updated "+new Date().toLocaleTimeString());
  }catch(e){setConn("off","Cannot reach Blynk ("+e.message+"). Open this file in Chrome (not WhatsApp or a preview) and check the token.")}
}

/* ---- dummy workers ---- */
function simulate(){
  WORKERS.slice(1).forEach(w=>{
    const d=w.d;
    d.temp=+(Math.min(36,Math.max(26,Number(d.temp)+(Math.random()-.5)*1.2))).toFixed(1);
    d.gasLevel=Math.round(Math.min(2400,Math.max(900,Number(d.gasLevel)+(Math.random()-.5)*160)));
    d.gas="SAFE";d.fall="NORMAL";d.sos="NORMAL";d.overall="SAFE";
    push(w);
  });
}

function push(w){
  const d=w.d,t=Date.now(),s=status(w);
  w.seen=t;
  w.hist.push({t,gas:Number(d.gasLevel),temp:Number(d.temp)});
  if(w.hist.length>60)w.hist.shift();
  const now=w.offline?"OFFLINE":(s.level?s.reasons.join(", ")||"Warning":"SAFE");
  if(now!==w.prev){
    const msg=now==="OFFLINE"?"Helmet went offline":now==="SAFE"?"Back to safe":(s.level===2?"EMERGENCY: ":"Warning: ")+now;
    w.log.unshift({t,msg,bad:now!=="SAFE"});
    if(w.log.length>30)w.log.pop();
    if(s.level===2&&!w.offline&&w.live)beep();
    w.prev=now;
  }
  if(w.id===sel)render();
  renderList();
}
function setConn(c,t){$("cdot").className="dot "+c;$("ctext").textContent=t}

/* ---- rendering ---- */
function renderList(){
  $("workers").innerHTML=WORKERS.map(w=>{
    const s=status(w).level,off=w.offline;
    const c=off?"off":["","warn","bad"][s],txt=off?"OFFLINE":["SAFE","WARNING","EMERGENCY"][s];
    return `<button class="w" data-id="${w.id}" aria-pressed="${w.id===sel}"><div><b>${w.name}</b><small>${w.role}</small></div><span class="pill ${c}">${txt}</span></button>`;
  }).join("");
  document.querySelectorAll(".w").forEach(b=>b.onclick=()=>{sel=+b.dataset.id;render();renderList()});
}
function setTile(id,val,lv){$("v-"+id).textContent=val;$("t-"+id).className="tile"+(lv===2?" bad":lv===1?" warn":"")}
function render(){
  const w=WORKERS.find(x=>x.id===sel),d=w.d,s=status(w),lv=s.level;
  $("bname").textContent=w.name+" · "+w.role;
  if(w.offline){$("bstate").textContent="HELMET OFFLINE";$("banner").className="banner off";$("bsub").textContent="No connection. Values below are the last received."}
  else{
    $("bstate").textContent=["SAFE","WARNING","EMERGENCY"][lv];
    $("banner").className="banner"+(lv===2?" bad":lv===1?" warn":"");
    $("bsub").textContent=lv?s.reasons.join(" + "):(w.seen?"All readings normal":"Waiting for data");
  }
  const t=Number(d.temp),tl=t>=CONFIG.TEMP_EMERGENCY?2:t>=CONFIG.TEMP_WARN?1:0;
  const gl2=/emerg/i.test(d.gas)?2:/warn/i.test(d.gas)?1:0;
  setTile("temp",d.temp==null?"--":d.temp+" °C",tl);
  setTile("gas",d.gas==null?"--":d.gas,gl2);
  setTile("fall",isNormal(d.fall)?"NORMAL":"FALL!",isNormal(d.fall)?0:2);
  setTile("sos",isNormal(d.sos)?"NORMAL":"SOS!",isNormal(d.sos)?0:2);
  const gl=Math.max(0,Math.min(4095,Number(d.gasLevel)||0));
  $("arc").setAttribute("stroke-dasharray",(gl/4095*100)+" 100");
  $("arc").setAttribute("stroke",["var(--blue)","#e89b00","var(--bad)"][gl2]);
  $("gnum").textContent=gl;
  $("log").innerHTML=w.log.length?w.log.map(e=>`<li class="${e.bad?"e":""}">${new Date(e.t).toLocaleTimeString()} · ${e.msg}</li>`).join(""):"<li>No events yet</li>";
  drawChart(w);
}

function drawChart(w){
  const c=$("chart"),x=c.getContext("2d"),W=c.width,H=c.height,cs=getComputedStyle(document.documentElement);
  x.clearRect(0,0,W,H);
  x.strokeStyle=cs.getPropertyValue("--line");x.fillStyle=cs.getPropertyValue("--mute");x.font="12px Barlow, sans-serif";
  for(let i=0;i<=4;i++){const y=10+i*(H-30)/4;x.beginPath();x.moveTo(40,y);x.lineTo(W,y);x.stroke();x.fillText(Math.round(4095-i*1024),2,y+4)}
  const h=w.hist;if(h.length<2)return;
  const line=(key,max,col)=>{x.strokeStyle=col;x.lineWidth=2.5;x.beginPath();
    h.forEach((p,i)=>{const px=40+i*(W-40)/59,py=10+(1-Math.min(1,p[key]/max))*(H-30);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()};
  line("gas",4095,"#0b62ff");line("temp",100,"#e89b00");
}

/* ---- alarm sound ---- */
function beep(){
  if(!sound)return;
  try{const o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);
  o.frequency.value=880;g.gain.value=.15;o.start();o.stop(actx.currentTime+.6)}catch(e){}
}
$("snd").onclick=()=>{sound=!sound;if(sound&&!actx)actx=new (window.AudioContext||window.webkitAudioContext)();
  $("snd").textContent="Alarm sound: "+(sound?"on":"off");if(sound)beep()};

renderList();render();
pollBlynk();setInterval(pollBlynk,CONFIG.POLL_MS);
simulate();setInterval(simulate,2000);
