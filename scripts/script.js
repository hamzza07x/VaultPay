'use strict';
const KEY='vaultpay_v1',DAY=864e5,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const r2=n=>Math.round(n*100)/100,cap=s=>s[0].toUpperCase()+s.slice(1);
const dt=i=>new Date(i).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const ago=i=>{const m=Math.max(1,(Date.now()-new Date(i))/6e4|0);return m<60?m+'m ago':m<1440?(m/60|0)+'h ago':(m/1440|0)+'d ago'};
const ICON={Shopping:'shopping-bag',Food:'utensils',Transport:'car',Bills:'zap',Entertainment:'tv',Subscriptions:'repeat',Income:'banknote',Refund:'undo-2',Transfer:'arrow-up-right'};
const SPEND=['Shopping','Food','Transport','Bills','Entertainment','Subscriptions','Other'],COL=['#8B7CFF','#52E0C4','#FFC56E','#FF718B','#5CA8FF','#C084FC','#94A3B8'];
const ic=()=>window.lucide&&lucide.createIcons();

/* ---- demo data (localStorage, schema v1) ---- */
function seed(){
 const iso=(d,h)=>new Date(Date.now()-d*DAY-(h+1)*36e5-(d*13%60)*6e4).toISOString(),V='Demo Visa ••4242',M='Demo Mastercard ••5555';
 const rows=[['Salary — Northwind Ltd','Income',3800,'completed',3,9,'Bank transfer'],['Sara K.','Income',450,'completed',6,18,'Wallet'],['Rent — Maple Residences','Bills',-1200,'completed',5,8,'Wallet balance'],['Whole Foods Market','Food',-86.4,'completed',1,19,V],['Netflix','Subscriptions',-15.49,'completed',9,3,V],['Uber','Transport',-23.1,'completed',2,22,V],['Amazon','Shopping',-214.99,'pending',0,11,M],['Electric Co.','Bills',-128,'completed',12,10,'Wallet balance'],['Spotify','Subscriptions',-10.99,'completed',14,4,V],['Starbucks','Food',-7.85,'completed',0,8,V],['Steam','Entertainment',-59.99,'completed',17,21,M],['Shell','Transport',-48.59,'completed',8,17,V],['City Pharmacy','Other',-40,'completed',20,13,'Wallet balance'],['Concert Tickets','Entertainment',-120,'failed',4,15,M],['Zara — refund','Refund',35,'completed',40,12,'Original method']];
 for(let m=1;m<=11;m++){const d=30*m+2;rows.push(['Salary — Northwind Ltd','Income',3800,'completed',d,9,'Bank transfer'],['Rent — Maple Residences','Bills',-1200,'completed',d+2,8,'Wallet balance'],['Whole Foods Market','Food',-(310+m*13),'completed',d+5,19,V],['Amazon','Shopping',-(120+m*17),'completed',d+9,11,M],['Uber','Transport',-(60+m*4),'completed',d+12,22,V])}
 return{v:1,wallet:'VP-7X2K-94QD',balance:12845.8,reserved:2414.6,
 tx:rows.map((r,i)=>({id:'t'+i,name:r[0],cat:r[1],amt:r[2],status:r[3],date:iso(r[4],r[5]),method:r[6],fee:0,ref:'VP-'+(1e5+i*7919).toString(36).toUpperCase(),note:''})),
 cards:[{id:'c1',brand:'Demo Visa',type:'Debit',last4:'4242',holder:'Hamza Demo',exp:'08/29',def:true},{id:'c2',brand:'Demo Mastercard',type:'Credit',last4:'5555',holder:'Hamza Demo',exp:'11/28',def:false}],
 notes:[{id:'n1',icon:'shield-check',cat:'Security',title:'New sign-in (demo)',desc:'A simulated sign-in alert.',date:iso(0,7),read:false},{id:'n2',icon:'arrow-down-left',cat:'Money',title:'Money received',desc:'Sara K. sent you $450.00 (demo).',date:iso(6,18),read:false},{id:'n3',icon:'calendar',cat:'Reminder',title:'Payment reminder',desc:'Electric Co. bill is due in 3 days.',date:iso(1,9),read:true},{id:'n4',icon:'pie-chart',cat:'Summary',title:'Weekly spending summary',desc:'Your summary is ready on the Analytics page.',date:iso(2,8),read:true}],
 set:{name:'Hamza',email:'hamza@example.com',hide:false}}}
let S;try{S=JSON.parse(localStorage.getItem(KEY));if(!S||S.v!==1||!Array.isArray(S.tx)||!Array.isArray(S.cards)||!Array.isArray(S.notes)||!S.set)throw 0}catch(e){S=seed()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};

