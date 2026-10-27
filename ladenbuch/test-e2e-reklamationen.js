const { chromium } = require('playwright');
const U='http://localhost:8800/'; const log=(...a)=>console.log(...a);
const FOTO='/tmp/claude-0/-home-user-Kidnapp/295ef7ee-295f-5303-8fef-b108194751de/scratchpad/wa-website/assets/fotos/hemd-manschette.jpg';
(async()=>{const b=await chromium.launch();const errs=[];
const neu=async(name)=>{const ctx=await b.newContext({viewport:{width:1180,height:860}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(name+' console: '+m.text()));await p.goto(U);
 await p.fill('#l-geraet',name); await p.fill('#l-pass','geheim123'); await p.click('#login-form button'); await p.waitForSelector('#app:not([hidden])'); await p.waitForTimeout(800); return p;};
const toast=async(p)=>(await p.locator('#toast').textContent());
const a=await neu('iPad Theke');
// Auftrag anlegen, fertig, abgeholt
await a.click('.rail [data-nav="annahme"]'); await a.fill('#cust-q','Anna Test'); await a.waitForTimeout(150); await a.fill('#new-tel','0170 1111111'); await a.click('[data-newcust]');
await a.click('[data-add="hose"]'); await a.click('[data-add="jacke"]'); await a.click('[data-save]'); await a.waitForTimeout(300);
await a.click('[data-set="bereit"]'); await a.click('[data-set="abgeholt"]'); log('Auftrag:', await toast(a));
// Reklamation aus dem Auftrag
await a.click('[data-treklam]'); await a.selectOption('#tn-kanal','Telefon'); await a.selectOption('#tn-grund','Fleck nicht entfernt'); await a.fill('#tn-text','Fleck am Ärmel noch sichtbar');
await a.locator('.teilwahl input').nth(1).check(); log('"wieder im Laden" vorbelegt:', await a.isChecked('#tn-da')); await a.check('#tn-da'); await a.click('[data-tanlegen]'); await a.waitForTimeout(300);
log('angelegt:', await toast(a), '| Titel:', await a.textContent('.detail h2'));
await a.screenshot({path:'shots/t-detail.png',fullPage:true});
const zustand=async()=>a.evaluate(()=>{const r=[];return r;});
// Nachbehandlung
await a.click('[data-tstatus="nachbehandlung"]'); await a.waitForTimeout(200); log('Status:', await toast(a));
const tnr = (await a.locator('.detail dd button[data-teil]').first().textContent()).split(' ')[0]; log('Teil:', tnr);
// Teil fertig scannen -> Auftrag abholbereit
await a.click('.rail [data-nav="teile"]'); await a.click('[data-ziel="fertig"]'); await a.fill('#scan', tnr); await a.press('#scan','Enter'); await a.waitForTimeout(200);
log('Scan:', await a.locator('.scanlog span').first().textContent());
// Foto, Vermerk, Wiedervorlage
await a.click('.rail [data-nav="kundendienst"]'); await a.click('.list .row'); 
await a.setInputFiles('#t-foto', FOTO); await a.waitForTimeout(2500); log('Foto:', await toast(a)); await a.waitForTimeout(800);
log('Foto angezeigt:', await a.evaluate(()=>{const i=document.querySelector('img.foto');return i?i.naturalWidth:0;}));
await a.fill('#tv-text','Kunde angerufen, holt Freitag ab'); await a.fill('#tv-wieder','2026-10-30'); await a.click('[data-tvermerk]'); log('Vermerk:', await toast(a));
// Abschluss mit Erstattung: erst ohne PIN
await a.selectOption('#ta-art','erstattung'); await a.waitForTimeout(100); await a.click('[data-tfertig]'); log('ohne PIN:', await toast(a));
await a.fill('#pin','4711'); await a.click('[data-unlock]'); await a.waitForTimeout(800);
await a.fill('#ta-betrag','12,50'); await a.fill('#ta-beleg','7788'); await a.fill('#ta-notiz','Kulanz'); await a.click('[data-tfertig]'); await a.waitForTimeout(300); log('Abschluss:', await toast(a));
await a.screenshot({path:'shots/t-erledigt.png',fullPage:true});
await a.waitForTimeout(1500);
// Zweites Gerät sieht alles
const bb=await neu('iPad Büro'); await bb.click('.rail [data-nav="kundendienst"]'); await bb.click('[data-tfilter2="alle"]');
log('B Tickets:', (await bb.locator('.list .row').allTextContents()).map(s=>s.replace(/\s+/g,' ').trim()));
await bb.click('.list .row'); await bb.waitForTimeout(1500); log('B Foto:', await bb.evaluate(()=>{const i=document.querySelector('img.foto');return i?i.naturalWidth:0;}));
await bb.click('.rail [data-nav="auftraege"]'); await bb.click('[data-filter="alle"]'); log('B Auftrag:', (await bb.locator('.list .row').first().textContent()).replace(/\s+/g,' ').trim());
await bb.click('.rail [data-nav="management"]'); await bb.fill('#pin','4711'); await bb.click('[data-unlock]'); await bb.waitForTimeout(1000);
log('Leitung:', (await bb.locator('.panel:has(h2:text("Reklamationen (90 Tage)")) .kpi').allTextContents()).map(s=>s.replace(/\s+/g,' ').trim()));
await bb.click('.rail [data-nav="kundendienst"]'); await bb.screenshot({path:'shots/t-liste.png'});
log('Fehler:', errs); await b.close();})();
