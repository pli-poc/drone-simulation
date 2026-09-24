/** Reduced-order Drosophila flight. SI units, Y up, body X right / Z forward.
 * New implementation, not a port of flybody or a connectome. See docs/BIOLOGICAL-MODEL.md.
 * Published reference: Vaxenburg et al. (2025), doi:10.1038/s41586-025-09029-4.
 */
export const PROFILE=Object.freeze({id:'drosophila-rom-v1',species:'Drosophila melanogaster',mass:0.983e-6,bodyLength:0.00297,span:0.00604,frequency:218,wingLength:0.0025,wingArea:2.2e-6,airDensity:1.225,CL:1.8,CD0:0.12,CD90:2.5});
const PI=Math.PI,TAU=2*PI,G=9.81;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const scale=(a,s)=>a.map(x=>x*s);
export const length=a=>Math.hypot(...a);
export const unit=a=>scale(a,1/(length(a)||1));
export const limited=(a,n)=>scale(a,Math.min(1,n/(length(a)||1)));
export function rotate(q,v){const t=scale(cross(q.slice(1),v),2);return add(v,add(scale(t,q[0]),cross(q.slice(1),t)));}
export const inverseRotate=(q,v)=>rotate([q[0],-q[1],-q[2],-q[3]],v);
export function qmul(a,b){return [a[0]*b[0]-dot(a.slice(1),b.slice(1)),...add(add(scale(b.slice(1),a[0]),scale(a.slice(1),b[0])),cross(a.slice(1),b.slice(1)))];}
export function integrateQuaternion(q,w,dt){const speed=length(w),half=speed*dt/2,d=[Math.cos(half),...scale(w,speed>1e-12?Math.sin(half)/speed:dt/2)],out=qmul(q,d);return scale(out,1/Math.hypot(...out));}
// Four radial strips of a semi-elliptical planform; area normalized to the stated assumption.
const STRIPS=Array.from({length:4},(_,i)=>{const r=(i+0.5)/4;return {r,weight:Math.sqrt(1-r*r)};});
const total=STRIPS.reduce((a,s)=>a+s.weight,0);for(const s of STRIPS)s.area=PROFILE.wingArea*s.weight/total;
/** Translational quasi-steady blade-element forces. No vortex history, added mass or wing inertia. */
export function wingForces(phase,act,velocity=[0,0,0],omega=[0,0,0],frequency=PROFILE.frequency){
  const force=[0,0,0],torque=[0,0,0],wings=[];let power=0;
  for(const side of [-1,1]){
    const amplitude=act.amplitude*(1+side*act.roll),phi=amplitude*Math.sin(phase)+act.pitch;
    const dphi=TAU*frequency*amplitude*Math.cos(phase),sgn=dphi>=0?1:-1;
    const alpha=clamp(PI/4+side*act.yaw*sgn,0.1,1.4),radial=[side*Math.cos(phi),0,Math.sin(phi)],tangent=[-side*Math.sin(phi),0,Math.cos(phi)];
    const normal=add([0,Math.cos(alpha),0],scale(tangent,-sgn*Math.sin(alpha))),f=[0,0,0];
    for(const strip of STRIPS){
      const r=strip.r*PROFILE.wingLength,point=add([side*0.00052,0,0],scale(radial,r));
      const wingVelocity=scale(tangent,dphi*r),v=add(velocity,add(cross(omega,point),wingVelocity));
      const u=add(v,scale(radial,-dot(v,radial))),speed=length(u);if(speed<1e-10)continue;
      const dir=scale(u,1/speed),sinAlpha=clamp(dot(dir,normal),-1,1),a=Math.asin(Math.abs(sinAlpha));
      const CL=PROFILE.CL*Math.sin(2*a),CD=PROFILE.CD0+PROFILE.CD90*Math.sin(a)**2;
      const lift=unit(add(normal,scale(dir,-sinAlpha))),q=0.5*PROFILE.airDensity*strip.area*speed*speed;
      const df=scale(add(scale(lift,-Math.sign(sinAlpha)*CL),scale(dir,-CD)),q),dt=cross(point,df);
      for(let i=0;i<3;i++){f[i]+=df[i];force[i]+=df[i];torque[i]+=dt[i];}
      power+=Math.max(0,-dot(df,wingVelocity));
    }
    wings.push({side,stroke:phi,feather:sgn*alpha,amplitude,force:f});
  }
  return {force,torque,power,wings};
}
export function meanWingForces(act,frequency=PROFILE.frequency,samples=96){const force=[0,0,0],torque=[0,0,0];let power=0;for(let k=0;k<samples;k++){const f=wingForces(TAU*(k+0.5)/samples,act,[0,0,0],[0,0,0],frequency);for(let i=0;i<3;i++){force[i]+=f.force[i]/samples;torque[i]+=f.torque[i]/samples;}power+=f.power/samples;}return {force,torque,power};}
let trimAmplitude=null;
export function hoverTrim(){if(trimAmplitude!==null)return trimAmplitude;let lo=0.2,hi=1.8;for(let i=0;i<24;i++){const m=(lo+hi)/2;if(meanWingForces({amplitude:m,roll:0,pitch:0,yaw:0}).force[1]<PROFILE.mass*G)lo=m;else hi=m;}return trimAmplitude=(lo+hi)/2;}
/** Newton-Euler free body. The stabilizer changes wing kinematics, never sets p/v/q directly. */
export class FlyBody{
  constructor({p=[0,1.5,0],massScale=1,frequency=218,dt=0.0002}={}){
    if(!Number.isFinite(massScale)||massScale<0.5||massScale>2)throw new Error('massScale must be between 0.5 and 2.');
    if(!Number.isFinite(frequency)||frequency<100||frequency>350)throw new Error('frequency outside experiment bounds.');
    if(!Number.isFinite(dt)||dt<0.000025||dt>0.0005)throw new Error('physics dt must be 25–500 microseconds.');
    this.p=[...p];this.v=[0,0,0];this.q=[1,0,0,0];this.omega=[0,0,0];this.time=0;this.phase=0;this.dt=dt;this.frequency=frequency;this.mass=PROFILE.mass*massScale;
    const a=0.00045,b=0.00045,c=PROFILE.bodyLength/2;this.inertia=[b*b+c*c,a*a+c*c,a*a+b*b].map(x=>this.mass*x/5);
    this.act={amplitude:hoverTrim(),roll:0,pitch:0,yaw:0};this.target={...this.act};this.controller=true;this.wingsEnabled=true;this.gyroEnabled=true;this.filteredOmega=[0,0,0];this.lastForces={force:[0,0,0],torque:[0,0,0],power:0,wings:[]};this.controlClock=0;this.verticalWingForce=0;this.forceMean=[0,0,0];this.liftMean=0;this.powerMean=0;this.steps=0;this.collision=false;
  }
  control(desiredVelocity){
    const acc=limited(desiredVelocity.map((x,i)=>(x-this.v[i])*8),10),up=rotate(this.q,[0,1,0]);
    const desiredUp=unit([acc[0],G+acc[1],acc[2]]),error=inverseRotate(this.q,cross(up,desiredUp));
    const forward=rotate(this.q,[0,0,1]);let yawError=0;
    if(this.alignHeading!==false&&Math.hypot(desiredVelocity[0],desiredVelocity[2])>0.06){const heading=Math.atan2(desiredVelocity[0],desiredVelocity[2]),current=Math.atan2(forward[0],forward[2]);yawError=Math.atan2(Math.sin(heading-current),Math.cos(heading-current));}
    error[1]+=clamp(yawError,-0.8,0.8)*0.3;
    const rates=this.gyroEnabled?this.filteredOmega:[0,0,0];
    const torque=error.map((e,i)=>this.inertia[i]*(64000*e-450*rates[i]));
    const thrust=this.mass*clamp(G+acc[1],3,20)/Math.max(0.55,up[1]),r=0.0017;
    this.target={amplitude:clamp(hoverTrim()*Math.sqrt(thrust/(PROFILE.mass*G))*PROFILE.frequency/this.frequency,0.35,1.65),roll:clamp(torque[2]/(2*thrust*r),-0.18,0.18),pitch:clamp(-torque[0]/(thrust*r),-0.30,0.30),yaw:clamp(torque[1]/(thrust*r),-0.20,0.20)};
  }
  step(dt,desiredVelocity=[0,0,0],wind=[0,0,0]){
    if(!Number.isFinite(dt)||dt<=0||dt>0.1)throw new Error('Step must be in (0, 0.1] seconds.');
    const n=Math.ceil(dt/this.dt),h=dt/n;
    for(let k=0;k<n;k++){
      const smooth=1-Math.exp(-h/0.002);for(let i=0;i<3;i++)this.filteredOmega[i]+=(this.omega[i]-this.filteredOmega[i])*smooth;
      this.controlClock-=h;if(this.controlClock<=0){if(this.controller)this.control(desiredVelocity);this.controlClock+=0.001;}
      for(const key of ['amplitude','roll','pitch','yaw'])this.act[key]+=(this.target[key]-this.act[key])*smooth;
      this.phase=(this.phase+TAU*this.frequency*h)%TAU;
      const relative=this.v.map((v,i)=>v-wind[i]),local=inverseRotate(this.q,relative);
      const aero=this.wingsEnabled?wingForces(this.phase,this.act,local,this.omega,this.frequency):{force:[0,0,0],torque:[0,0,0],power:0,wings:[]};this.lastForces=aero;
      const wingForce=rotate(this.q,aero.force),force=[...wingForce],speed=length(relative);this.verticalWingForce=wingForce[1];
      // Body drag + cycle-averaged wing damping; phenomenological coefficients, not measured fits.
      for(let i=0;i<3;i++)force[i]-=(1.5e-7+3.5e-7*speed)*relative[i];force[1]-=this.mass*G;
      const gyroscopic=cross(this.omega,this.omega.map((w,i)=>w*this.inertia[i]));
      for(let i=0;i<3;i++){const damping=this.inertia[i]*(this.wingsEnabled?45:3)*this.omega[i];this.omega[i]+=(aero.torque[i]-gyroscopic[i]-damping)/this.inertia[i]*h;this.v[i]+=force[i]/this.mass*h;this.p[i]+=this.v[i]*h;}
      this.q=integrateQuaternion(this.q,this.omega,h);this.time+=h;this.steps++;
      const l=1-Math.exp(-h/0.025);this.liftMean+=(wingForce[1]-this.liftMean)*l;for(let i=0;i<3;i++)this.forceMean[i]+=(wingForce[i]-this.forceMean[i])*l;this.powerMean+=(aero.power-this.powerMean)*l;
      if(![...this.p,...this.v,...this.q,...this.omega].every(Number.isFinite)||length(this.omega)>5000)throw new Error('Biological solver diverged; reset and inspect settings.');
    }
  }
  snapshot(){const up=rotate(this.q,[0,1,0]);return {model:PROFILE.id,p:[...this.p],v:[...this.v],q:[...this.q],omega:[...this.omega],time:this.time,phase:this.phase,frequency:this.frequency,mass:this.mass,wingEnabled:this.wingsEnabled,controllerEnabled:this.controller,tilt:Math.acos(clamp(up[1],-1,1)),act:{...this.act},lift:this.verticalWingForce,liftMean:this.liftMean,forceMean:[...this.forceMean],weight:this.mass*G,power:this.lastForces.power,powerMean:this.powerMean,wings:this.lastForces.wings.map(w=>({...w,force:[...w.force]})),steps:this.steps,dt:this.dt};}
}
