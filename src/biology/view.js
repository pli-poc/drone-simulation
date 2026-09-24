/** Illustrative anatomy assembled from ellipsoids, not the upstream microscopy mesh. */
import {Geometry,GL,color} from '../view/gl.js';
import {rotate,add,scale,clamp,PROFILE} from './model.js';
const amber=color('d9ad65'),dark=color('684c2e'),eye=color('ab604d'),vein=color('c5deca',0.55),wing=color('a9d8d0',0.22);
export function drawFly(g,p,q,act,phase,magnification=1,wingsEnabled=true){
  const transform=v=>add(p,rotate(q,scale(v,magnification)));
  function ellipsoid(center,size,c){const v=(u,t)=>transform(center.map((x,i)=>x+[Math.cos(u)*Math.sin(t)*size[0],Math.cos(t)*size[1],Math.sin(u)*Math.sin(t)*size[2]][i]));for(let j=0;j<8;j++)for(let i=0;i<14;i++){const a=i*2*Math.PI/14,b=(i+1)*2*Math.PI/14,t=j*Math.PI/8,s=(j+1)*Math.PI/8;g.triangle(v(a,t),v(b,t),v(b,s),c);g.triangle(v(a,t),v(b,s),v(a,s),c);}}
  ellipsoid([0,0,-0.00065],[0.00045,0.00039,0.00082],amber);ellipsoid([0,0,0.0003],[0.00048,0.00043,0.00058],dark);ellipsoid([0,0.00008,0.00101],[0.00050,0.00041,0.00040],amber);
  for(const side of [-1,1]){
    ellipsoid([side*0.00036,0.00015,0.0011],[0.00022,0.00027,0.00025],eye);
    const A=act.amplitude*(1+side*act.roll),phi=wingsEnabled?A*Math.sin(phase)+act.pitch:-0.75,sgn=Math.cos(phase)>=0?1:-1,feather=sgn*clamp(Math.PI/4+side*act.yaw*sgn,0.1,1.4);
    const radial=[side*Math.cos(phi),0,Math.sin(phi)],tangent=[-side*Math.sin(phi),0,Math.cos(phi)];
    const hinge=[side*0.00052,0,0],w=(r,chord)=>transform(add(hinge,add(scale(radial,r),add(scale(tangent,chord*Math.cos(feather)),[0,chord*Math.sin(feather),0]))));
    const outline=[w(0,0)];for(let i=0;i<=12;i++){const a=i*Math.PI/12,r=PROFILE.wingLength*(1-Math.cos(a))/2,chord=Math.sin(a)*0.00055;outline.push(w(r,chord));}for(let i=12;i>=0;i--){const a=i*Math.PI/12,r=PROFILE.wingLength*(1-Math.cos(a))/2;outline.push(w(r,-Math.sin(a)*0.00055));}
    for(let i=1;i<outline.length-1;i++){g.triangle(outline[0],outline[i],outline[i+1],wing);g.line(outline[i],outline[i+1],vein);}g.line(w(0,0),w(PROFILE.wingLength,0),vein);g.line(w(.001,0),w(.0018,.0003),vein);
    for(let leg=0;leg<3;leg++){const a=[side*.00032,-.00025,.0005-leg*.0004],b=[side*.00063,-.00050,.0004-leg*.00055],c=[side*.00048,-.00074,.00055-leg*.00058];g.line(transform(a),transform(b),amber);g.line(transform(b),transform(c),amber);}
    g.line(transform([side*.0001,.0002,.0013]),transform([side*.00023,.0003,.0017]),dark);
  }
}
export class BioView{
  constructor(canvas){this.gl=new GL(canvas);this.canvas=canvas;this.angle=.72;this.pitch=.45;this.zoom=10;this.snapshot=null;let drag=null;
    canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;this.angle-=(e.clientX-drag[0])*.006;this.pitch=Math.max(-.2,Math.min(1.45,this.pitch+(e.clientY-drag[1])*.005));drag=[e.clientX,e.clientY];});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>drag=null);
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(5,Math.min(24,this.zoom+e.deltaY*.008));},{passive:false});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.dataset.webgl='lost';});
    const frame=()=>{if(this.snapshot&&canvas.dataset.webgl!=='lost')this.draw();requestAnimationFrame(frame);};requestAnimationFrame(frame);
  }
  draw(){const s=this.snapshot,b=s.bio,g=new Geometry(),floor=new Geometry();
    // Camera follows CoM. Display units are millimetres; the physics stays in SI metres.
    for(let i=-6;i<=6;i++){floor.line([i,-1.25,-6],[i,-1.25,6],color('486275',.18));floor.line([-6,-1.25,i],[6,-1.25,i],color('486275',.18));}
    drawFly(g,[0,0,0],b.q,b.act,b.phase,1000,b.wingEnabled);
    const mean=b.forceMean||[0,b.liftMean,0];g.line([0,0,0],scale(mean,Math.min(3/b.weight,5/(Math.hypot(...mean)||1))),color('63e5c6'));
    g.line([0,0,0],[0,-2.7,0],color('ffbc70'));g.line([0,0,0],scale(b.v,8),color('7ca7f8'));
    const eye=[Math.sin(this.angle)*Math.cos(this.pitch)*this.zoom,Math.sin(this.pitch)*this.zoom,Math.cos(this.angle)*Math.cos(this.pitch)*this.zoom];this.gl.render(floor,g,eye,[0,0,0]);
  }
}
