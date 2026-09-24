/** Strict binary decoder. No test fixture is used as a fallback for missing production data. */
export function decodeConnectome(buffer,manifest){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<16)throw new Error('Truncated connectome.');
  const h=new DataView(buffer);if(h.getUint32(0,true)!==0x534e434d||h.getUint32(4,true)!==1)throw new Error('Unknown connectome format.');
  const n=h.getUint32(8,true),m=h.getUint32(12,true);
  if(!n||n>250000||m>50000000||manifest.neurons!==n||manifest.connections!==m)throw new Error('Connectome census mismatch.');
  const expected=16+4*(n+1)+8*m+20*n;if(buffer.byteLength!==expected)throw new Error('Connectome byte length mismatch.');
  let p=16;const take=(Type,count)=>{const view=new Type(buffer,p,count);p+=count*4;return view;};
  const offsets=take(Uint32Array,n+1),post=take(Uint32Array,m),weight=take(Uint32Array,m),ids=take(Uint32Array,n),sign=take(Int32Array,n),coordinates=take(Float32Array,3*n);
  if(offsets[0]!==0||offsets[n]!==m)throw new Error('Invalid CSR endpoints.');
  for(let i=0;i<n;i++){if(offsets[i]>offsets[i+1]||![0,-1,1].includes(sign[i])||(i&&ids[i]<=ids[i-1]))throw new Error('Invalid neuron/CSR record.');}
  let synapses=0;for(let i=0;i<m;i++){if(post[i]>=n||!weight[i])throw new Error('Invalid connection.');synapses+=weight[i];}
  if(manifest.synapses!==undefined&&synapses!==manifest.synapses)throw new Error('Synapse count mismatch.');
  for(const indices of Object.values(manifest.groups||{}))for(const i of indices)if(!Number.isInteger(i)||i<0||i>=n)throw new Error('Invalid population index.');
  for(const x of coordinates)if(!Number.isFinite(x))throw new Error('Invalid coordinates.');
  return {n,m,offsets,post,weight,ids,sign,coordinates,manifest,buffer};
}
const hex=buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(buffer){return hex(await crypto.subtle.digest('SHA-256',buffer));}
let cached=null;
export async function loadConnectome(progress=()=>{}){
  if(cached)return cached;
  cached=(async()=>{
    const root=new URL('../../assets/neural/',import.meta.url),response=await fetch(new URL('manifest.json',root));
    if(!response.ok)throw new Error('Full connectome assets are unavailable; no surrogate substituted.');
    const manifest=await response.json();if(manifest.schema!=='mosquito-drone-lab/malecns-assets@1'||manifest.dataset!=='male-cns:v1.0'||manifest.neurons!==165122)throw new Error('Unrecognized neural provenance.');
    const asset=manifest.assets.graph;
    if(asset.file!=='connectome.bin.gz'||asset.bytes>300000000||asset.decodedBytes>450000000)throw new Error('Invalid connectome asset limits.');
    if(typeof DecompressionStream==='undefined')throw new Error('This browser needs gzip DecompressionStream support.');
    progress('Loading the full MaleCNS graph',0,asset.bytes);
    const r=await fetch(new URL(asset.file,root));if(!r.ok)throw new Error('Connectome download failed.');
    const chunks=[];let size=0;const reader=r.body.getReader();
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>asset.bytes){await reader.cancel();throw new Error('Unexpected connectome size.');}chunks.push(value);progress('Loading the full MaleCNS graph',size,asset.bytes);}
    const compressed=new Uint8Array(size);let offset=0;for(const c of chunks){compressed.set(c,offset);offset+=c.length;}chunks.length=0;
    if(size!==asset.bytes||await digest(compressed)!==asset.sha256)throw new Error('Compressed connectome SHA-256 mismatch.');
    progress('Checking and decoding all connections',size,size);
    const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const raw=await new Response(stream).arrayBuffer();if(raw.byteLength!==asset.decodedBytes||await digest(raw)!==asset.decodedSha256)throw new Error('Decoded connectome SHA-256 mismatch.');
    const graph=decodeConnectome(raw,manifest);progress('Full graph verified',size,size);return graph;
  })();
  try{return await cached;}catch(e){cached=null;throw e;}
}
