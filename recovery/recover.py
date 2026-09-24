"""Recover the user's three original commits; never update a branch or deploy."""
import base64, gzip, hashlib, json, os, pathlib, subprocess, urllib.request, urllib.error
ROOT=pathlib.Path('recovery')
BASE='e7213994a8d1490a310d8ab7c9f7f3b4e162ec11'
WORKFLOW_BASE='3073bc085ce002ff1c4741839e2b6e0e8dcbd2e7'
FINAL='7b2dd86b664d237059f4f2971e173bab7d51222d'
PATCH_HASH='d3481261f709cc9a268089e8da2bbaac00a0e65eb0538f56efb0d806e2aadf33'
# Transport corrections are explicit and the decoded patch must match its original SHA-256.
corrections={3:[['IPelwU1Uu1n69','IPelwUu1n69'],['pa3ha0e0UXN4','pa3ha0UXN4'],['zxr37DrJZIap','zxr37DrDZIap'],['Dy/zuZwnofyQWx70FUA','Dy/zuZwnofy10FUA']],5:[['EYPvj9x+3+Yo7','EYPvj9x+Yo7']]}
parts=[]
for i in range(1,6):
    text=''.join((ROOT/f'stage3-{i:02}.b64').read_text().split())
    for old,new in corrections.get(i,[]):
        if old in text:
            assert text.count(old)==1, 'Ambiguous transport correction'
            text=text.replace(old,new)
    parts.append(text)
encoded=''.join(parts)
(ROOT/'normalized.b64').write_text(encoded)
patch=gzip.decompress(base64.b64decode(encoded,validate=True))
actual=hashlib.sha256(patch).hexdigest()
assert actual==PATCH_HASH, f'Patch integrity mismatch: {actual}'
(ROOT/'verified-stage3.patch').write_bytes(patch)
def git(*args):
    return subprocess.check_output(['git',*args])
git('read-tree',BASE)
subprocess.run(['git','apply','--cached','recovery/verified-stage3.patch'],check=True)
tree=git('write-tree').decode().strip()
assert tree==FINAL, f'Original source tree mismatch: {tree}'
paths=git('diff','--cached','--name-only','-z',BASE).decode().split('\0')
entries=[]
for path in filter(None,paths):
    mode=git('ls-files','-s','--',path).decode().split()[0]
    assert mode=='100644', f'Unexpected mode: {path}'
    entries.append({'path':path,'mode':mode,'type':'blob','content':git('show',':'+path).decode('utf-8')})
assert len(entries)==19, f'Unexpected changed-file count: {len(entries)}'
# The connected account has already created the workflow update. This job writes source/data only.
entries=[e for e in entries if not e['path'].startswith('.github/')]
api='https://api.github.com/repos/pli-poc/drone-simulation/git/'
def post(endpoint,data):
    req=urllib.request.Request(api+endpoint,data=json.dumps(data).encode(),headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        print('GitHub API error:',exc.code,exc.read().decode('utf-8'))
        raise
result=post('trees',{'base_tree':WORKFLOW_BASE,'tree':entries})
assert result['sha']==FINAL, 'Remote source tree differs'
author={'name':'OpenAI Assistant','email':'assistant@local.invalid','date':'2026-09-24T19:41:33Z'}
commits=[
('9990091779acbce3aabbc5ffd485979bb90bcf50','b4a465061dbccd7bcc9dc4e3f3bc3b244bcc9db2','cbeaadc9dbcfcc9f0a1ec954ae8619f214f34421','feat(biology): add force-driven fruit-fly body and sensory controller\n\nIndependent reduced-order Newton-Euler body, quasi-steady wing elements, and delayed sensory reactions. This is not a full flybody port or connectome; empirical biological validation remains open.\n'),
('1b7c744fab4fb2ca45ec3355396bcdfc24385c9f',BASE,'9990091779acbce3aabbc5ffd485979bb90bcf50','feat(lab): add biological flight experiments and drone-opponent selection\n\nSeparate browser worker, slow motion and physical ablations, actual wing/body telemetry, trace exports, and biological-opponent configuration for the existing independent drone learner. No new runtime library or service.\n'),
('b270303f6ed608974ece6a7a1fe7caeb0cc3ee87',FINAL,'1b7c744fab4fb2ca45ec3355396bcdfc24385c9f','test(biology): preserve numerical and worker evidence with gated browser delivery\n\n51 local Node checks pass, including original regressions and actual training-worker evaluation. Seven browser checks are configured but unverified because this environment blocks navigation/WebGL. Retain CI evidence and exact-commit Pages checks; no remote push or deployment is claimed.\n')]
for expected,tree,parent,message in commits:
    restored=post('commits',{'tree':tree,'parents':[parent],'message':message,'author':author,'committer':author})
    assert restored['sha']==expected, f'Commit identity differs: {restored["sha"]} expected {expected}'
    print('Restored exact original commit:',expected)
report={'patchSha256':actual,'sourceTree':FINAL,'commits':[c[0] for c in commits],'branchesUpdated':False,'deployed':False}
(ROOT/'recovery-result.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
