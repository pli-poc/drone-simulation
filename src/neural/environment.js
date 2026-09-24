import {Environment} from '../core/environment.js';
import {NeuralInsect} from './insect.js';
import {loadConnectome} from './assets.js';
export async function environmentFactory(config,progress=()=>{}){
  if(config.insectModel!=='neural')return c=>new Environment(c);
  const graph=await loadConnectome(progress);
  const make=c=>new Environment(c,{insectFactory:(p,seed,options)=>new NeuralInsect(p,seed,options,graph)});make.neuralManifest=graph.manifest;return make;
}
