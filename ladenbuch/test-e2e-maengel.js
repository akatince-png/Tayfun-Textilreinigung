const { chromium } = require('playwright');
const U='http://localhost:8800/'; const log=(...a)=>console.log(...a);
const FOTO='/tmp/claude-0/-home-user-Kidnapp/295ef7ee-295f-5303-8fef-b108194751de/scratchpad/wa-website/assets/fotos/teppich-berber.jpg';
(async()=>{const b=await chromium.launch();const errs=[];
const neu=async(name)=>{const ctx=await b.newContext({viewport:{width:1180,height:860}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(name+' console: '+m.text()));await p.goto(U);
 await p.fill('#l-geraet',name); await p.fill('#l-pass','geheim123'); await p.click('#login-form button'); await p.waitForSelector('#app:not([hidden])'); await p.waitForTimeout(800); return p;};
const toast=async(p)=>(await p.locator('#toast').textContent());
const a=await neu('iPad Theke');
log('Bediener-Auswahl sichtbar (ohne Mitarbeiter):', await a.isVisible('#bediener'));
// Mitarbeiter anlegen
await a.click('.rail [data-nav="management"]'); await a.fill('#pin','4711'); await a.click('[data-unlock]'); await a.waitForTimeout(800);
for (const [n,k,r] of [['Ayşe Demir','AY','Mitarbeiter'],['Duran Ince','DI','Inhaber']]) { await a.fill('#ma-name',n); await a.fill('#ma-kurz',k); await a.selectOption('#ma-rolle',r).catch(()=>{}); await a.click('[data-maneu]'); await a.waitForTimeout(150); }
log('Kartei:', (await a.locator('.panel:has(h2:text("Mitarbeiter")) .geraete b').allTextContents()));
const ids = await a.locator('#bediener option').evaluateAll(os=>os.map(o=>[o.value,o.textContent]));
log('Bediener-Liste:', ids.map(x=>x[1]));
await a.selectOption('#bediener', ids.find(x=>x[1]==='Ayşe Demir')[0]); log(await toast(a));
// Auftrag mit Hose + Hemd
await a.click('.rail [data-nav="annahme"]'); await a.fill('#cust-q','Max Mangel'); await a.waitForTimeout(150); await a.fill('#new-tel','0170 2222222'); await a.click('[data-newcust]');
await a.click('[data-cat="Garderobe"]'); await a.click('[data-add="hose"]'); await a.click('[data-cat="Hemden"]'); await a.click('[data-add="hemd"]'); await a.click('[data-save]'); await a.waitForTimeout(300);
log('Teile im Auftrag:', (await a.locator('.tz').allTextContents()).map(s=>s.replace(/\s+/g,' ').trim()));
// Mangel 1: Hose, Knie links, bei Annahme, mit Foto
await a.locator('[data-maengel]').first().click(); await a.waitForSelector('dialog.maengel-dlg[open]');
const box = await a.locator('svg.umriss').boundingBox(); await a.mouse.click(box.x+box.width*0.35, box.y+box.height*0.72);
await a.selectOption('#m-art','Loch / Masche gezogen'); await a.fill('#m-notiz','ca. 1 cm, Knie links');
await a.setInputFiles('#m-foto', FOTO); await a.waitForTimeout(2500);
log('Foto im Formular:', await a.locator('.md-form .foto').count());
await a.click('[data-msave]'); await a.waitForTimeout(200); log(await toast(a));
// Mangel 2: Rückseite, nachträglich, Vier-Augen
await a.click('[data-mseite="hinten"]'); const box2 = await a.locator('svg.umriss').boundingBox(); await a.mouse.click(box2.x+box2.width*0.6, box2.y+box2.height*0.3);
await a.selectOption('#m-art','Fleck'); await a.selectOption('#m-zeit','nachtraeglich'); await a.waitForTimeout(100);
log('Hinweis nachträglich:', await a.locator('.md-form .pay-warn').textContent().catch(()=>'-'));
await a.check('#m-4a'); await a.waitForTimeout(100); await a.click('[data-msave]'); await a.waitForTimeout(200); log('ohne Zeuge:', await toast(a));
await a.selectOption('#m-zeuge', ids.find(x=>x[1]==='Duran Ince')[0]); await a.click('[data-msave]'); await a.waitForTimeout(300);
log('Liste:', (await a.locator('.mliste li').allTextContents()).map(s=>s.replace(/\s+/g,' ').trim().slice(0,170)));
await a.screenshot({path:'shots/m-dialog.png'});
await a.click('[data-mseite="vorne"]'); await a.waitForTimeout(300); await a.screenshot({path:'shots/m-dialog-vorne.png'});
await a.click('[data-mzu]'); await a.waitForTimeout(400);
log('Knopf danach:', (await a.locator('.tz').first().textContent()).replace(/\s+/g,' ').trim());
await a.waitForTimeout(500); const src = await a.$eval('img[data-schein]', i=>i.src); require('fs').writeFileSync('shots/m-schein.png', Buffer.from(src.split(',')[1],'base64'));
await a.screenshot({path:'shots/m-auftrag.png',fullPage:true});
await a.waitForTimeout(1500);
// Gerät B
const bb=await neu('iPad Büro'); log('B Bediener-Liste:', await bb.locator('#bediener option').allTextContents());
await bb.click('.rail [data-nav="auftraege"]'); await bb.click('.list .row'); await bb.locator('[data-maengel]').first().click(); await bb.waitForTimeout(1500);
log('B sieht Mängel:', await bb.locator('.mliste li').count(), '| Foto geladen:', await bb.evaluate(()=>{const i=document.querySelector('.mliste img.foto');return i?i.naturalWidth:0;}));
await bb.click('[data-mweg]'); await bb.waitForTimeout(200); log('gestrichen:', (await bb.locator('.mliste li').first().textContent()).includes('gestrichen von'));
log('Fehler:', errs); await b.close();})();
