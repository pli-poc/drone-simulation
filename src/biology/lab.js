import {BioView} from './view.js';
import {PROFILE} from './model.js';
const $=id=>document.getElementById(id);let running=true,view,worker,history=[],lastTime=-1;
const message=(type,extra={})=>worker?.postMessage({type,...extra});
function settings(){return {task:$('bio-task').value,frequency:Number($('frequency').value),massScale:Number($('mass').value),...Object.fromEntries(['vision','gyro','wings','stabilizer'].map(k=>[k,$(k).checked]))};}
function labels(){$('frequency-value').textContent=$('frequency').value+' Hz';$('mass-value').textContent=(PROFILE.mass*1e6*Number($('mass').value)).toFixed(3)+' mg';$('train-link').href=`./?insect=biological&frequency=${$('frequency').value}&massScale=${$('mass').value}`;}
function chart(){const c=$('bio-chart'),w=c.clientWidth,h=c.clientHeight,dpr=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,w*dpr);c.height=Math.max(1,h*dpr);const ctx=c.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);const max=Math.max(25,...history.map(s=>s.lift*1e6));ctx.strokeStyle='#2b444f';for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0,h*i/4);ctx.lineTo(w,h*i/4);ctx.stroke();}
  for(const [key,color]of [['lift','#517b71'],['liftMean','#63e5c6'],['weight','#e7b978']]){ctx.strokeStyle=color;ctx.lineWidth=key==='liftMean'?1.6:1;ctx.beginPath();history.forEach((s,i)=>{const x=i/Math.max(1,history.length-1)*w,y=h-6-Math.max(0,s[key]*1e6)/max*(h-12);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}}
function metric(id,value,unit){$(id).replaceChildren(document.createTextNode(value));const small=document.createElement('small');small.textContent=unit;$(id).append(small);}
function fail(text){$('error').textContent=text;$('error').hidden=false;message('running',{value:false});}
try{
  view=new BioView($('bio-scene'));worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
  worker.onerror=e=>fail(e.message);worker.onmessage=({data:m})=>{
    if(m.type==='error'){fail(m.message);return;}
    if(m.type==='export'){const data={...m.experiment,build:$('build-link').dataset.commit||'local'},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='biological-flight-experiment.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(m.type!=='snapshot')return;const s=m.snapshot,b=s.bio;running=m.running;view.snapshot=s;document.body.dataset.ready='true';$('bio-pause').textContent=running?'Ⅱ Pause':'▶ Run';$('bio-state').textContent=(!b.wingEnabled?'WINGS OFF':s.mode).toUpperCase();$('bio-clock').textContent=(b.time*1000).toFixed(1)+' ms';
    metric('bio-speed',s.speed.toFixed(3),'m/s');metric('bio-lift',(b.liftMean/b.weight).toFixed(2),'×');metric('bio-tilt',(b.tilt*180/Math.PI).toFixed(1),'°');metric('bio-altitude',b.p[1].toFixed(3),'m');
    $('bio-loom').textContent=b.sensory.looming.toFixed(2)+' rad/s';$('loom-meter').value=b.sensory.looming;$('bio-angular').textContent=Math.hypot(...b.omega).toFixed(1)+' rad/s';$('bio-left').textContent=(b.act.amplitude*(1-b.act.roll)*180/Math.PI).toFixed(1)+'°';$('bio-right').textContent=(b.act.amplitude*(1+b.act.roll)*180/Math.PI).toFixed(1)+'°';$('bio-power').textContent=(b.powerMean*1e6).toFixed(1)+' μW';$('bio-escapes').textContent=b.escapeEvents;
    $('bio-events').replaceChildren(...s.events.slice(-5).reverse().map(e=>{const li=document.createElement('li');li.textContent=`${(e.time*1000).toFixed(0)} ms / ${e.type}${'enabled'in e?' '+(e.enabled?'on':'off'):''}`;return li;}));
    if(b.time<lastTime)history=[];if(b.time!==lastTime){history.push(b);if(history.length>220)history.shift();lastTime=b.time;}chart();
  };
  $('bio-pause').onclick=()=>message('running',{value:!running});$('bio-step').onclick=()=>message('step');$('bio-reset').onclick=()=>{history=[];message('reset',{config:settings()});};$('bio-rate').onchange=()=>message('rate',{value:Number($('bio-rate').value)});
  for(const key of ['vision','gyro','wings','stabilizer'])$(key).onchange=()=>message('toggle',{key,value:$(key).checked});
  for(const key of ['bio-task','frequency','mass']){$(key).onchange=()=>{labels();message('reset',{config:settings()});};$(key).addEventListener('input',labels);}
  $('loom-left').onclick=()=>message('stimulus',{kind:'loom',side:-1});$('loom-right').onclick=()=>message('stimulus',{kind:'loom',side:1});$('gust').onclick=()=>message('stimulus',{kind:'gust'});$('roll').onclick=()=>message('stimulus',{kind:'roll'});$('bio-export').onclick=()=>message('export');
  document.addEventListener('visibilitychange',()=>{if(document.hidden)message('running',{value:false});});$('bio-scene').addEventListener('webglcontextlost',()=>fail('Graphics context lost. Reload to restore the laboratory.'));window.addEventListener('resize',chart);labels();
  fetch('./build.json').then(r=>r.json()).then(b=>{$('build-link').dataset.commit=b.commit;$('build-link').textContent=`v${b.version} / ${b.commit.slice(0,8)}`;}).catch(()=>{});
}catch(e){fail(e.message);}
