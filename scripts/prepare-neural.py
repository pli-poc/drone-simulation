"""Build browser assets from the unmodified, hash-pinned HHMI MaleCNS v1.0 tables.
Build-time Python only. All traced neurons and every positive connection between them
are retained. No weight threshold, population sampling or invented edges.
"""
import gzip, hashlib, json, os, pathlib, struct, urllib.request
import numpy as np
import pandas as pd
import pyarrow.ipc as ipc
import pyarrow.feather as feather

ROOT = 'https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/'
SOURCES = {
 'body-annotations-male-cns-v1.0-minconf-0.5.feather': ('2177e246113e4cfbf1e7772ec37c6da1955ff22e8063d0b1f833101f99a9a3b2','1780494878811468'),
 'body-neurotransmitters-male-cns-v1.0.feather': ('95c9289220663abeb3409f3ad9e5a7f8a53f8093f5139d15502cd08da8879621','1780894899156750'),
 'connectome-weights-male-cns-v1.0-minconf-0.5.feather': ('e35da783d1c686b2b58b3b87cd6a403ae43bfcfba8bff28e08ef752c1a56afc1','1780494887545976')
}
SIGN = {'acetylcholine':1,'gaba':-1,'glutamate':-1,'histamine':-1}

def sha_file(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        while b:=f.read(4*1024*1024): h.update(b)
    return h.hexdigest()

def main():
    cache=pathlib.Path(os.environ.get('NEURAL_CACHE','.cache/neural'));cache.mkdir(parents=True,exist_ok=True)
    out=pathlib.Path('assets/neural');out.mkdir(parents=True,exist_ok=True)
    provenance=[]
    for name,(digest,generation) in SOURCES.items():
        path=cache/name
        if not path.exists() or sha_file(path)!=digest:
            temp=path.with_suffix('.partial')
            with urllib.request.urlopen(ROOT+name+'?generation='+generation,timeout=180) as r, temp.open('wb') as f:
                while block:=r.read(4*1024*1024):f.write(block)
            if sha_file(temp)!=digest: raise ValueError('Official source checksum mismatch: '+name)
            temp.replace(path)
        provenance.append({'url':ROOT+name,'generation':generation,'sha256':digest,'bytes':path.stat().st_size})
    a=feather.read_feather(cache/next(iter(SOURCES)))
    status_counts={str(k):int(v) for k,v in a.status.value_counts(dropna=False).items()}
    a=a[a.status=='Traced'].sort_values('bodyId').reset_index(drop=True)
    ids=a.bodyId.to_numpy(dtype=np.int64);n=len(ids)
    assert n==165122 and np.all(np.diff(ids)>0) and ids.max()<2**32
    nt=feather.read_feather(cache/'body-neurotransmitters-male-cns-v1.0.feather').set_index('body').reindex(ids)
    nt_labels=nt.consensus_nt.fillna('unknown')
    signs=np.array([SIGN.get(x,0) for x in nt_labels],dtype='<i4')
    # Neuromodulatory/unknown outputs remain in topology, but have zero efficacy in this LIF baseline.
    groups={}
    masks={'LC4':a.type.eq('LC4'),'LPLC2':a.type.eq('LPLC2'),'DNp01':a.type.eq('DNp01'),'DNg02':a.type.fillna('').str.match(r'^DNg02(?:_|$)'),'DNa02':a.type.eq('DNa02'),'wing_motor':a.superclass.eq('vnc_motor') & a.subclass.eq('wm'),'haltere':a.subclass.eq('haltere')}
    for name,mask in masks.items():
        for side in ['L','R']:
            indices=np.flatnonzero(mask & a.somaSide.eq(side)).tolist()
            groups[name+'_'+side]=indices
    assert all(groups[k] for k in ['LC4_L','LC4_R','LPLC2_L','LPLC2_R','DNp01_L','DNp01_R'])
    pre_parts=[];post_parts=[];weight_parts=[];rows=0;excluded_rows=0;excluded_synapses=0
    reader=ipc.open_file(str(cache/'connectome-weights-male-cns-v1.0-minconf-0.5.feather'))
    for b in range(reader.num_record_batches):
        batch=reader.get_batch(b);p=batch.column('body_pre').to_numpy();q=batch.column('body_post').to_numpy();w=batch.column('weight').to_numpy()
        pi=np.searchsorted(ids,p);qi=np.searchsorted(ids,q)
        keep=(pi<n)&(qi<n);keep &= (ids[np.minimum(pi,n-1)]==p)&(ids[np.minimum(qi,n-1)]==q)&(w>0)
        rows+=len(w);excluded_rows+=int((~keep).sum());excluded_synapses+=int(w[~keep].sum())
        pre_parts.append(pi[keep].astype(np.uint32));post_parts.append(qi[keep].astype(np.uint32));weight_parts.append(w[keep].astype(np.uint32))
        if b%400==0: print('Read connection batch',b,'/',reader.num_record_batches,flush=True)
    pre=np.concatenate(pre_parts);post=np.concatenate(post_parts);weights=np.concatenate(weight_parts)
    del pre_parts,post_parts,weight_parts
    order=np.lexsort((post,pre));pre=pre[order];post=post[order];weights=weights[order];del order
    if np.any((pre[1:]==pre[:-1])&(post[1:]==post[:-1])):raise ValueError('Duplicate neuron-pair rows require explicit aggregation')
    m=len(post);offsets=np.zeros(n+1,dtype='<u4');offsets[1:]=np.cumsum(np.bincount(pre,minlength=n),dtype=np.uint64)
    coordinates=np.zeros((n,3),dtype='<f4');located=np.zeros(n,dtype=bool)
    for i,p in enumerate(a.somaLocation):
        if p is not None and len(p)==3: coordinates[i]=np.array(p)*0.008;located[i]=True
    path=out/'connectome.bin'
    with path.open('wb') as f:
        f.write(struct.pack('<4sIII',b'MCNS',1,n,m))
        for array in [offsets,post.astype('<u4'),weights.astype('<u4'),ids.astype('<u4'),signs,coordinates]:f.write(array.tobytes())
    raw_sha=sha_file(path);raw_size=path.stat().st_size
    zipped=out/'connectome.bin.gz'
    with path.open('rb') as src,zipped.open('wb') as target,gzip.GzipFile(filename='',fileobj=target,mode='wb',mtime=0,compresslevel=6) as dest:
        while chunk:=src.read(4*1024*1024):dest.write(chunk)
    # Identities for all modeled neurons, not just the displayed populations.
    cells={'bodyId':ids.tolist(),'type':a.type.fillna('').tolist(),'instance':a.instance.fillna('').tolist(),'superclass':a.superclass.fillna('').tolist(),'somaSide':a.somaSide.fillna('').tolist(),'located':located.tolist(),'consensusNT':nt_labels.tolist()}
    with gzip.GzipFile(filename='',fileobj=(out/'cells.json.gz').open('wb'),mode='wb',mtime=0) as f:f.write(json.dumps(cells,separators=(',',':')).encode())
    population={k:[{'index':int(i),'bodyId':int(ids[i]),'type':str(a.type.iloc[i]),'side':str(a.somaSide.iloc[i])} for i in indices] for k,indices in groups.items()}
    manifest={'schema':'mosquito-drone-lab/malecns-assets@1','dataset':'male-cns:v1.0','sourceDate':'2026-06-08','license':'CC-BY-4.0','licenseURL':'https://creativecommons.org/licenses/by/4.0/','attribution':'FlyEM / HHMI Janelia, University of Cambridge, MRC LMB and Google Research; Berg et al., Cell 2026, doi:10.1016/j.cell.2026.08.015','selection':'Every annotation with status == Traced; every positive connection row with both endpoints in that set. No additional synapse-count cutoff. Not all raw segmentation fragments.','neurons':n,'connections':m,'synapses':int(weights.sum(dtype=np.uint64)),'sourceRows':rows,'excludedRows':excluded_rows,'excludedSynapses':excluded_synapses,'annotationStatuses':status_counts,'signRule':SIGN,'zeroEfficacyNeurons':int((signs==0).sum()),'zeroEfficacyConnections':int((signs[pre]==0).sum()),'ntCounts':{str(k):int(v) for k,v in nt_labels.value_counts().items()},'sources':provenance,'groups':groups,'populationIdentities':population,'assets':{'graph':{'file':'connectome.bin.gz','sha256':sha_file(zipped),'bytes':zipped.stat().st_size,'decodedSha256':raw_sha,'decodedBytes':raw_size},'cells':{'file':'cells.json.gz','sha256':sha_file(out/'cells.json.gz'),'bytes':(out/'cells.json.gz').stat().st_size}},'coordinateUnits':'micrometres, MaleCNS original EM frame; missing soma positions explicitly flagged','dynamics':'NOT measured electrophysiology. Proposed LIF dynamics and receptor-sign approximation are project assumptions.'}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2))
    path.unlink()
    print(json.dumps({k:v for k,v in manifest.items() if k not in ['groups','populationIdentities']},indent=2),flush=True)
if __name__=='__main__':main()
