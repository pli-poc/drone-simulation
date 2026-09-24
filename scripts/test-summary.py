"""Persist machine-readable verification outcomes, including skipped/missing phases."""
import datetime, json, os, pathlib, xml.etree.ElementTree as ET
root=pathlib.Path('test-results');root.mkdir(exist_ok=True)
unit={'available':False,'tests':0,'failures':0,'errors':0}
try:
    xml=ET.parse(root/'unit.xml').getroot()
    cases=list(xml.iter('testcase'))
    unit={'available':True,'tests':len(cases),'failures':len(list(xml.iter('failure'))),'errors':len(list(xml.iter('error')))}
except (FileNotFoundError,ET.ParseError):pass
browser={'available':False,'tests':0,'passed':False}
try:browser={'available':True,**json.loads((root/'browser-results.json').read_text())}
except (FileNotFoundError,json.JSONDecodeError):pass
benchmark={'available':False}
try:
    data=json.loads((root/'benchmark.json').read_text())
    benchmark={'available':True,'episodes':len(data['rows']),'wallSeconds':data['wallSeconds'],'collisions':sum(r['collisions'] for r in data['rows']),'contacts':sum(r['contacts'] for r in data['rows'])}
except (FileNotFoundError,json.JSONDecodeError):pass
biology={'available':False}
try:
    data=json.loads((root/'biology-benchmark.json').read_text())
    biology={'available':True,'profile':data['profile']['id'],'episodes':len(data['trials']),'droneCollisions':sum(r['collisions'] for r in data['trials']),'insectCollisions':sum(r.get('insectCollisions',0) for r in data['trials']),'physics':data['physics'],'hover':data['hover']}
except (FileNotFoundError,json.JSONDecodeError):pass
neural={'available':False,'passed':False}
try:neural={'available':True,**json.loads((root/'neural-benchmark.json').read_text())}
except (FileNotFoundError,json.JSONDecodeError):pass
passed=neural['available'] and neural['passed'] and biology['available'] and unit['available'] and unit['tests']>0 and unit['failures']==0 and unit['errors']==0 and browser['available'] and browser['passed'] and browser['tests']>0 and browser.get('skipped',0)==0 and benchmark['available'] and os.environ.get('VERIFY_STATUS','success')=='success'
report={'schema':'mosquito-drone-lab/verification@1','commit':os.environ.get('GITHUB_SHA','local'),'run':os.environ.get('GITHUB_RUN_ID','local'),'attempt':os.environ.get('GITHUB_RUN_ATTEMPT','1'),'ref':os.environ.get('GITHUB_REF','local'),'event':os.environ.get('GITHUB_EVENT_NAME','local'),'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'passed':bool(passed),'unit':unit,'browser':browser,'benchmark':benchmark,'biology':biology,'neural':neural,'limitations':'Software verification only; not biological or physical safety validation.'}
(root/'summary.json').write_text(json.dumps(report,indent=2))
summary=f"## Verification {'passed' if passed else 'incomplete / failed'}\n\nCommit: `{report['commit']}`\n\nUnit cases: {unit['tests']}; failures: {unit['failures']}; errors: {unit['errors']}.\n\nBrowser cases: {browser['tests']}; passed: {browser.get('passed',False)}.\n\nBenchmark available: {benchmark['available']}.\n\nDetailed screenshots and traces: evidence artifact, retained 90 days. Compact results: test-history branch.\n\n{report['limitations']}\n"
(root/'summary.md').write_text(summary)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:f.write(summary)
print(json.dumps(report,indent=2))
