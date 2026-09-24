"""Run all existing browser checks plus the biological-flight integration checks."""
import json, pathlib, re, sys, unittest
from playwright.sync_api import expect
from browser_smoke import BrowserTests, BASE, OUT

class BiologicalBrowserTests(BrowserTests):
    def test_05_biological_lab_and_physical_ablations(self):
        self.page.goto(BASE+'biology.html')
        self.page.wait_for_selector('body[data-ready="true"]')
        self.assertEqual(self.page.locator('#bio-scene').get_attribute('data-webgl'),'ready')
        self.page.screenshot(path=str(OUT/'biology-desktop.png'),full_page=True)
        self.page.click('#bio-pause')
        before=self.page.locator('#bio-clock').inner_text()
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.locator('#bio-clock').inner_text(),before)
        self.page.click('#bio-step')
        expect(self.page.locator('#bio-clock')).not_to_have_text(before)
        self.page.select_option('#bio-rate','1')
        self.page.click('#bio-pause')
        self.page.click('#loom-left')
        expect(self.page.locator('#bio-escapes')).not_to_have_text('0',timeout=10000)
        self.page.uncheck('#wings')
        expect(self.page.locator('#bio-state')).to_have_text('WINGS OFF')
        self.page.wait_for_timeout(400)
        self.page.click('#bio-pause')
        with self.page.expect_download() as d:self.page.click('#bio-export')
        data=json.loads(pathlib.Path(d.value.path()).read_text())
        self.assertEqual(data['schema'],'mosquito-drone-lab/biological-experiment@1')
        self.assertFalse(data['config']['wings'])
        self.assertGreater(len(data['trace']),10)
        self.assertEqual(data['trace'][-1]['lift'],0)
        self.assertLess(data['trace'][-1]['v'][1],-.3)

    def test_06_train_drone_against_biological_opponent(self):
        self.page.goto(BASE+'?insect=biological&frequency=220&massScale=1.1')
        self.page.wait_for_selector('body[data-ready="true"]')
        self.assertEqual(self.page.locator('#insect-model').input_value(),'biological')
        expect(self.page.locator('#insect-note')).to_contain_text('220 Hz')
        self.page.fill('#duration','5');self.page.locator('#duration').dispatch_event('change')
        self.page.fill('#episodes','2');self.page.click('#train')
        expect(self.page.locator('#training-status')).to_have_text(re.compile(r'^Completed'),timeout=180000)
        with self.page.expect_download() as d:self.page.click('#export-policy')
        data=json.loads(pathlib.Path(d.value.path()).read_text())
        self.assertEqual(data['meta']['config']['insectModel'],'biological')
        self.assertEqual(data['meta']['config']['bioFrequency'],220)
        self.assertGreater(data['meta']['updates'],0)
        self.page.screenshot(path=str(OUT/'biology-drone-training.png'),full_page=True)
        self.page.click('#apply-policy')
        self.assertEqual(self.page.locator('#controller').input_value(),'learned')

    def test_07_biology_mobile_and_project_paths(self):
        self.page.set_viewport_size({'width':390,'height':844})
        self.page.goto(BASE+'biology.html')
        self.page.wait_for_selector('body[data-ready="true"]')
        self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
        self.page.screenshot(path=str(OUT/'biology-mobile.png'),full_page=True)
        for path in ['biology.html','src/biology/worker.js','docs/BIOLOGICAL-MODEL.md']:
            self.assertEqual(self.page.request.get(BASE+path).status,200,path)
        self.assertIn('insect=biological',self.page.locator('#train-link').get_attribute('href'))

if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(BiologicalBrowserTests)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    OUT.mkdir(exist_ok=True)
    (OUT/'browser-results.json').write_text(json.dumps({'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),'passed':result.wasSuccessful(),'failureDetails':[str(t)+': '+e for t,e in result.failures+result.errors]},indent=2))
    sys.exit(0 if result.wasSuccessful() else 1)
