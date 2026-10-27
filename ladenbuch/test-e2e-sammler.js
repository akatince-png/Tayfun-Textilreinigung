const { chromium } = require('playwright');
const U='http://localhost:8800/'; const log=(...a)=>console.log(...a);
(async()=>{const b=await chromium.launch();const errs=[];
const neu=async(name)=>{const ctx=await b.newContext({viewport:{width:1180,height:860}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(name+' console: '+m.text()));await p.goto(U);
 await p.fill('#l-geraet',name); await p.fill('#l-pass','geheim123'); await p.click('#login-form button'); await p.waitForSelector('#app:not([hidden])'); await p.waitForTimeout(800); return p;};
const toast=async(p)=>(await p.locator('#toast').textContent());
const a=await neu('iPad Theke');
await a.click('.rail [data-nav="annahme"]'); await a.fill('#cust-q','Sara Sammler'); await a.waitForTimeout(150); await a.click('[data-newcust]');
await a.click('[data-cat="Garderobe"]'); for (let i=0;i<3;i++) await a.click('[data-add="hose"]'); await a.click('[data-add="jacke"]'); await a.click('[data-cat="Hemden"]'); for (let i=0;i<4;i++) await a.click('[data-add="hemd"]');
await a.click('[data-save]'); await a.waitForTimeout(300); log('gespeichert:', await toast(a));
log('Warenschau-Kopf:', (await a.locator('.tz-kopf').textContent()).replace(/\s+/g,' ').trim());
// Hose 2: Bügelfalte, Loch mit Kunde bestätigt
await a.locator('.tz').nth(1).locator('[data-maengel]').click(); await a.waitForSelector('dialog.maengel-dlg[open]');
await a.click('[data-mopt="buegelfalte"][data-wert="mit"]');
const bx=await a.locator('svg.umriss').boundingBox(); await a.mouse.click(bx.x+bx.width*0.33,bx.y+bx.height*0.7);
await a.selectOption('#m-art','Loch / Masche gezogen'); await a.waitForTimeout(80); await a.fill('#m-notiz','Knie links'); log('Kunde bestätigt vorbelegt:', await a.isChecked('#m-kunde'));
await a.click('[data-msave]'); await a.waitForTimeout(150);
await a.click('[data-mok]'); await a.waitForTimeout(100); await a.click('[data-mzu]'); await a.waitForTimeout(300);
// Jacke: Fleck Rotwein + Wunsch Wäsche trotz Etikett
await a.locator('.tz').nth(3).locator('[data-maengel]').click(); await a.waitForSelector('dialog.maengel-dlg[open]');
await a.check('[data-mwunsch="0"]'); await a.waitForTimeout(150);
const bx2=await a.locator('svg.umriss').boundingBox(); await a.mouse.click(bx2.x+bx2.width*0.3,bx2.y+bx2.height*0.45);
await a.selectOption('#m-art','Fleck'); await a.waitForTimeout(150); await a.selectOption('#m-fleck','Rotwein / Saft'); await a.fill('#m-beh','Vorbehandlung mit Gallseife'); await a.click('[data-msave]'); await a.waitForTimeout(150);
await a.click('[data-mok]'); await a.waitForTimeout(100);
await a.screenshot({path:'shots/s-dialog.png'}); await a.click('[data-mzu]'); await a.waitForTimeout(300);
// übrige einwandfrei
while (await a.locator('[data-schauok]').count()) { await a.locator('[data-schauok]').first().click(); await a.waitForTimeout(120); }
log('Warenschau danach:', (await a.locator('.tz-kopf').textContent()).replace(/\s+/g,' ').trim());
log('Ampeln:', await a.locator('.tz .ampel').evaluateAll(xs=>xs.map(x=>x.className.split(' ')[1]).join(',')));
await a.screenshot({path:'shots/s-auftrag.png',fullPage:true});
// Druck: alles
await a.evaluate(()=>{window.print=()=>{window.__d=[...document.querySelectorAll('#druck img')].map(i=>i.naturalHeight);};});
await a.click('[data-print="alles"]'); await a.waitForTimeout(800); log('Druckseiten (Höhen):', await a.evaluate(()=>window.__d));
const bilder = await a.evaluate(()=>[...document.querySelectorAll('#druck img')].map(i=>i.src));
require('fs').writeFileSync('shots/s-sammler.png',Buffer.from(bilder[1].split(',')[1],'base64'));
require('fs').writeFileSync('shots/s-etikett2.png',Buffer.from(bilder[3].split(',')[1],'base64'));
require('fs').writeFileSync('shots/s-etikett5.png',Buffer.from(bilder[6].split(',')[1],'base64'));
await a.waitForTimeout(1500);
// Werkstatt auf zweitem Gerät
const w=await neu('Tablet Werkstatt'); await w.click('.rail [data-nav="werkstatt"]');
log('Werkstatt-Liste:', (await w.locator('.list .row').allTextContents()).map(s=>s.replace(/\s+/g,' ').trim()));
await w.fill('#ws-nr','1001-4'); await w.press('#ws-nr','Enter'); await w.waitForTimeout(400);
log('Kopf:', (await w.locator('.ws-kopf').textContent()).replace(/\s+/g,' ').trim().slice(0,160));
log('Teile:', (await w.locator('.ws-teil').evaluateAll(xs=>xs.map(x=>(x.classList.contains('rot')?'ROT ':'gruen ')+x.querySelector('.ws-teil-kopf b').textContent+(x.classList.contains('gewaehlt')?' <-gewählt':'')))));
await w.screenshot({path:'shots/s-werkstatt.png',fullPage:true});
await w.click('[data-wszaehl]'); await w.waitForTimeout(150); log(await toast(w));
await w.click('[data-wsalle="reinigung"]'); await w.waitForTimeout(150);
await w.locator('.ws-teil').nth(3).locator('[data-maengel]').click(); await w.waitForSelector('dialog.maengel-dlg[open]'); log('Werkstatt-Dialog Zeitpunkt:', await w.$eval('#m-zeit',s=>s.value).catch(()=>'(kein Formular offen)'));
const bx3=await w.locator('svg.umriss').boundingBox(); await w.mouse.click(bx3.x+bx3.width*0.6,bx3.y+bx3.height*0.6); log('Zeitpunkt:', await w.$eval('#m-zeit',s=>s.value)); await w.selectOption('#m-art','Naht offen'); await w.click('[data-msave]'); await w.click('[data-mzu]'); await w.waitForTimeout(300);
await w.click('[data-wsalle="fertig"]'); await w.waitForTimeout(200); log('alle fertig:', await toast(w));
// Teile-Scan mit Etikett
await w.click('.rail [data-nav="teile"]'); await w.click('[data-ziel="finish"]'); await w.fill('#scan','1001'); await w.press('#scan','Enter'); await w.waitForTimeout(150); log('Scan Sammelnr:', await w.locator('.scanlog span').first().textContent());
await w.fill('#scan','1001-2'); await w.press('#scan','Enter'); await w.waitForTimeout(150); log('Scan Etikett:', await w.locator('.scanlog span').first().textContent());
log('Fehler:', errs); await b.close();})();