/* ---- helpers ---- */
const money=n=>S.set.hide?'••••••':fmt(n),avail=()=>r2(S.balance-S.reserved);
const out=t=>t.amt<0?-t.amt+(t.fee||0):0,inn=t=>t.amt>0?t.amt:0;
const within=(t,a,b)=>{const g=(Date.now()-new Date(t.date))/DAY;return g>=a&&g<b&&t.status!=='failed'};
const sum=(f,a,b)=>r2(S.tx.filter(t=>within(t,a,b)).reduce((s,t)=>s+f(t),0));
const catOf=t=>SPEND.includes(t.cat)?t.cat:'Other',byNew=(a,b)=>new Date(b.date)-new Date(a.date);
const fld=(l,n,a='')=>`<label>${l}<input name="${n}" ${a} autocomplete="off"></label><p class="err" role="alert" data-e="${n}"></p>`;
const sel=(id,l,o,v)=>`<label>${l}<select id="${id}">${o.map(([a,b])=>`<option value="${a}" ${a===v?'selected':''}>${b}</option>`).join('')}</select></label>`;
const unread=()=>S.notes.filter(n=>!n.read).length;
const updBadge=()=>{const b=$('#bdg'),n=unread();if(b){b.textContent=n;b.hidden=!n;b.parentNode.setAttribute('aria-label',`Notifications, ${n} unread`)}};
const txRow=t=>`<button class="tx" data-id="${t.id}"><span class="ico ${t.amt>0?'in':'out'}"><i data-lucide="${ICON[t.cat]||'tag'}"></i></span><span class="tx-m"><b>${esc(t.name)}</b><small>${esc(t.cat)} · ${dt(t.date)}</small></span><span class="tx-r"><b class="${t.amt>0?'pos':'neg'}">${t.amt>0?'+':'−'}${money(Math.abs(t.amt))}</b><small class="st ${t.status}">${cap(t.status)}</small></span></button>`;
const cardV=c=>`<div class="cardv ${c.brand.includes('Master')?'g2':'g1'}"><div class="row between"><b>${esc(c.brand)}</b>${c.def?'<span class="chip">Default</span>':''}</div><p class="num">•••• •••• •••• ${esc(c.last4)}</p><div class="row between"><span>${esc(c.holder)}</span><span>${c.type} · ${esc(c.exp)}</span></div></div>`;

/* ---- shell, theme, modal, toast ---- */
const NAV=[['index','Overview','layout-dashboard'],['transactions','Transactions','receipt'],['transfer','Transfer','send'],['payment-methods','Payment Methods','credit-card'],['analytics','Analytics','pie-chart'],['notifications','Notifications','bell'],['settings','Settings','settings']];
const PG=document.body.dataset.page,ROOT=PG==='index'?'':'../',HOME=ROOT+'index.html',LOGO=ROOT+'logo.svg';
const href=k=>k==='index'?HOME:(PG==='index'?'pages/':'')+k+'.html';
function shell(){
 const h=new Date().getHours(),n=unread();
 $('#app').innerHTML=`<div class="app"><nav class="side glass" aria-label="Main"><a class="brand logo" href="${HOME}"><img src="${LOGO}" alt=""><span>VaultPay</span></a>${NAV.map(([k,l,i])=>`<a href="${href(k)}" ${k===PG?'class="on" aria-current="page"':''}><i data-lucide="${i}"></i><span>${l}</span></a>`).join('')}</nav>
<main><header class="top"><div class="row"><a class="mlogo" href="${HOME}" aria-label="VaultPay home"><img src="${LOGO}" alt="VaultPay"></a><div><p class="hi">${h<12?'Good morning':h<18?'Good afternoon':'Good evening'}, ${esc(S.set.name)}.</p><p class="mut">${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p></div></div>
<div class="tools">${PG==='transactions'?'':`<form class="sr glass" id="gs" role="search"><i data-lucide="search"></i><input name="q" placeholder="Search transactions" aria-label="Search transactions"></form>`}
<a class="ib glass" href="${href('notifications')}" aria-label="Notifications, ${n} unread"><i data-lucide="bell"></i><em id="bdg" ${n?'':'hidden'}>${n}</em></a>
<button class="ib glass" data-act="theme" aria-label="Toggle dark or light theme"><i data-lucide="sun"></i></button>
<div class="dd"><button class="av" id="avb" data-act="menu" aria-haspopup="menu" aria-expanded="false" aria-label="Profile menu">${esc((S.set.name[0]||'U').toUpperCase())}</button><div class="menu glass" id="avm" role="menu" hidden><a role="menuitem" href="${href('settings')}">Settings</a><button role="menuitem" data-act="reset">Reset demo data</button></div></div></div></header>
<div id="page" class="page"></div><p class="foot">Demo only — sample data, no real money or financial connections.</p></main></div><div id="toasts" aria-live="polite"></div>`}
function setTheme(v){document.documentElement.dataset.theme=v;try{localStorage.setItem('vp_theme',v)}catch(e){}window.dispatchEvent(new Event('vp:theme'))}
let lastF;
function modal(title,html){closeModal();lastF=document.activeElement;const o=document.createElement('div');o.className='ov';
 o.innerHTML=`<div class="modal glass" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="mh"><h2 id="mt">${title}</h2><button class="ib" data-act="close" aria-label="Close"><i data-lucide="x"></i></button></div>${html}</div>`;
 o.addEventListener('mousedown',e=>{if(e.target===o)closeModal()});document.body.appendChild(o);ic();(o.querySelector('input,select,.pri')||o.querySelector('button')).focus();return o}
