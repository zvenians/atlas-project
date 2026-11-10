// ATLAS P0 QA evidence: Chromium rendering of the exact PR source via local HTTP.
// Visual evidence only; screenshots do not prove production geospatial functionality.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const root=process.cwd();
const out='artifacts/p0-browser';
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
'.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8', '.mjs':'text/javascript; charset=utf-8' };
const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const target=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  const nRoot = root.replace(/\\/g, '/'); const nTarget = target.replace(/\\/g, '/');
  if(nTarget!==nRoot && !nTarget.startsWith(nRoot+'/')) {res.writeHead(403);res.end('Forbidden');return;}
  try {
    const body=readFileSync(target);
    res.writeHead(200,{'content-type':mime[extname(target)]??'application/octet-stream'});res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/';
const sizes=[{name:'desktop',width:1440,height:900},{name:'tablet',width:1024,height:768},{name:'mobile',width:390,height:844}];
const report={commit:process.env.GITHUB_SHA??'local',source:'local PR commit; NOT protected Vercel URL',screenshots:[],findings:[],browserErrors:[],verifiedPaths:[]};
let browser;
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for (const size of sizes) {
    const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
    page.on('pageerror',e=>report.browserErrors.push({viewport:size.name,error:e.message}));
    page.on('console',msg=>{if(msg.type()==='error')report.findings.push({kind:'console-error',viewport:size.name,message:msg.text().slice(0,250)});});
    try {
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.ATLAS_V21?.sim),null,{timeout:15000});
      async function capture(name,selector) {
        assert.equal(await page.locator(selector).isVisible(),true,'expected '+name+' visible at '+size.name);
        await page.waitForTimeout(300);
        const filename=size.name+'-'+name+'.png';
        const diagnostic=await page.evaluate(sel=>{
          const el=document.querySelector(sel);
          const doc=document.documentElement;
          const box=el.getBoundingClientRect();
          const all=[...el.querySelectorAll('button,input,select,a')];
          return {
            viewportWidth:innerWidth,documentScrollWidth:doc.scrollWidth,
            bodyScrollWidth:document.body.scrollWidth,
            sectionRect:{x:Math.round(box.x),y:Math.round(box.y),width:Math.round(box.width),height:Math.round(box.height)},
            visibleControlCount:all.filter(e=>e.getBoundingClientRect().width>0 && getComputedStyle(e).visibility!=='hidden').length,
            linksWithoutHref:all.filter(e=>e.tagName==='A' && !e.hasAttribute('href')).length
          };
        },selector);
        await page.screenshot({path:out+'/'+filename,fullPage:true,animations:'disabled'});
        report.screenshots.push({viewport:size.name,view:name,file:filename,...diagnostic});
        if (diagnostic.documentScrollWidth>size.width+8) {
          report.findings.push({kind:'horizontal-overflow-observed',viewport:size.name,view:name,
            measured:diagnostic.documentScrollWidth,viewportWidth:size.width});
        }
      }
      await capture('S01-landing','#view-landing');
      // Exercise visitor action and guided tour; not a claim that the eventual tour design is complete.
      await page.evaluate(()=>window.startGuidedTour());
      assert.equal(await page.locator('#guided-tour-modal').isVisible(),true,'tour opens');
      await page.evaluate(()=>window.nextTourStep());
      assert.equal(await page.locator('#view-overview').isVisible(),true,'tour progresses to overview');
      await page.evaluate(()=>window.closeTour());
      await capture('S02-overview','#view-overview');
      await page.evaluate(()=>window.switchView('map'));
      await capture('S03-live-map','#view-map');
      await page.goto(url+'#legacy',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.ATLAS_V21?.sim),null,{timeout:15000});
      await capture('legacy-operations','#atlas-legacy-workspace');
      assert.equal(await page.locator('#sec-fleet #cargo-bay-digital-twin').count(),1,
        'Cargo Digital Twin must live in Fleet section, not after the footer');
      const legacyWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
      assert.ok(legacyWidth<=size.width+8,
        'legacy horizontal viewport overflow: '+legacyWidth+'px at '+size.width+'px');
      // Verify legacy preserved nav: every operations section remains reachable and visible.
      for (const key of ['overview','shipments','dispatch','fleet','pwa','alerts','analytics']) {
        await page.evaluate(k=>window.switchTab(k),key);
        assert.equal(await page.locator('#sec-'+key).isVisible(),true,'legacy tab '+key);
        report.verifiedPaths.push({viewport:size.name,legacyTab:key,passed:true});
      }
      // Verify an unavailable advanced operation never claims false success.
      await page.evaluate(()=>window.solveVrp());
      assert.match(await page.locator('#atlas-legacy-notice').innerText(),/unavailable|No optimization/i);
      await page.evaluate(()=>window.exportCsv());
      assert.match(await page.locator('#atlas-legacy-notice').innerText(),/No local shipments/i);
      assert.equal(report.browserErrors.filter(e=>e.viewport===size.name).length,0,'no uncaught page errors');
    } finally {await page.close();}
  }
  report.findings.push({kind:'known-limitations',details:
    'Primary S03 camera buttons currently change highlighting, not geographic camera. No genuine 3D GIS/real roads; server sandbox and E2E Vercel auth not in scope.'});
  console.log('ATLAS P0 QA EVIDENCE PASS: '+report.screenshots.length+' screenshots, '+report.verifiedPaths.length+' legacy tab navigations, '+report.browserErrors.length+' uncaught page errors');
} catch(error) {
  report.findings.push({kind:'QA-FAILURE',error:String(error.stack??error)});
  console.error('ATLAS P0 QA EVIDENCE FAILURE',error.stack??error);
  process.exitCode=1;
} finally {
  writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close();
  server.close();
}
