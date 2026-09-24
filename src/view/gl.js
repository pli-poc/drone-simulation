/** Small, replaceable WebGL2 primitive renderer. No application state or simulation logic. */
const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export function multiply(a,b){const c=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[j*4+i]+=a[k*4+i]*b[j*4+k];return c;}
export function cameraMatrix(eye,target,aspect){
  const z=normalize(eye.map((v,i)=>v-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x);
  const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  const f=1/Math.tan(Math.PI/8),n=0.05,far=100;
  return multiply(new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]),view);
}
export const color=(hex,alpha=1)=>[...hex.match(/\w\w/g).map(v=>parseInt(v,16)/255),alpha];
export class Geometry{
  constructor(){this.vertices=[];this.lines=[];}
  triangle(a,b,c,rgba){const n=normalize(cross(b.map((v,i)=>v-a[i]),c.map((v,i)=>v-a[i])));for(const p of [a,b,c])this.vertices.push(...p,...n,...rgba);}
  line(a,b,rgba){for(const p of [a,b])this.lines.push(...p,0,1,0,...rgba);}
  box(p,s,rgba,yaw=0){
    const co=Math.cos(yaw),si=Math.sin(yaw),v=[];
    for(const [x,y,z]of [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]])v.push([p[0]+x*s[0]/2*co+z*s[2]/2*si,p[1]+y*s[1]/2,p[2]-x*s[0]/2*si+z*s[2]/2*co]);
    for(const [a,b,c,d]of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){this.triangle(v[a],v[b],v[c],rgba);this.triangle(v[a],v[c],v[d],rgba);}
  }
  cylinder(p,r,h,rgba,sides=18){
    for(let i=0;i<sides;i++){const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;
      const v=[a,b].map(t=>[p[0]+Math.cos(t)*r,p[1]-h/2,p[2]+Math.sin(t)*r]),u=v.map(q=>[q[0],p[1]+h/2,q[2]]);
      this.triangle(v[0],u[0],u[1],rgba);this.triangle(v[0],u[1],v[1],rgba);this.triangle([p[0],p[1]+h/2,p[2]],u[1],u[0],rgba);
    }
  }
  octahedron(p,s,rgba){const v=[[0,s,0],[s,0,0],[0,0,s],[-s,0,0],[0,0,-s],[0,-s,0]].map(q=>q.map((x,i)=>x+p[i]));for(let i=1;i<5;i++){const j=i===4?1:i+1;this.triangle(v[0],v[j],v[i],rgba);this.triangle(v[5],v[i],v[j],rgba);}}
  ring(p,r,rgba,plane='xz'){
    const point=t=>plane==='xy'?[p[0]+Math.cos(t)*r,p[1]+Math.sin(t)*r,p[2]]:plane==='yz'?[p[0],p[1]+Math.cos(t)*r,p[2]+Math.sin(t)*r]:[p[0]+Math.cos(t)*r,p[1],p[2]+Math.sin(t)*r];
    for(let i=0;i<48;i++)this.line(point(i*Math.PI/24),point((i+1)*Math.PI/24),rgba);
  }
}
export class GL{
  constructor(canvas){
    this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:false});if(!gl)throw new Error('WebGL2 is unavailable. Enable hardware acceleration or try a current desktop browser.');
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,`#version 300 es\nin vec3 pos;in vec3 normal;in vec4 tint;uniform mat4 vp;out vec3 n;out vec4 c;void main(){gl_Position=vp*vec4(pos,1.);n=normal;c=tint;}`);
    const fs=shader(gl.FRAGMENT_SHADER,`#version 300 es\nprecision mediump float;in vec3 n;in vec4 c;uniform float lighting;out vec4 outColor;void main(){float l=.58+.42*max(dot(normalize(n),normalize(vec3(-.4,1.,.6))),0.);outColor=vec4(c.rgb*mix(1.,l,lighting),c.a);}`);
    const program=this.program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.deleteShader(vs);gl.deleteShader(fs);
    this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    for(const [name,n,offset]of [['pos',3,0],['normal',3,12],['tint',4,24]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,n,gl.FLOAT,false,40,offset);}
    this.uVP=gl.getUniformLocation(program,'vp');this.uLighting=gl.getUniformLocation(program,'lighting');gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);canvas.dataset.webgl='ready';
  }
  render(staticGeometry,dynamicGeometry,eye,target){
    const gl=this.gl,c=this.canvas,dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(c.clientWidth*dpr)),h=Math.max(1,Math.round(c.clientHeight*dpr));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(0.039,0.071,0.098,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    this.vp=cameraMatrix(eye,target,w/h);gl.uniformMatrix4fv(this.uVP,false,this.vp);
    for(const [key,mode,light]of [['vertices',gl.TRIANGLES,1],['lines',gl.LINES,0]]){
      gl.uniform1f(this.uLighting,light);const data=new Float32Array(staticGeometry[key].length+dynamicGeometry[key].length);data.set(staticGeometry[key]);data.set(dynamicGeometry[key],staticGeometry[key].length);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.drawArrays(mode,0,data.length/10);
    }
  }
  project(p){const a=this.vp;if(!a)return {x:-100,y:-100,visible:false};const q=[0,0,0,0];for(let i=0;i<4;i++)q[i]=a[i]*p[0]+a[4+i]*p[1]+a[8+i]*p[2]+a[12+i];return {x:(q[0]/q[3]*0.5+0.5)*this.canvas.clientWidth,y:(-q[1]/q[3]*0.5+0.5)*this.canvas.clientHeight,visible:q[3]>0&&Math.abs(q[0]/q[3])<1&&Math.abs(q[1]/q[3])<1};}
}