function closeModal(){const o=$('.ov');if(o){o.remove();lastF&&lastF.focus&&lastF.focus()}}
function confirmBox(msg,yes,label='Confirm'){const o=modal('Please confirm',`<p>${msg}</p><div class="row end"><button class="btn" data-act="close">Cancel</button><button class="btn pri danger" id="yes">${label}</button></div>`);$('#yes',o).onclick=()=>{closeModal();yes()}}
function toast(m,ok=true){const t=document.createElement('div');t.className='toast glass '+(ok?'ok':'bad');t.textContent=(ok?'✓ ':'⚠ ')+m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3200)}
async function copy(v){try{await navigator.clipboard.writeText(v);toast('Copied to clipboard')}catch(e){const x=document.createElement('textarea');x.value=v;document.body.appendChild(x);x.select();try{document.execCommand('copy');toast('Copied to clipboard')}catch(_){toast('Copy failed',false)}x.remove()}}

/* ---- charts ---- */
function mk(id,cfg){const el=document.getElementById(id);if(!el||!window.Chart)return;const old=Chart.getChart(el);old&&old.destroy();const cs=getComputedStyle(document.documentElement);Chart.defaults.color=cs.getPropertyValue('--t2').trim();Chart.defaults.borderColor=cs.getPropertyValue('--b').trim();cfg.options={responsive:true,maintainAspectRatio:false,...cfg.options};new Chart(el,cfg)}
function catData(a,b){const m=Object.fromEntries(SPEND.map(c=>[c,0]));S.tx.filter(t=>within(t,a,b)&&out(t)>0).forEach(t=>m[catOf(t)]+=out(t));return m}
function donut(id,a,b){const el=document.getElementById(id);if(!el)return;const m=catData(a,b);
 if(!Object.values(m).some(v=>v>0)){el.parentNode.innerHTML='<p class="empty">No spending in this period.</p>';return}
 mk(id,{type:'doughnut',data:{labels:SPEND,datasets:[{data:SPEND.map(c=>r2(m[c])),backgroundColor:COL,borderWidth:0}]},options:{cutout:'68%',plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.parsed)}`}}}}})}

/* ---- pages ---- */
function showTx(id){const t=S.tx.find(x=>x.id===id);if(!t)return;
 modal('Transaction details',`<p class="big ${t.amt>0?'pos':'neg'}">${t.amt>0?'+':'−'}${money(Math.abs(t.amt))}</p><dl class="dl">${[['Description',t.cat+(t.note?' — '+t.note:'')],['Type',t.amt>0?'Incoming':'Outgoing'],['Status',cap(t.status)],['Date',dt(t.date)],[t.amt>0?'From':'To',t.name],['Payment method',t.method],['Fee',fmt(t.fee||0)],['Reference',t.ref]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl><div class="row end"><button class="btn" data-copy="${esc(t.ref)}"><i data-lucide="copy"></i>Copy reference</button></div>`)}

function pDash(){
 const inc=sum(inn,0,30),exp=sum(out,0,30),pi=sum(inn,30,60),pe=sum(out,30,60),d=S.cards.find(c=>c.def);
 const tv=(a,b)=>b?(a>=b?'▲ ':'▼ ')+Math.abs(Math.round((a-b)/b*100))+'% vs prior 30 days':'Last 30 days';
 const kpi=(l,v,i,n,c)=>`<div class="card glass kpi lift"><span class="ico ${c}"><i data-lucide="${i}"></i></span><small>${l}</small><b>${money(v)}</b><em>${n}</em></div>`;
 $('#page').innerHTML=`<h1>Overview</h1>
<div class="actions">${[['Send','send','send'],['Receive','arrow-down-left','receive'],['Add money','plus','add']].map(([l,i,k])=>`<a class="btn glass" href="pages/transfer.html?tab=${k}"><i data-lucide="${i}"></i>${l}</a>`).join('')}<a class="btn glass" href="pages/transactions.html"><i data-lucide="receipt"></i>All transactions</a></div>
<section class="bal glass" aria-label="Wallet balance"><div class="row between"><span class="logo"><img src="${LOGO}" alt="">VaultPay</span><span class="chip">USD · Demo wallet</span></div><p class="mut" style="margin-top:12px">Total balance</p><div class="row"><h2 class="amt">${money(S.balance)}</h2><button class="ib" data-act="eye" aria-label="${S.set.hide?'Show':'Hide'} balance"><i data-lucide="${S.set.hide?'eye':'eye-off'}"></i></button></div><p class="mut">Available ${money(avail())} · Reserved ${money(S.reserved)}</p><div class="row between"><code>${S.set.hide?'VP-••••-••••':esc(S.wallet)}</code><span class="mut">Sample data</span></div></section>
<div class="kpis">${kpi('Income',inc,'trending-up',tv(inc,pi),'in')+kpi('Expenses',exp,'trending-down',tv(exp,pe),'out')+kpi('Net cash flow',inc-exp,'arrow-left-right','Last 30 days','in')+kpi('Reserved',S.reserved,'piggy-bank','Set aside (demo)','in')}</div>
<div class="cols"><section class="card glass"><div class="row between"><h2>Recent transactions</h2><a href="pages/transactions.html">View all</a></div><div>${S.tx.slice().sort(byNew).slice(0,6).map(txRow).join('')}</div></section>
<div><section class="card glass"><h2>Spending · last 30 days</h2><div class="chart"><canvas id="c1" role="img" aria-label="Spending by category"></canvas></div></section><section class="card glass" style="margin-top:14px"><h2>Default payment method</h2>${d?cardV(d):'<p class="empty">No payment methods.</p>'}<p style="margin-top:10px"><a href="pages/payment-methods.html">Manage methods</a></p></section></div></div>`;
 donut('c1',0,30)}

let F={q:new URLSearchParams(location.search).get('q')||'',type:'',status:'',sort:'new',n:8};
function paintTx(){const q=F.q.toLowerCase();
 const l=S.tx.filter(t=>(!q||[t.name,t.note,t.ref,t.cat].join(' ').toLowerCase().includes(q))&&(!F.type||(F.type==='in'?t.amt>0:t.amt<0))&&(!F.status||t.status===F.status));
 l.sort(F.sort==='old'?(a,b)=>byNew(b,a):F.sort==='hi'?(a,b)=>Math.abs(b.amt)-Math.abs(a.amt):F.sort==='lo'?(a,b)=>Math.abs(a.amt)-Math.abs(b.amt):byNew);
 $('#txl').innerHTML=l.length?`<div>${l.slice(0,F.n).map(txRow).join('')}</div>${l.length>F.n?`<button class="btn more" data-act="more">Load more (${l.length-F.n})</button>`:''}<p class="mut" style="margin-top:8px">${l.length} transaction${l.length===1?'':'s'}</p>`:'<p class="empty">No transactions match your filters.</p>';ic()}
function pTx(){
 $('#page').innerHTML=`<h1>Transactions</h1><div class="card glass filters"><label>Search<input id="fq" value="${esc(F.q)}" placeholder="Name, note or reference"></label>${sel('ft','Type',[['','All types'],['in','Incoming'],['out','Outgoing']],F.type)}${sel('fs','Status',[['','All statuses'],['completed','Completed'],['pending','Pending'],['failed','Failed']],F.status)}${sel('fo','Sort by',[['new','Newest'],['old','Oldest'],['hi','Highest amount'],['lo','Lowest amount']],F.sort)}<button class="btn" data-act="clear">Clear filters</button></div><div id="txl" class="card glass"></div>`;
 const m={fq:'q',ft:'type',fs:'status',fo:'sort'};
 $$('.filters input,.filters select').forEach(el=>el.addEventListener('input',()=>{F[m[el.id]]=el.value;F.n=8;paintTx()}));paintTx()}

let TAB=new URLSearchParams(location.search).get('tab');TAB=['send','receive','add'].includes(TAB)?TAB:'send';
function pTransfer(){
 $('#page').innerHTML=`<h1>Transfer</h1><div class="tabs" role="tablist">${[['send','Send'],['receive','Receive'],['add','Add money']].map(([k,l])=>`<button role="tab" aria-selected="${k===TAB}" data-act="tab" data-v="${k}">${l}</button>`).join('')}</div><div class="card glass narrow" id="tp"></div>`;
 TAB==='receive'?rcv():flow(TAB)}
function flow(mode){
 const send=mode==='send',el=$('#tp'),lim=send?5000:10000,fee=a=>send?r2(Math.min(5,Math.max(.25,a*.005))):0;
 el.innerHTML=`<p class="note">${send?'Simulated transfer — no real money is sent.':'Demonstration top-up — no real funds are added.'} Available: <b>${money(avail())}</b></p><form id="ff" novalidate>${send?fld('Recipient name','name','maxlength=40')+fld('Wallet ID or email','id','maxlength=60 placeholder="VP-AB12-CD34 or name@mail.com"'):`<label>Funding source<select name="src">${S.cards.map(c=>`<option>${esc(c.brand)} ••${esc(c.last4)}</option>`).join('')||'<option value="">No payment methods</option>'}</select></label><p class="err" role="alert" data-e="src"></p>`}${fld('Amount (USD)','amt','inputmode=decimal placeholder="0.00"')}${send?fld('Note (optional)','note','maxlength=80'):''}<p class="mut" id="fi"></p><button class="btn pri" type="submit">Review</button></form>`;
 const f=$('#ff');
 $('[name=amt]',f).addEventListener('input',e=>{const a=e.target.value.trim(),x=+a;$('#fi').textContent=/^\d+(\.\d{1,2})?$/.test(a)&&x>0?(send?`Fee ${fmt(fee(x))} · Total deduction ${fmt(x+fee(x))}`:`New balance ${fmt(S.balance+x)}`):''});
 f.addEventListener('submit',e=>{e.preventDefault();
  const v=Object.fromEntries(new FormData(f)),a=String(v.amt||'').trim(),x=+a;let ok=true;
  const bad=(n,m)=>{$(`[data-e=${n}]`,f).textContent=m;ok=false};$$('.err',f).forEach(p=>p.textContent='');
  if(send){if(!/^[\p{L} .'-]{2,40}$/u.test((v.name||'').trim()))bad('name','Enter a name (2–40 letters).');if(!/^(VP-[A-Z0-9]{4}-[A-Z0-9]{4}|[^\s@]+@[^\s@]+\.[^\s@]{2,})$/i.test((v.id||'').trim()))bad('id','Use a wallet ID (VP-XXXX-XXXX) or an email.')}
  else if(!S.cards.length||!v.src)bad('src','Add a payment method first.');
  if(!/^\d+(\.\d{1,2})?$/.test(a)||!(x>0))bad('amt','Enter a positive amount with up to 2 decimals.');
  else if(x>lim)bad('amt',`Demo limit is ${fmt(lim)} per ${send?'transfer':'top-up'}.`);
  else if(send&&x+fee(x)>avail()+1e-9)bad('amt',`Insufficient available balance (needs ${fmt(x+fee(x))}).`);
  if(!ok){const p=$('.err:not(:empty)',f),i=p&&p.previousElementSibling&&p.previousElementSibling.querySelector('input,select');i&&i.focus();return}
  const fe=fee(x),tot=x+fe,uid='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const rows=send?[['To',v.name.trim()],['Identifier',v.id.trim()],['Amount',fmt(x)],['Fee',fmt(fe)],['Total deduction',fmt(tot)],['Source','Wallet balance'],['Note',(v.note||'').trim()||'—']]:[['Amount',fmt(x)],['Source',v.src],['Balance after',fmt(S.balance+x)]];
  el.innerHTML=`<h2>Review ${send?'transfer':'top-up'}</h2><dl class="dl">${rows.map(([k,s])=>`<dt>${k}</dt><dd>${esc(s)}</dd>`).join('')}</dl><p class="note" style="margin-top:10px">Simulation — nothing leaves this browser.</p><div class="row end"><button class="btn" id="bk">Back</button><button class="btn pri" id="ok">Confirm</button></div>`;
  $('#bk').onclick=()=>{flow(mode);Object.entries(v).forEach(([k,s])=>{const i=$(`[name=${k}]`,$('#ff'));if(i)i.value=s})};
  let done=false;
  $('#ok').onclick=function(){if(done||S.tx.some(t=>t.id===uid))return;done=true;this.disabled=true;this.textContent='Processing…';
   setTimeout(()=>{
    if(send&&tot>avail()){toast('Insufficient balance',false);return flow(mode)}
    const ref='VP-'+Date.now().toString(36).toUpperCase().slice(-6)+Math.random().toString(36).slice(2,5).toUpperCase(),now=new Date().toISOString();
    S.tx.unshift({id:uid,name:send?v.name.trim():'Top-up · '+v.src,cat:send?'Transfer':'Income',amt:send?-x:x,fee:fe,status:'completed',date:now,method:send?'Wallet balance':v.src,ref,note:send?(v.note||'').trim():'Demo top-up'});
    S.balance=r2(S.balance+(send?-tot:x));
    S.notes.unshift({id:'n'+uid,icon:send?'arrow-up-right':'arrow-down-left',cat:'Money',title:send?'Transfer completed (simulated)':'Top-up completed (simulated)',desc:send?`${fmt(x)} to ${v.name.trim()} — demo only.`:`${fmt(x)} from ${v.src} — demo only.`,date:now,read:false});
    save();updBadge();
    el.innerHTML=`<div class="done"><i data-lucide="check-circle-2"></i><h2>${send?'Transfer simulated':'Top-up simulated'}</h2><p>${fmt(x)} ${send?'deducted (fee '+fmt(fe)+')':'added'}. Balance: <b>${money(S.balance)}</b></p><p class="mut">Reference ${ref}</p><div class="row"><a class="btn" href="transactions.html">View transactions</a><button class="btn pri" id="again">Another</button></div></div>`;
    $('#again').onclick=()=>flow(mode);ic();toast('Done (simulation)')},600)}})}
function rcv(){
 $('#tp').innerHTML=`<p class="note">Demo wallet — not connected to any payment network.</p><dl class="dl"><dt>Recipient</dt><dd>${esc(S.set.name)}</dd><dt>Wallet ID</dt><dd><code>${esc(S.wallet)}</code></dd></dl><div class="row" style="margin-top:10px"><button class="btn" data-copy="${esc(S.wallet)}"><i data-lucide="copy"></i>Copy wallet ID</button></div><label>Request amount (optional)<input id="ra" inputmode="decimal" placeholder="0.00"></label><p class="req" id="rq"></p><button class="btn pri" id="rc"><i data-lucide="copy"></i>Copy payment request</button><div class="qr">QR code placeholder<br><small>Not generated in this demo</small></div>`;
 const up=()=>{const a=$('#ra').value.trim(),ok=/^\d+(\.\d{1,2})?$/.test(a)&&+a>0,t=`VaultPay demo request: please send ${ok?fmt(+a):'any amount'} to ${S.set.name} (${S.wallet}). Demonstration only — no real payment network.`;$('#rq').textContent=t;$('#rc').dataset.copy=t};
 $('#ra').addEventListener('input',up);up()}

function pCards(){
 $('#page').innerHTML=`<div class="row between"><h1>Payment methods</h1><button class="btn pri" data-act="addcard"><i data-lucide="plus"></i>Add method</button></div><p class="note">Demo cards only. Never enter real card details — only fictional last 4 digits are stored.</p>${S.cards.length?`<div class="cards">${S.cards.map(c=>`<div class="cw">${cardV(c)}<div class="row"><button class="btn" data-act="def" data-v="${c.id}" ${c.def?'disabled':''}>${c.def?'Default':'Set default'}</button><button class="btn danger" data-act="del" data-v="${c.id}">Remove</button></div></div>`).join('')}</div>`:'<p class="empty card glass">No payment methods yet. Add one to get started.</p>'}`}

let RANGE='month';const CFG={week:[7,1],month:[6,5],year:[12,30]};
function pAn(){
 const [n,sz]=CFG[RANGE],days=n*sz,inc=sum(inn,0,days),exp=sum(out,0,days),prev=sum(out,days,days*2),top=Object.entries(catData(0,days)).sort((a,b)=>b[1]-a[1])[0],outs=S.tx.filter(t=>within(t,0,days)&&out(t)>0),avg=outs.length?exp/outs.length:0;
 const lab=[],I=Array(n).fill(0),E=Array(n).fill(0),fo=RANGE==='week'?{weekday:'short'}:RANGE==='month'?{month:'short',day:'numeric'}:{month:'short'};
 for(let i=0;i<n;i++)lab.push(new Date(Date.now()-(n-1-i)*sz*DAY).toLocaleDateString('en-US',fo));
 S.tx.filter(t=>within(t,0,days)).forEach(t=>{const k=n-1-Math.floor((Date.now()-new Date(t.date))/DAY/sz);I[k]+=inn(t);E[k]+=out(t)});
 const kp=[['Total income',money(inc)],['Total expenses',money(exp)],['Net cash flow',money(inc-exp)],['Top category',top&&top[1]?top[0]+' · '+money(top[1]):'—'],['Avg. expense',money(avg)],['Spending trend',prev?(exp>=prev?'▲ ':'▼ ')+Math.abs(Math.round((exp-prev)/prev*100))+'% vs prior period':'—']];
 $('#page').innerHTML=`<div class="row between"><h1>Analytics</h1><div class="tabs" role="group" aria-label="Time range">${['week','month','year'].map(r=>`<button data-act="range" data-v="${r}" aria-pressed="${r===RANGE}">${cap(r)}</button>`).join('')}</div></div>
<div class="kpis">${kp.map(([l,v])=>`<div class="card glass kpi"><small>${l}</small><b>${esc(v)}</b></div>`).join('')}</div>
<div class="cols"><section class="card glass"><h2>Spending breakdown</h2><div class="chart"><canvas id="c1" role="img" aria-label="Spending by category doughnut chart"></canvas></div></section><section class="card glass"><h2>Income vs expenses</h2><div class="chart"><canvas id="c2" role="img" aria-label="Income versus expenses bar chart"></canvas></div></section></div>`;
 donut('c1',0,days);
 mk('c2',{type:'bar',data:{labels:lab,datasets:[{label:'Income',data:I.map(r2),backgroundColor:'#42D6A4',borderRadius:6},{label:'Expenses',data:E.map(r2),backgroundColor:'#FF718B',borderRadius:6}]},options:{scales:{y:{ticks:{callback:v=>'$'+v.toLocaleString()}}},plugins:{tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y)}`}}}}})}

