"""Real Chromium smoke checks. Python/Playwright are test-only dependencies, not site requirements."""
import json, os, pathlib, shutil, subprocess, sys, time, unittest, urllib.request
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results'
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173/drone-simulation/')

class BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        OUT.mkdir(exist_ok=True)
        cls.server=None
        if not os.environ.get('TEST_BASE_URL'):
            cls.server=subprocess.Popen(['node','scripts/serve.mjs'],cwd=ROOT,stdout=subprocess.DEVNULL)
            for _ in range(100):
                try:
                    urllib.request.urlopen(BASE,timeout=1);break
                except Exception: time.sleep(.1)
            else: raise RuntimeError('Local site did not start')
        cls.pw=sync_playwright().start()
        executable=os.environ.get('CHROMIUM_PATH') or (shutil.which('chromium') if not os.environ.get('CI') else None)
        cls.browser=cls.pw.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.pw.stop()
        if cls.server: cls.server.terminate();cls.server.wait(timeout=10)
    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':1512,'height':1050},device_scale_factor=1)
        self.context.tracing.start(screenshots=True,snapshots=True,sources=True)
        self.page=self.context.new_page();self.errors=[];self.external=[]
        self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.on('request',lambda r:self.external.append(r.url) if r.url.startswith('http') and not r.url.startswith(BASE.split('/drone-simulation/')[0]) else None)
        self.page.goto(BASE)
        self.page.wait_for_selector('body[data-ready="true"]',timeout=20000)
    def tearDown(self):
        self.page.screenshot(path=str(OUT/(self._testMethodName+'.png')),full_page=True)
        self.context.tracing.stop(path=str(OUT/(self._testMethodName+'.zip')))
        self.context.close()
        self.assertEqual(self.errors,[],'Unhandled browser errors')
        self.assertEqual(self.external,[],'Unexpected external runtime requests')
    def test_01_render_and_controls(self):
        self.assertEqual(self.page.locator('#scene').get_attribute('data-webgl'),'ready')
        self.page.click('#pause');self.page.wait_for_function("document.querySelector('#run-state').textContent==='PAUSED'")
        before=self.page.locator('#clock').inner_text();self.page.wait_for_timeout(200)
        self.assertEqual(self.page.locator('#clock').inner_text(),before)
        self.page.click('#step');self.page.wait_for_timeout(250)
        self.assertNotEqual(self.page.locator('#clock').inner_text(),before)
        self.page.select_option('#scenario','dynamic');self.page.select_option('#task','navigation')
        self.assertEqual(self.page.locator('#scene-name').inner_text(),'Moving occupant')
        self.page.check('#rays');self.page.check('#envelope');self.page.click('#top');self.page.click('#follow');self.page.click('#orbit')
        self.page.click('#about');self.assertTrue(self.page.locator('#model-card').is_visible());self.page.click('#close-about')
        with self.page.expect_download() as d:self.page.click('#export-run')
        path=d.value.path();data=json.loads(pathlib.Path(path).read_text());self.assertEqual(data['schema'],'mosquito-drone-lab/experiment@1')
    def test_02_training_and_policy_export(self):
        self.page.select_option('#scenario','arena');self.page.fill('#duration','5');self.page.locator('#duration').dispatch_event('change');self.page.fill('#episodes','2');self.page.click('#train')
        self.page.wait_for_function("document.querySelector('#training-status').textContent.startsWith('Completed')",timeout=120000)
        self.assertIn('UPDATES',self.page.locator('#updates').inner_text());self.assertGreater(int(self.page.locator('#updates').inner_text().split()[0]),0)
        self.assertEqual(self.page.locator('#benchmark tr').count(),3)
        self.page.click('#apply-policy');self.assertEqual(self.page.locator('#controller').input_value(),'learned')
        with self.page.expect_download() as d:self.page.click('#export-policy')
        data=json.loads(pathlib.Path(d.value.path()).read_text());self.assertEqual(data['dimensions'],[19,24,7]);self.assertGreater(data['meta']['updates'],0)
        self.page.reload();self.page.wait_for_selector('body[data-ready="true"]');self.assertTrue(self.page.locator('#apply-policy').is_enabled());self.assertEqual(self.page.locator('#controller').input_value(),'baseline')
    def test_03_invalid_import_and_cancel(self):
        self.page.locator('#policy-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"schema":"wrong"}'})
        self.page.wait_for_function("document.querySelector('#error').textContent.includes('Import rejected')")
        self.assertTrue(self.page.locator('#apply-policy').is_disabled())
        self.page.fill('#episodes','300');self.page.click('#train');self.page.click('#cancel-train')
        self.page.wait_for_function("document.querySelector('#training-status').textContent.startsWith('Cancelled')",timeout=10000)
        self.assertTrue(self.page.locator('#train').is_visible())
    def test_04_mobile_layout_and_project_paths(self):
        self.page.set_viewport_size({'width':390,'height':844});self.page.wait_for_timeout(300)
        self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
        for path in ['build.json','docs/EXECUTION-BRIEF.md','src/workers/training.worker.js']:
            response=self.page.request.get(BASE+path);self.assertEqual(response.status,200,path)
        self.page.click('#top');self.assertTrue(self.page.locator('#scene').is_visible())

if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(BrowserTests)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    OUT.mkdir(exist_ok=True)
    (OUT/'browser-results.json').write_text(json.dumps({'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),'passed':result.wasSuccessful(),'failureDetails':[str(t)+': '+e for t,e in result.failures+result.errors]},indent=2))
    sys.exit(0 if result.wasSuccessful() else 1)
