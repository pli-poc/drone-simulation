"""All existing browser checks plus real full-data neural loading, causality and training."""
import json, pathlib, re, sys, unittest
from playwright.sync_api import expect
from browser_biology import BiologicalBrowserTests
from browser_smoke import BASE, OUT

class NeuralBrowserTests(BiologicalBrowserTests):
    def test_08_full_connectome_lab_and_export(self):
        self.page.goto(BASE+'neural.html')
        self.page.wait_for_selector('body[data-ui-ready="true"]')
        self.page.click('#load')
        self.page.wait_for_selector('body[data-neural-ready="true"]',timeout=180000)
        expect(self.page.locator('#n-count')).to_have_text('165,122')
        expect(self.page.locator('#e-count')).to_have_text('25,563,197')
        self.page.click('#loom-left')
        for _ in range(4):
            before=self.page.locator('#clock').inner_text()
            self.page.click('#advance')
            expect(self.page.locator('#clock')).not_to_have_text(before,timeout=30000)
            self.page.wait_for_timeout(1200)
        expect(self.page.locator('#output-spikes')).not_to_have_text('0',timeout=30000)
        self.page.screenshot(path=str(OUT/'neural-full-graph-desktop.png'),full_page=True)
        with self.page.expect_download(timeout=30000) as d:self.page.click('#export')
        data=json.loads(pathlib.Path(d.value.path()).read_text())
        self.assertEqual(data['schema'],'mosquito-drone-lab/neural-experiment@1')
        self.assertEqual(data['dataset']['neurons'],165122)
        self.assertEqual(len(data['neuronSpikeCounts']),165122)
        self.assertGreater(data['summary']['spikes'],0)
        self.assertEqual(data['dataset']['assets']['graph']['decodedSha256'],'c1a42e90a87768c166c1dd43908065880d6c852440cb28544384ba2cef41343d')
        self.page.click('#reset');expect(self.page.locator('#clock')).to_have_text('0.0 ms')
        self.page.uncheck('[data-toggle="transmission"]');self.page.click('#loom-left')
        for _ in range(3):self.page.click('#advance');self.page.wait_for_timeout(1500)
        expect(self.page.locator('#spike-count')).not_to_have_text('0')
        expect(self.page.locator('#output-spikes')).to_have_text('0')
        self.page.set_viewport_size({'width':390,'height':844});self.page.wait_for_timeout(400)
        self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
        self.page.screenshot(path=str(OUT/'neural-full-graph-mobile.png'),full_page=True)

    def test_09_independent_drone_learning_against_full_graph(self):
        self.page.goto(BASE+'?insect=neural')
        self.page.wait_for_selector('body[data-neural-ready="true"]',timeout=180000)
        self.assertEqual(self.page.locator('#insect-model').input_value(),'neural')
        expect(self.page.locator('#insect-note')).to_contain_text('165,122')
        self.page.select_option('#scenario','arena')
        self.page.locator('#speed').evaluate('(el) => { el.value = "0.3"; }');self.page.locator('#speed').dispatch_event('change')
        self.page.fill('#duration','5');self.page.locator('#duration').dispatch_event('change')
        self.page.fill('#episodes','2');self.page.click('#train')
        expect(self.page.locator('#training-status')).to_have_text(re.compile(r'^Completed'),timeout=600000)
        with self.page.expect_download() as d:self.page.click('#export-policy')
        data=json.loads(pathlib.Path(d.value.path()).read_text())
        self.assertEqual(data['dimensions'],[19,24,7])
        self.assertGreater(data['meta']['updates'],0)
        self.assertEqual(data['meta']['neuralProvenance']['neurons'],165122)
        self.assertEqual(data['meta']['evaluationEpisodes'],2)
        self.page.screenshot(path=str(OUT/'neural-independent-drone-training.png'),full_page=True)
        with self.page.expect_download() as d:self.page.click('#export-run')
        experiment=json.loads(pathlib.Path(d.value.path()).read_text())
        self.assertEqual(experiment['evaluation']['baseline']['episodes'],2)
        self.assertEqual(experiment['evaluation']['learned']['episodes'],2)
        (OUT/'neural-training.json').write_text(json.dumps({'scope':'Real Chromium training worker, full original traced-neuron graph; two held-out seeds per controller, not a performance-validation sample.','meta':data['meta'],'history':experiment['trainingHistory'],'evaluation':experiment['evaluation']},indent=2))
        self.page.click('#apply-policy');self.assertEqual(self.page.locator('#controller').input_value(),'learned')

if __name__=='__main__':
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NeuralBrowserTests))
    OUT.mkdir(exist_ok=True)
    (OUT/'browser-results.json').write_text(json.dumps({'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),'passed':result.wasSuccessful(),'failureDetails':[str(t)+': '+e for t,e in result.failures+result.errors]},indent=2))
    sys.exit(0 if result.wasSuccessful() else 1)