let NF='all';
function pNot(){
 const l=S.notes.filter(n=>NF==='all'||!n.read);
 $('#page').innerHTML=`<div class="row between"><h1>Notifications</h1><button class="btn" data-act="readall"><i data-lucide="check-check"></i>Mark all read</button></div><div class="tabs" role="group" aria-label="Filter">${[['all','All'],['unread','Unread ('+unread()+')']].map(([k,s])=>`<button data-act="nf" data-v="${k}" aria-pressed="${k===NF}">${s}</button>`).join('')}</div>${l.length?`<div>${l.map(n=>`<article class="nt glass ${n.read?'':'un'}"><span class="ico in"><i data-lucide="${esc(n.icon)}"></i></span><div><b>${esc(n.title)}</b>${n.read?'':' <span class="chip">Unread</span>'}<p>${esc(n.desc)}</p><small>${esc(n.cat)} · ${ago(n.date)}</small></div><div class="row">${n.read?'':`<button class="ib" data-act="rd" data-v="${n.id}" aria-label="Mark as read"><i data-lucide="check"></i></button>`}<button class="ib" data-act="nd" data-v="${n.id}" aria-label="Delete notification"><i data-lucide="trash-2"></i></button></div></article>`).join('')}</div>`:'<p class="empty card glass">Nothing here — all caught up.</p>'}`}

