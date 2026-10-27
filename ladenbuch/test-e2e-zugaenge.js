const { chromium } = require('playwright');
const U='http://localhost:8800/'; const log=(...a)=>console.log(...a);
(async()=>{const b=await chromium.launch();const errs=[];
const neu=async(name,pw)=>{const ctx=await b.newContext({viewport:{width:1180,height:860}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.goto(U);
 await p.fill('#l-geraet',name); await p.fill('#l-pass',pw); await p.click('#login-form button'); await p.waitForTimeout(1200); return p;};
const toast=async(p)=>(await p.locator('#toast').textContent());
const api=(p,a,body,extra='')=>p.evaluate(async([a,body,extra])=>{const r=await fetch('api.php?a='+a+extra,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Ladenbuch-Token':localStorage.getItem('lb-token')},body:body?JSON.stringify(body):undefined});return [r.status, await r.json().catch(()=>null)];},[a,body,extra]);
const a=await neu('iPad Theke','geheim123');
// Werkstatt-Login vor der Einrichtung
const w0=await neu('Werkstatt','werkstatt99'); log('Werkstatt vor Einrichtung:', await w0.textContent('#l-info'));
// Leitung richtet Werkstatt-Zugang ein
await a.click('.rail [data-nav="management"]'); await a.fill('#pin','4711'); await a.click('[data-unlock]'); await a.waitForTimeout(800);
await a.fill('#wp1','geheim123'); await a.fill('#wp2','geheim123'); await a.click('[data-wpneu]'); await a.waitForTimeout(300); log('gleiches PW wie Laden:', await toast(a));
await a.fill('#wp1','werkstatt99'); await a.fill('#wp2','werkstatt99'); await a.click('[data-wpneu]'); await a.waitForTimeout(1200); log(await toast(a));
await a.fill('#ma-name','Kemal Reiniger'); await a.selectOption('#ma-rolle','Textilreinigung / Detachur'); await a.click('[data-maneu]'); await a.waitForTimeout(150);
// Auftrag mit Kundenwunsch
await a.click('.rail [data-nav="annahme"]'); await a.fill('#cust-q','Lena Laden'); await a.waitForTimeout(150); await a.fill('#new-tel','0170 3333333'); await a.click('[data-newcust]');
await a.click('[data-cat="Garderobe"]'); await a.click('[data-add="hose"]'); await a.click('[data-add="mantel"]'); await a.click('[data-save]'); await a.waitForTimeout(300);
await a.locator('[data-maengel]').nth(1).click(); await a.waitForSelector('dialog.maengel-dlg[open]'); await a.check('[data-mwunsch="1"]'); await a.waitForTimeout(150); await a.click('[data-mzu]'); await a.waitForTimeout(1500);
// Werkstatt
const w=await neu('Tablet Werkstatt','werkstatt99');
await w.selectOption('#bediener',{label:'Kemal Reiniger'}); log('sichtbare Bereiche:', await w.locator('.rail button:not([hidden])').allTextContents());
const s=await api(w,'sync',null,'&seit=0'); log('Werkstatt bekommt:', [...new Set(s[1].daten.map(x=>x.typ))], '| Telefonnummern:', s[1].daten.filter(x=>x.typ==='kunde').map(x=>x.daten.tel));
await w.fill('#ws-nr','1001'); await w.press('#ws-nr','Enter'); await w.waitForTimeout(300);
log('Karten:', await w.locator('.ws-teil').evaluateAll(xs=>xs.map(x=>(x.classList.contains('rot')?'ROT ':'grün ')+x.querySelector('b').textContent)));
await w.locator('.ws-teil').nth(1).locator('[data-maengel]').click(); await w.waitForSelector('dialog.maengel-dlg[open]');
log('Vorgaben im Dialog:', (await w.locator('.md-schau').textContent()).replace(/\s+/g,' ').trim(), '| Zeitpunkt-Optionen:', await w.locator('#m-zeit option').allTextContents().catch(()=>'(Formular erst nach Antippen)'));
const bx=await w.locator('svg.umriss').boundingBox(); await w.mouse.click(bx.x+bx.width*0.5,bx.y+bx.height*0.5);
log('Zeitpunkt-Optionen:', await w.locator('#m-zeit option').allTextContents());
await w.selectOption('#m-art','Knopf fehlt / lose'); await w.click('[data-msave]'); await w.click('[data-mzu]'); await w.waitForTimeout(200);
await w.click('[data-wsalle="fertig"]'); await w.waitForTimeout(1500); log('Werkstatt fertig:', await toast(w));
// Rechte am Server
log('Kunde schreiben:', (await api(w,'push',{aenderungen:[{typ:'kunde',id:'K9999',daten:{id:'K9999',name:'x'}}]}))[0]);
log('Nummern holen:', (await api(w,'nummern',{art:'auftrag',geschaeft:'W',anzahl:5}))[0], '| PIN:', (await api(w,'pin',{pin:'4711'}))[0], '| Export:', (await api(w,'export'))[0]);
const s2=await api(w,'sync',null,'&seit=0'); const o=s2[1].daten.find(x=>x.typ==='auftrag').daten; const manip=JSON.parse(JSON.stringify(o)); manip.lines[0].qty=99; manip.paid={beleg:'1',art:'Bar',am:'2026-10-27'};
log('Manipulation Preis/Zahlung:', (await api(w,'push',{aenderungen:[{typ:'auftrag',id:o.nr,daten:manip}]}))[0]);
await a.click('#sync'); await a.waitForTimeout(1200);
const sa=await api(a,'sync',null,'&seit=0'); const oa=sa[1].daten.find(x=>x.typ==='auftrag').daten;
log('Laden sieht: Status', oa.status, '| Menge', oa.lines[0].qty, '| bezahlt', !!oa.paid, '| Mängel Teil 2:', oa.items[1].maengel.length, 'von', oa.items[1].maengel[0].vonName||oa.items[1].maengel[0].geraet);
// Laden-Passwort ändern: Werkstatt bleibt angemeldet; Werkstatt abschalten: Werkstatt fliegt raus
log('Werkstatt-Gerät noch drin:', (await api(w,'sync',null,'&seit=999999'))[0]);
await a.click('.rail [data-nav="management"]'); await a.waitForTimeout(500); await a.click('[data-wpaus]'); await a.waitForTimeout(400); log(await toast(a));
log('Werkstatt nach Abschalten:', (await api(w,'sync',null,'&seit=0'))[0]);
log('Fehler:', errs); await b.close();})();
