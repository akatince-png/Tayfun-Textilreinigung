const { chromium } = require('playwright');
const U='http://localhost:8800/'; const log=(...a)=>console.log(...a);
(async()=>{const b=await chromium.launch();const errs=[];
const neu=async(name)=>{const ctx=await b.newContext({viewport:{width:1180,height:820}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(name+' console: '+m.text()));p.on('dialog',d=>d.dismiss());await p.goto(U);return {ctx,p};};
const toast=async(p)=>(await p.locator('#toast').textContent());
const {ctx:ca,p:a}=await neu('A');
await a.fill('#l-pass','falsch!!'); await a.click('#login-form button'); await a.waitForTimeout(1500); log('falsch:', await a.textContent('#l-info'));
await a.fill('#l-geraet','iPad Theke'); await a.fill('#l-pass','geheim123'); await a.click('#login-form button'); await a.waitForSelector('#app:not([hidden])'); await a.waitForTimeout(800);
log('A angemeldet, Sync:', await a.textContent('#sync'), '| Geschäftswahl sichtbar:', await a.isVisible('#stores'));
await a.screenshot({path:'shots/a-heute.png'});
// Annahme mit neuem Kunden
await a.click('.rail [data-nav="annahme"]'); await a.fill('#cust-q','Anna Test'); await a.waitForTimeout(150); await a.fill('#new-tel','0170 1111111'); await a.click('[data-newcust]');
await a.click('[data-add="hose"]'); await a.click('[data-cat="Hemden"]'); await a.click('[data-add="hemd"]'); 
await a.click('[data-save]'); await a.waitForTimeout(300); log('gespeichert:', await toast(a));
await a.waitForTimeout(1500); log('A Sync nach Speichern:', await a.textContent('#sync'));
await a.screenshot({path:'shots/a-auftrag.png',fullPage:true});
// Gerät B
const {ctx:cb,p:bb}=await neu('B');
await bb.fill('#l-geraet','iPad Büro'); await bb.fill('#l-pass','geheim123'); await bb.click('#login-form button'); await bb.waitForSelector('#app:not([hidden])'); await bb.waitForTimeout(1200);
await bb.click('.rail [data-nav="auftraege"]'); await bb.click('[data-filter="alle"]');
log('B sieht:', (await bb.locator('.list .row').allTextContents()).map(s=>s.replace(/\s+/g,' ').trim()));
await bb.click('.list .row'); await bb.fill('#p-beleg','5555'); await bb.click('[data-pay]'); await bb.waitForTimeout(1200);
// A holt ab
await a.click('#sync'); await a.waitForTimeout(1200); log('A sieht bezahlt:', (await a.locator('.pay').first().textContent()).replace(/\s+/g,' '));
// Offline-Betrieb auf A
await ca.setOffline(true); await a.click('.rail [data-nav="annahme"]'); await a.click('[data-cust="LAUF"]'); await a.click('[data-cat="Garderobe"]'); await a.click('[data-add="hose"]'); await a.click('[data-save]'); await a.waitForTimeout(800);
log('offline gespeichert:', await toast(a), '| Status:', await a.textContent('#sync'));
// Neu laden ohne Internet: App muss aus dem Speicher starten
await a.reload().catch(e=>log('reload offline fehlgeschlagen', e.message)); await a.waitForTimeout(1200);
log('offline neu geladen, App sichtbar:', await a.isVisible('#app'), '| Aufträge:', await a.evaluate(()=>document.body.innerText.includes('W-1002')||document.body.innerText.length));
await ca.setOffline(false); await a.evaluate(()=>dispatchEvent(new Event('online'))); await a.waitForTimeout(1500); log('wieder online:', await a.textContent('#sync'));
await bb.click('#sync'); await bb.waitForTimeout(1200); await bb.click('.rail [data-nav="auftraege"]'); await bb.click('[data-filter="alle"]');
log('B sieht jetzt:', (await bb.locator('.list .row .s').allTextContents()).map(s=>s.replace(/\s+/g,' ').trim()));
// Abholcode scannen auf B
const code = await a.evaluate(async()=>{const r=await fetch('api.php?a=sync&seit=0',{headers:{'X-Ladenbuch-Token':localStorage.getItem('lb-token')}});const d=await r.json();const o=d.daten.find(x=>x.typ==='auftrag'&&x.id==='W-1001').daten;return o.nr+'-'+o.code;});
await bb.click('.rail [data-nav="heute"]'); await bb.fill('#pick','TAYFUN '+code); await bb.press('#pick','Enter'); await bb.waitForTimeout(200); log('Scan:', await toast(bb));
// Leitung
await bb.click('.rail [data-nav="management"]'); await bb.fill('#pin','0000'); await bb.click('[data-unlock]'); await bb.waitForTimeout(400); log('falsche PIN:', await toast(bb));
await bb.fill('#pin','4711'); await bb.click('[data-unlock]'); await bb.waitForTimeout(1200);
log('Geräte:', (await bb.locator('.geraete b').allTextContents()));
await bb.screenshot({path:'shots/b-leitung.png',fullPage:true});
const [dl] = await Promise.all([bb.waitForEvent('download',{timeout:5000}).catch(()=>null), bb.click('[data-sicherung]')]);
if (dl) { const pth=await dl.path(); const j=JSON.parse(require('fs').readFileSync(pth,'utf8')); log('Sicherung:', j.kunden.length,'Kunden', j.auftraege.length,'Aufträge'); } else log('kein Download');
// Drucken
await bb.evaluate(()=>{window.print=()=>{window.__gedruckt=document.querySelector('#druck img').naturalWidth;};});
await bb.click('.rail [data-nav="auftraege"]'); await bb.click('[data-filter="alle"]'); await bb.click('.list .row'); await bb.click('[data-print]'); await bb.waitForTimeout(500); log('Druck Bildbreite:', await bb.evaluate(()=>window.__gedruckt));
await bb.screenshot({path:'shots/b-auftrag.png',fullPage:true});
log('Fehler:', errs); await b.close();})();