function pSet(){const s=S.set;
 $('#page').innerHTML=`<h1>Settings</h1><section class="card glass narrow"><h2>Account</h2><form id="sf" novalidate>${fld('Display name','name','maxlength=30 value="'+esc(s.name)+'"')}${fld('Email (demo)','email','value="'+esc(s.email)+'"')}<button class="btn pri" type="submit">Save</button></form></section>
<section class="card glass narrow"><h2>Preferences</h2><label>Theme<select id="th"><option value="dark">Dark</option><option value="light">Light</option></select></label><label class="sw" style="margin-top:14px"><span><b>Hide balances</b><small>Mask amounts across the app</small></span><input type="checkbox" role="switch" id="hd" ${s.hide?'checked':''}></label></section>
<section class="card glass narrow"><h2>Demo data</h2><p class="note">Stored in this browser's localStorage only. No real accounts, security features or money exist.</p><button class="btn danger" data-act="reset">Reset demo data</button></section>`;
 const th=$('#th');th.value=document.documentElement.dataset.theme;th.onchange=e=>setTheme(e.target.value);
 $('#hd').onchange=e=>{S.set.hide=e.target.checked;save();toast('Setting updated')};
 $('#sf').onsubmit=e=>{e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f));let ok=true;
  [['name',/^.{2,30}$/.test(v.name.trim()),'2–30 characters.'],['email',/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()),'Enter a valid email.']].forEach(([n,g,m])=>{$(`[data-e=${n}]`,f).textContent=g?'':m;if(!g)ok=false});
  if(!ok)return;S.set.name=v.name.trim();S.set.email=v.email.trim();S.notes.unshift({id:'n'+Date.now(),icon:'settings',cat:'Account',title:'Account updated',desc:'Display name or email changed (demo).',date:new Date().toISOString(),read:false});save();toast('Saved');setTimeout(()=>location.reload(),600)}}

