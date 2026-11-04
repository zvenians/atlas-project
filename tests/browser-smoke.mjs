import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const root = process.cwd();
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const server = createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(root + '/') && path !== root) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const body = readFileSync(path);
    res.writeHead(200, {'content-type':mime[extname(path)] ?? 'application/octet-stream'});
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
let browser;
const results=[];
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for (const size of [{width:1440,height:900},{width:390,height:844}]) {
    const page=await browser.newPage({viewport:size});
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    try {
      await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.ATLAS_V21?.sim),{timeout:15000});
      assert.equal(await page.locator('#view-landing').isVisible(),true,'landing visible');
      assert.equal(await page.locator('#atlas-legacy-workspace').isVisible(),false,'legacy hidden at root');
      await page.evaluate(()=>window.switchView('overview'));
      assert.equal(await page.locator('#view-overview').isVisible(),true,'overview visible');
      await page.evaluate(()=>window.switchView('map'));
      assert.equal(await page.locator('#view-map').isVisible(),true,'map visible');

      await page.goto('http://127.0.0.1:'+port+'/#legacy',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.ATLAS_V21?.sim),{timeout:15000});
      assert.equal(await page.locator('#atlas-legacy-workspace').isVisible(),true,'legacy view visible');
      await page.locator('#btn-pause').click();
      assert.equal(await page.evaluate(()=>window.ATLAS_V21.sim.snapshot().status),'PAUSED');
      const t0=await page.evaluate(()=>window.ATLAS_V21.sim.snapshot().tick);
      await page.locator('#btn-step').click();
      const t1=await page.evaluate(()=>window.ATLAS_V21.sim.snapshot().tick);
      assert.equal(t1,t0+1,'manual step increments exactly one tick');
      await page.locator('#scenarioPreset').selectOption('SIGNAL_LOSS');
      assert.equal(await page.evaluate(()=>window.ATLAS_V21.sim.snapshot().scenario),'SIGNAL_LOSS');
      await page.locator('#btn-play').click();
      await page.waitForFunction(
        t=>window.ATLAS_V21.sim.snapshot().tick>t,t1,{timeout:5000});
      assert.equal(await page.evaluate(
        ()=>window.ATLAS_V21.sim.snapshot().vehicles.every(v=>v.signalStatus==='LOST')),true,
        'signal loss propagates');
      await page.locator('#btn-pause').click();
      const before=await page.evaluate(()=>window.ATLAS_V21.sim.snapshot().tick);
      await page.waitForTimeout(1200);
      assert.equal(await page.evaluate(()=>window.ATLAS_V21.sim.snapshot().tick),before,'pause holds');

      await page.evaluate(()=>window.toggleMapPitch());
      assert.match(await page.locator('#svg-map').getAttribute('style')??'',/rotateX/);
      assert.equal((await page.locator('svg').first().getAttribute('style')??'').includes('rotateX'),false,
        'camera not applied to dashboard KPI svg');

      await page.evaluate(()=>window.openNewShipmentModal());
      assert.equal(await page.locator('#modal-new-shipment').isVisible(),true);
      await page.locator('#modal-new-shipment button').filter({hasText:'Save Shipment'}).click();
      assert.equal(await page.evaluate(()=>window.ATLAS_V21.getShipments().length),1,'local shipment saved');
      assert.equal(await page.locator('#modal-new-shipment').isVisible(),false);

      assert.deepEqual(pageErrors,[],'uncaught browser exceptions');
      results.push({viewport:size,pass:true,checks:12,pageErrors});
    } finally {
      await page.close();
    }
  }
  console.log('ATLAS Chromium browser smoke PASS '+JSON.stringify(results));
} catch(e) {
  console.error('ATLAS Chromium browser smoke FAILED',e.stack??e);
  process.exitCode=1;
} finally {
  if(browser)await browser.close();
  server.close();
}
