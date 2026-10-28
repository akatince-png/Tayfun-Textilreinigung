const { chromium } = require('playwright');
const U='http://localhost:8800/'; const log=(...a)=>console.log(...a);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:1180,height:860}});const a=await ctx.newPage();a.on('pageerror',e=>errs.push(e.message));await a.goto(U);
await a.fill('#l-pass','geheim123'); await a.click('#login-form button'); await a.waitForSelector('#app:not([hidden])'); await a.waitForTimeout(800);
const toast=async()=>(await a.locator('#toast').textContent());
// Stammkunde anlegen
await a.click('.rail [data-nav="kunden"]'); await a.click('[data-kneu]'); await a.waitForSelector('dialog.kartei-dlg[open]');
await a.selectOption('#k-anrede','Frau'); await a.fill('#k-vorname','Erika'); await a.fill('#k-nachname','Musterfrau'); await a.fill('#k-tel','0170 5555555'); await a.fill('#k-mail','erika@example.org');
await a.fill('#k-strasse','Am Sauerwinkel 3'); await a.fill('#k-lage','2. OG rechts, Klingel Musterfrau'); await a.fill('#k-plz','3045'); await a.fill('#k-ort','Hannover-Wettbergen');
await a.selectOption('#k-kontakt','mail'); await a.check('#k-ein-kontakt');
await a.click('#k-speichern'); log('PLZ-Fehler:', await a.textContent('#k-fehler'));
await a.fill('#k-plz','30457'); await a.click('#k-speichern'); await a.waitForTimeout(300); log(await toast());
await a.click('.list .row'); await a.waitForTimeout(200);
log('Karteikarte:', (await a.locator('.panel.detail dl').first().textContent()).replace(/\s+/g,' ').trim().slice(0,330));
await a.screenshot({path:'shots/k-karte.png'});
// Annahme: Suche per E-Mail, Auftrag; bevorzugt E-Mail zuerst
await a.click('.rail [data-nav="annahme"]'); await a.fill('#cust-q','erika@'); await a.waitForTimeout(200); log('Treffer E-Mail-Suche:', await a.locator('.suggest [data-cust]').count());
await a.locator('.suggest [data-cust]').first().click(); await a.click('[data-cat="Garderobe"]'); await a.click('[data-add="hose"]'); await a.click('[data-save]'); await a.waitForTimeout(300);
log('Knöpfe Stammkunde:', await a.locator('.digi .chips').first().locator('a').allTextContents(), '| Hinweis:', (await a.locator('.digi .mini').first().textContent()).slice(0,120));
log('mailto:', decodeURIComponent(await a.locator('.digi a[href^="mailto:"]').getAttribute('href')).slice(0,120));
// Laufkunde nur mit E-Mail
await a.click('.rail [data-nav="annahme"]'); await a.click('[data-cust="LAUF"]'); await a.click('[data-add="hose"]'); await a.click('[data-save]'); await a.waitForTimeout(300);
log('Laufkunde ohne Kontakt, Felder sichtbar:', await a.isVisible('#sk-tel'), await a.isVisible('#sk-mail'));
await a.fill('#sk-mail','kein-at-zeichen'); await a.click('[data-skok]'); await a.waitForTimeout(100); log('falsche Mail:', await toast());
await a.fill('#sk-mail','lauf@example.org'); await a.click('[data-skok]'); await a.waitForTimeout(200); log(await toast(), '| Knöpfe:', await a.locator('.digi .chips').first().locator('a').allTextContents(), '|', (await a.locator('.digi .mini').first().textContent()).slice(0,80));
await a.screenshot({path:'shots/k-lauf.png'});
// Schnell-Kunde mit E-Mail, dann zur Karteikarte erweitern
await a.click('.rail [data-nav="annahme"]'); await a.fill('#cust-q','Max Schnell'); await a.waitForTimeout(200); await a.fill('#new-tel','max@example.org'); await a.click('[data-newcust]'); await a.waitForTimeout(150);
await a.click('.rail [data-nav="kunden"]'); await a.locator('.list .row',{hasText:'Max Schnell'}).click(); await a.click('[data-kedit]'); await a.waitForSelector('dialog.kartei-dlg[open]');
log('Aufgeteilt:', await a.inputValue('#k-vorname'), '/', await a.inputValue('#k-nachname'), '/', await a.inputValue('#k-mail'));
await a.click('#k-abbruch');
// Annahme: Stammkunde direkt aus der Annahme
await a.click('.rail [data-nav="annahme"]'); await a.click('[data-uncust]').catch(()=>{}); await a.fill('#cust-q','Neue Stammkundin'); await a.waitForTimeout(200); await a.fill('#new-tel','0170 6666666'); await a.click('[data-kneuannahme]'); await a.waitForSelector('dialog.kartei-dlg[open]');
log('Vorbelegt:', await a.inputValue('#k-vorname'), '/', await a.inputValue('#k-nachname'), '/', await a.inputValue('#k-tel'));
await a.fill('#k-strasse','Wettberger Str. 1'); await a.click('#k-speichern'); await a.waitForTimeout(300);
log('Kunde gewählt:', (await a.locator('.bon .chip[aria-pressed="true"]').textContent().catch(()=>'-')));
await a.waitForTimeout(1500); log('Fehler:', errs); await b.close();})();