/* ---- actions (one delegated listener) ---- */
const ACT={
 menu(){const m=$('#avm');m.hidden=!m.hidden;$('#avb').setAttribute('aria-expanded',String(!m.hidden))},
 theme(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')},
 close:closeModal,
 eye(){S.set.hide=!S.set.hide;save();render()},
 reset(){$('#avm').hidden=true;confirmBox('Restore the sample data? Your demo transactions, cards, notifications and settings will be erased.',()=>{try{localStorage.removeItem(KEY)}catch(e){}location.reload()},'Reset')},
 clear(){F={q:'',type:'',status:'',sort:'new',n:8};render()},
 more(){F.n+=8;paintTx()},
 tab(t){TAB=t.dataset.v;render()},range(t){RANGE=t.dataset.v;render()},nf(t){NF=t.dataset.v;render()},
 rd(t){const n=S.notes.find(x=>x.id===t.dataset.v);if(n)n.read=true;save();updBadge();render()},
 nd(t){S.notes=S.notes.filter(x=>x.id!==t.dataset.v);save();updBadge();render()},
 readall(){S.notes.forEach(n=>n.read=true);save();updBadge();render()},
 def(t){S.cards.forEach(c=>c.def=c.id===t.dataset.v);save();render();toast('Default payment method updated')},
 del(t){const id=t.dataset.v;confirmBox('Remove this payment method?',()=>{const was=(S.cards.find(c=>c.id===id)||{}).def;S.cards=S.cards.filter(c=>c.id!==id);if(was&&S.cards[0])S.cards[0].def=true;save();render();toast('Payment method removed')},'Remove')},
 addcard(){const o=modal('Add payment method',`<p class="note">Fictional demo data only. Only the last 4 digits are stored.</p><form id="cf" novalidate>${fld('Cardholder name','holder','maxlength=40')}${fld('Last 4 digits','last4','maxlength=4 inputmode=numeric')}${fld('Expiry (MM/YY)','exp','maxlength=5 placeholder="08/29"')}<label>Label<select name="brand"><option>Demo Visa</option><option>Demo Mastercard</option></select></label><label>Type<select name="type"><option>Debit</option><option>Credit</option></select></label><button class="btn pri" type="submit">Add</button></form>`);
  $('#cf',o).onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target)),er=(n,m)=>{$(`[data-e=${n}]`,o).textContent=m||''};let ok=true;['holder','last4','exp'].forEach(n=>er(n));
   if(!/^[\p{L} .'-]{2,40}$/u.test(v.holder.trim())){er('holder','Enter 2–40 letters.');ok=false}
   if(!/^\d{4}$/.test(v.last4)){er('last4','Exactly 4 digits.');ok=false}
   const m=/^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.exp);if(!m||new Date(2000+ +m[2],+m[1],0,23,59)<new Date()){er('exp','Use a future date as MM/YY.');ok=false}
   if(!ok)return;S.cards.push({id:'c'+Date.now(),brand:v.brand,type:v.type,last4:v.last4,holder:v.holder.trim(),exp:v.exp,def:!S.cards.length});save();closeModal();render();toast('Payment method added')}}
};
document.addEventListener('click',e=>{
 if(!e.target.closest('.dd')){const m=$('#avm');if(m&&!m.hidden){m.hidden=true;$('#avb').setAttribute('aria-expanded','false')}}
 const t=e.target.closest('[data-act],[data-copy],.tx');if(!t)return;
 if(t.classList.contains('tx'))return showTx(t.dataset.id);
 if(t.dataset.copy)return copy(t.dataset.copy);
 ACT[t.dataset.act]&&ACT[t.dataset.act](t)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();const m=$('#avm');if(m&&!m.hidden){m.hidden=true;$('#avb').setAttribute('aria-expanded','false')}}});

/* ---- init ---- */
const PAGES={index:pDash,transactions:pTx,transfer:pTransfer,'payment-methods':pCards,analytics:pAn,notifications:pNot,settings:pSet};
const render=()=>{PAGES[PG]();ic()};
shell();
const gs=$('#gs');gs&&gs.addEventListener('submit',e=>{e.preventDefault();location.href=href('transactions')+'?q='+encodeURIComponent($('input',gs).value.trim())});
window.addEventListener('vp:theme',()=>{const th=$('#th');if(th)th.value=document.documentElement.dataset.theme;if(PG==='index'||PG==='analytics')render()});
render();save();
