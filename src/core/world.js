import {clamp} from './math.js';
export const SCENARIOS={home:'Furnished home',arena:'Open test arena',dynamic:'Moving occupant',passage:'Narrow passage'};
export const DEFAULTS=Object.freeze({scenario:'home',seed:42,speed:1.35,range:5.5,latency:80,agility:0.65,wind:0.12,dropout:0.04,duration:24,task:'contact'});
export function config(input={}) {
  const c={...DEFAULTS};
  if(input.scenario in SCENARIOS) c.scenario=input.scenario;
  if(['contact','navigation'].includes(input.task)) c.task=input.task;
  for(const [key,lo,hi] of [['seed',1,2147483647],['speed',0.3,2.4],['range',0.5,8],['latency',0,500],['agility',0,1.5],['wind',0,0.6],['dropout',0,0.8],['duration',5,90]]) {
    if(typeof input[key]==='number'&&Number.isFinite(input[key])) c[key]=clamp(input[key],lo,hi);
  }
  c.seed=Math.floor(c.seed); return c;
}
const box=(id,p,size,kind='solid')=>({id,p,size,kind});
export function scene(kind='home') {
  const walls=[box('wall-west',[-4.08,1.5,0],[0.16,3,6.3],'wall'),box('wall-east',[4.08,1.5,0],[0.16,3,6.3],'wall'),box('wall-north',[0,1.5,-3.08],[8,3,0.16],'wall'),box('wall-south',[0,1.5,3.08],[8,3,0.16],'wall'),box('floor',[0,-0.1,0],[8.3,0.2,6.3],'floor'),box('ceiling',[0,3.1,0],[8.3,0.2,6.3],'ceiling')];
  let objects=[];
  if(kind!=='arena') objects=[box('sofa',[-2.3,0.44,-1.85],[2.65,0.88,1.05],'sofa'),box('coffee-table',[-2.15,0.34,-0.05],[1.5,0.68,0.85],'table'),box('cabinet',[3.55,0.85,-1.55],[0.65,1.7,1.8],'cabinet'),box('dining-top',[1.65,0.76,1.45],[1.9,0.14,1.15],'wood'),box('plant',[-3.25,0.65,1.95],[0.55,1.3,0.55],'plant'),box('hanging-light',[0.2,2.1,-2.3],[0.6,0.22,0.6],'lamp'),box('lamp-cable',[0.2,2.6,-2.3],[0.025,0.8,0.025],'cable')];
  if(kind!=='arena') for(const x of [0.88,2.42]) for(const z of [1.04,1.86]) objects.push(box(`leg-${x}-${z}`,[x,0.36,z],[0.07,0.72,0.07],'wood'));
  if(kind==='passage') objects.push(box('partition-a',[0.25,1.5,-1.65],[0.22,3,2.7],'partition'),box('partition-b',[0.25,1.5,1.65],[0.22,3,2.7],'partition'));
  return {kind,size:[8,3,6],static:[...walls,...objects],spawn:[-0.9,1.5,1.8],insectSpawn:[1.25,1.75,-0.8]};
}
export function obstacles(world,t) {
  const boxes=world.static;
  if(world.kind!=='dynamic') return boxes;
  return [...boxes,box('occupant',[Math.sin(t*0.55)*1.6,0.9,0.25],[0.5,1.8,0.5],'person')];
}
export function navGoal(t) {
  const route=[[-0.8,1.65,-0.8],[2.15,2.1,-0.2],[1.1,1.7,2.2],[-2.6,1.8,1.6]];
  return route[Math.floor(t/5)%route.length];
}
