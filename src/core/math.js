/** SI units. Right-handed world: X/Z horizontal, Y up. No rendering dependencies. */
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const norm=a=>Math.hypot(...a);
export const unit=a=>mul(a,1/(norm(a)||1));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const limit=(v,n)=>mul(v,Math.min(1,n/(norm(v)||1)));
export const distance=(a,b)=>norm(sub(a,b));
export class RNG {
  constructor(seed=1){this.state=seed>>>0;}
  next(){let t=this.state=(this.state+0x6D2B79F5)>>>0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
  signed(){return this.next()*2-1;}
  normal(){return Math.sqrt(-2*Math.log(Math.max(1e-9,this.next())))*Math.cos(2*Math.PI*this.next());}
}
export function boxDistance(p,b){return Math.hypot(...p.map((v,i)=>Math.max(Math.abs(v-b.p[i])-b.size[i]/2,0)));}
/** Ray/slab intersection. dir need not be normalized; return value is its parameter. */
export function rayBox(p,dir,b,pad=0,max=Infinity){
  let lo=0,hi=max;
  for(let i=0;i<3;i++){
    const a=b.p[i]-b.size[i]/2-pad,c=b.p[i]+b.size[i]/2+pad;
    if(Math.abs(dir[i])<1e-10){if(p[i]<a||p[i]>c)return Infinity;}
    else{let t1=(a-p[i])/dir[i],t2=(c-p[i])/dir[i];if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return Infinity;}
  }
  return lo;
}
export const sweptHit=(a,b,boxes,pad=0)=>boxes.some(box=>rayBox(a,sub(b,a),box,pad,1)<=1);
export function segmentOriginDistance(a,b){const d=sub(b,a),t=clamp(-dot(a,d)/(dot(d,d)||1),0,1);return norm(add(a,mul(d,t)));}
export const AXES=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
