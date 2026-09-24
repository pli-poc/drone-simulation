import {BioView} from '../biology/view.js';
const $=id=>document.getElementById(id);let worker,view,running=false,manifest=null,coordinates=null,points=null,latest=null;
const tell=(type,extra={})=>worker?.postMessage({type,...extra});
function fail(message){$('error').textContent=message;$('error').hidden=false;$('load').disabled=false;}
function download(data){const u=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='whole-cns-flight-experiment.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function brainPlot(){if(!coordinates||!latest)return;const c=$('brain'),dpr=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;
  if(c.width!==w*dpr||c.height!==h*dpr||!points){c.width=w*dpr;c.height=h*dpr;points=document.createElement('canvas');points.width=c.width;points.height=c.height;const x=points.getContext('2d');x.scale(dpr,dpr);x.fillStyle='#203e48';let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(let i=0;i<coordinates.length;i+=3){if(!coordinates[i]&&!coordinates[i+1]&&!coordinates[i+2])continue;minX=Math.min(minX,coordinates[i]);maxX=Math.max(maxX,coordinates[i]);minZ=Math.min(minZ,coordinates[i+2]);maxZ=Math.max(maxZ,coordinates[i+2]);}
    points.project=i=>[14+(coordinates[i*3]-minX)/Math.max(1,maxX-minX)*(w-28),14+(coordinates[i*3+2]-minZ)/Math.max(1,maxZ-minZ)*(h-28)];
    for(let i=0;i<coordinates.length/3;i++){if(!coordinates[i*3]&&!coordinates[i*3+1]&&!coordinates[i*3+2])continue;const [a,b]=points.project(i);x.fillRect(a,b,1,1);}}
  const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.drawImage(points,0,0);x.scale(dpr,dpr);
  for(const [time,i] of latest.neural.sampleSpikes){if(!coordinates[i*3]&&!coordinates[i*3+1]&&!coordinates[i*3+2])continue;const age=latest.neural.time-time;if(age>.05)continue;const [a,b]=points.project(i);x.fillStyle=`rgba(124,255,200,${Math.max(.1,1-age/.05)})`;x.fillRect(a-1,b-1,2.5,2.5);}
}
try{
  view=new BioView($('body'));worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});document.body.dataset.uiReady='true';
  worker.onerror=e=>fail(e.message);worker.onmessage=({data:m})=>{
    if(m.type==='error'){fail(m.message);return;}
    if(m.type==='loading'){$('load-status').textContent=m.message;$('load-progress').value=m.total?m.loaded/m.total*100:0;return;}
    if(m.type==='ready'){manifest=m.manifest;coordinates=m.coordinates;for(const [id,key] of [['n-count','neurons'],['e-count','connections'],['s-count','synapses']])$(id).textContent=manifest[key].toLocaleString('en-GB');
      $('load-status').textContent='Verified full traced-neuron graph. No sampled-network substitution.';$('load').textContent='Full graph loaded';$('provenance').textContent=`${manifest.zeroEfficacyNeurons.toLocaleString()} neurons have unresolved or neuromodulatory efficacy in this LIF baseline; ${manifest.zeroEfficacyConnections.toLocaleString()} retained connections therefore have zero efficacy. The source contains ${manifest.sourceRows.toLocaleString()} raw segment-pair rows; all exclusions are in the manifest.`;
      for(const id of ['run','advance','reset','export','loom-left','loom-right','gust','pulse'])$(id).disabled=false;document.body.dataset.neuralReady='true';return;}
    if(m.type==='snapshot'){latest=m.snapshot;view.snapshot=latest;running=m.running;$('run').textContent=running?'Ⅱ Pause':'▶ Run';$('clock').textContent=(latest.neural.time*1000).toFixed(1)+' ms';$('spike-count').textContent=latest.neural.spikes.toLocaleString();$('output-spikes').textContent=latest.neural.outputSpikes.toLocaleString();$('altitude').textContent=latest.p[1].toFixed(4)+' m';$('command').textContent=latest.neural.command.map(x=>x.toFixed(3)).join(' / ')+' m/s';
      $('rates').replaceChildren(...['LC4_L','LC4_R','LPLC2_L','LPLC2_R','DNp01_L','DNp01_R','wing_motor_L','wing_motor_R'].map(k=>{const d=document.createElement('div'),b=document.createElement('b');d.textContent=k.replace('_',' / ')+' ';b.textContent=(latest.neural.rates[k]||0).toFixed(1)+' Hz';d.append(b);return d;}));
      $('events').replaceChildren(...latest.events.slice().reverse().map(e=>{const li=document.createElement('li');li.textContent=`${(e.time*1000).toFixed(1)} ms · ${e.kind||e.key}${e.side?' / side '+e.side:''}${'enabled'in e?' / '+(e.enabled?'enabled':'disabled'):''}`;return li;}));brainPlot();return;}
    if(m.type==='export')download({...m.experiment,build:$('build').dataset.commit||'local'});
  };
  $('load').onclick=()=>{$('load').disabled=true;tell('load');};$('run').onclick=()=>tell('running',{value:!running});$('advance').onclick=()=>tell('advance');$('reset').onclick=()=>{for(const e of document.querySelectorAll('[data-toggle]'))e.checked=true;tell('reset',{dtMs:Number($('dt').value)});};$('dt').onchange=()=>{if(manifest)$('reset').click();};$('rate').onchange=()=>tell('rate',{value:Number($('rate').value)});$('export').onclick=()=>tell('export');
  for(const side of ['left','right'])$('loom-'+side).onclick=()=>tell('stimulus',{kind:'loom',side:side==='left'?-1:1});for(const kind of ['gust','pulse'])$(kind).onclick=()=>tell('stimulus',{kind});
  for(const input of document.querySelectorAll('[data-toggle]'))input.onchange=()=>{if(manifest)tell('toggle',{key:input.dataset.toggle,value:input.checked});else input.checked=true;};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&manifest)tell('running',{value:false});});window.addEventListener('resize',brainPlot);
  fetch('./build.json').then(r=>r.json()).then(b=>{$('build').textContent=`v${b.version} / ${b.commit.slice(0,8)}`;$('build').dataset.commit=b.commit;}).catch(()=>{});
}catch(e){fail(e.message);}
