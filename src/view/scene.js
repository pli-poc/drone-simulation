import {GL,Geometry,color} from './gl.js';
import {obstacles} from '../core/world.js';
const C={teal:color('63e5c6'),amber:color('ffbc70'),floor:color('223340'),edge:color('354b5b'),white:color('bed0da'),sofa:color('638396'),wood:color('a18768'),plant:color('498b76'),muted:color('547485',0.45),line:color('527181',0.24)};
export class SceneView{
  constructor(canvas,onFrame){
    this.canvas=canvas;this.gl=new GL(canvas);this.angle=0.75;this.pitch=0.77;this.zoom=12.8;this.mode='orbit';this.trails=true;this.rays=false;this.envelope=false;this.droneTrail=[];this.insectTrail=[];this.snapshot=null;this.static=new Geometry();this.onFrame=onFrame;
    let drag=null;
    canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;this.mode='orbit';this.angle-=(e.clientX-drag[0])*0.006;this.pitch=Math.max(0.22,Math.min(1.48,this.pitch+(e.clientY-drag[1])*0.005));drag=[e.clientX,e.clientY];});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(5,Math.min(23,this.zoom+e.deltaY*0.008));},{passive:false});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.dataset.webgl='lost';});
    const frame=()=>{if(this.snapshot&&canvas.dataset.webgl!=='lost'){this.draw();this.onFrame?.(this);}requestAnimationFrame(frame);};requestAnimationFrame(frame);
  }
  setWorld(world){this.world=world;this.droneTrail=[];this.insectTrail=[];const g=this.static=new Geometry();
    g.box([0,-0.19,0],[8.5,0.24,6.5],C.edge);g.box([0,-0.055,0],[8,0.1,6],C.floor);
    for(let x=-4;x<=4;x+=0.5)g.line([x,0.003,-3],[x,0.003,3],C.line);for(let z=-3;z<=3;z+=0.5)g.line([-4,0.003,z],[4,0.003,z],C.line);
    // Cutaway walls: physical colliders remain full height in the engine.
    g.box([0,0.37,-3.08],[8.15,0.74,0.16],C.edge);g.box([-4.08,0.37,0],[0.16,0.74,6.3],C.edge);
    for(const x of [-4,4])for(const z of [-3,3]){g.line([x,0,z],[x,3,z],C.muted);g.line([x,3,z],[-x,3,z],C.line);g.line([x,3,z],[x,3,-z],C.line);}
    for(const b of world.static){if(['wall','floor','ceiling'].includes(b.kind))continue;let c=C.edge;
      if(b.kind==='sofa')c=C.sofa;if(['wood','table'].includes(b.kind))c=C.wood;if(b.kind==='plant')c=C.plant;if(b.kind==='lamp')c=C.white;
      g.box(b.p,b.size,c);
      if(b.kind==='sofa'){g.box([-2.3,0.91,-2.15],[2.65,0.14,0.37],C.white);for(let x=-3.05;x<-1;x+=0.8)g.box([x,0.901,-1.76],[0.74,0.035,0.67],color('829eae'));}
      if(b.kind==='cabinet'){for(let y=0.4;y<1.5;y+=0.5)g.line([3.217,y,-2.39],[3.217,y,-0.71],C.white);}
      if(b.kind==='plant'){g.cylinder([-3.25,0.2,1.95],0.24,0.4,color('a28a72'));for(const [x,y,z]of [[-3.3,1.17,1.9],[-3.13,0.9,2.07],[-3.42,0.83,1.84]])g.octahedron([x,y,z],0.22,C.plant);}
    }
    // Dock marking and observer-only floor accents have no physical volume.
    g.ring([-0.9,0.012,1.8],0.38,C.teal);g.ring([-0.9,0.013,1.8],0.42,C.muted);
  }
  accept(s){if(this.snapshot&&s.time<this.snapshot.time){this.droneTrail=[];this.insectTrail=[];}this.snapshot=s;this.droneTrail.push([...s.drone.p]);this.insectTrail.push([...s.insect.p]);if(this.droneTrail.length>180){this.droneTrail.shift();this.insectTrail.shift();}}
  draw(){const s=this.snapshot,g=new Geometry(),p=s.drone.p,yaw=s.drone.yaw;
    const rotate=q=>[p[0]+q[0]*Math.cos(yaw)+q[2]*Math.sin(yaw),p[1]+q[1],p[2]-q[0]*Math.sin(yaw)+q[2]*Math.cos(yaw)];
    g.box(p,[0.17,0.09,0.22],color('d6ebe9'),yaw);g.box(rotate([0,0.04,-0.02]),[0.09,0.035,0.12],C.teal,yaw);
    for(const x of [-0.145,0.145])for(const z of [-0.145,0.145]){const q=rotate([x,0,z]);g.line(p,q,C.white);g.cylinder(q,0.073,0.02,color('365869'));g.ring([q[0],q[1]+0.015,q[2]],0.081,C.teal);const a=performance.now()*0.04;g.line([q[0]+Math.cos(a)*0.066,q[1]+0.02,q[2]+Math.sin(a)*0.066],[q[0]-Math.cos(a)*0.066,q[1]+0.02,q[2]-Math.sin(a)*0.066],C.white);}
    const head=rotate([0,0,0.2]);g.ring(head,0.072,C.teal,'xy');g.line(rotate([0,0,0.11]),head,C.teal);
    g.ring([p[0],0.014,p[2]],0.25,color('63e5c6',0.28));g.line([p[0],0.018,p[2]],p,color('63e5c6',0.2));
    const insect=s.insect.p;g.octahedron(insect,0.047,C.amber);g.ring(insect,0.12,color('ffbc70',0.6),'xz');g.line([insect[0],0.015,insect[2]],insect,color('ffbc70',0.16));
    if(this.envelope)for(const plane of ['xy','xz','yz'])g.ring(p,0.28,color('63e5c6',0.35),plane);
    if(this.trails)for(const [points,c]of [[this.droneTrail,color('63e5c6',0.65)],[this.insectTrail,color('ffbc70',0.52)]])for(let i=1;i<points.length;i++)g.line(points[i-1],points[i],c);
    if(s.track)g.line(p,s.track.p,color('ffbc70',0.32));
    if(this.rays)for(const [i,v]of [[0,[1,0,0]],[1,[-1,0,0]],[2,[0,1,0]],[3,[0,-1,0]],[4,[0,0,1]],[5,[0,0,-1]]])g.line(p,p.map((x,j)=>x+v[j]*s.ranges[i]),color('70a6e9',0.55));
    if(s.goal){g.ring(s.goal,0.25,C.teal);g.octahedron(s.goal,0.065,C.teal);}
    for(const b of obstacles(this.world,s.time).filter(b=>b.kind==='person')){g.box(b.p,b.size,color('ae8398',0.85));g.octahedron([b.p[0],1.99,b.p[2]],0.18,color('cca6b5'));g.ring([b.p[0],0.015,b.p[2]],0.9,color('cca6b5',0.8));}
    let target=[0,0.25,0],angle=this.angle,pitch=this.pitch,zoom=this.zoom;
    if(this.mode==='top'){pitch=1.53;angle=0;zoom=12.5;}
    if(this.mode==='follow'){target=p;zoom=4.3;pitch=0.5;angle=yaw+Math.PI;}
    const eye=[target[0]+Math.sin(angle)*Math.cos(pitch)*zoom,target[1]+Math.sin(pitch)*zoom,target[2]+Math.cos(angle)*Math.cos(pitch)*zoom];this.gl.render(this.static,g,eye,target);
  }
}
