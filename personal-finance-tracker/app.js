import { categories,cents,summary,today,validate } from './finance.js';
const $=id=>document.getElementById(id), key='mintbook-v1';
let state={version:1,transactions:[],budgets:{}}, editing=null, blocked=false;
function notice(text){ $('notice').textContent=text; $('notice').hidden=false; }
try { const raw=localStorage.getItem(key); if(raw) state=validate(JSON.parse(raw)); } catch { blocked=true; notice('Saved data could not be read. Changes are blocked to protect it. Restore a backup or check browser storage.'); }
function save(next,restore=false){
 if(blocked&&!restore){ notice('Reload the page or import a valid backup before making changes.'); return false; }
 try {validate(next); localStorage.setItem(key,JSON.stringify(next)); state=next; blocked=false; render(); return true;} catch {notice('Unable to save. Check the data and available browser storage.'); return false;}
}
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
for(const c of categories) for(const id of ['category','category-filter']) $(id).add(new Option(c,c));
$('month').value=today().slice(0,7);
function render(){
 const month=$('month').value, totals=summary(state.transactions,month), limit=state.budgets[month]||0;
 for(const id of ['income','expense','balance']) $(id).textContent=money(totals[id]);
 $('spent').textContent=money(totals.expense); $('limit').textContent=limit?' / '+money(limit):' / No budget yet';
 $('progress').value=limit?Math.min(100,totals.expense/limit*100):0;
 $('budget-message').textContent=limit?(totals.expense>limit?money(totals.expense-limit)+' over budget.':money(limit-totals.expense)+' left to spend this month.'):'Set a budget to track your progress.';
 $('budget-input').value=limit?(limit/100).toFixed(2):'';
 const monthly=state.transactions.filter(t=>t.date.startsWith(month));
 $('breakdown').replaceChildren();
 const spending=categories.map(c=>[c,monthly.filter(t=>t.type==='expense'&&t.category===c).reduce((n,t)=>n+t.amount,0)]).filter(([,n])=>n).sort((a,b)=>b[1]-a[1]);
 if(!spending.length){const p=document.createElement('p');p.className='chart-empty';p.textContent='Your spending story starts with your first expense.';$('breakdown').append(p);}
 for(const [category,n] of spending){const line=document.createElement('div');line.className='category-line';const label=document.createElement('div');const name=document.createElement('span');name.textContent=category;const value=document.createElement('strong');value.textContent=money(n);label.append(name,value);const bar=document.createElement('progress');bar.max=totals.expense;bar.value=n;bar.setAttribute('aria-label',category);line.append(label,bar);$('breakdown').append(line);}
 const rows=monthly.filter(t=>t.description.toLowerCase().includes($('search').value.toLowerCase())&&(!$('type-filter').value||t.type===$('type-filter').value)&&(!$('category-filter').value||t.category===$('category-filter').value)).sort((a,b)=>b.date.localeCompare(a.date));
 $('count').textContent=rows.length+' transactions';$('rows').replaceChildren();$('empty').hidden=rows.length>0;
 $('empty').querySelector('h3').textContent=monthly.length?'No matching transactions':'A fresh start for your finances';
 $('empty').querySelector('p').textContent=monthly.length?'Try another search or filter.':'Add your first transaction to see your month take shape.';
 for(const t of rows){const tr=document.createElement('tr');for(const v of [t.description,t.category,t.date,(t.type==='income'?'+':'−')+money(t.amount)]){const td=document.createElement('td');td.textContent=v;tr.append(td);}tr.children[3].className=t.type==='income'?'positive':'';const td=document.createElement('td');for(const action of ['Edit','Delete']){const button=document.createElement('button');button.textContent=action;button.setAttribute('aria-label',action+' '+t.description);button.onclick=()=>{if(action==='Edit')open(t);else if(confirm('Delete “'+t.description+'”?')&&save({...state,transactions:state.transactions.filter(x=>x.id!==t.id)}))notice('Transaction deleted.');};td.append(button);}tr.append(td);$('rows').append(tr);}
}
function open(t){editing=t?.id||null;const form=$('transaction-form');form.reset();$('dialog-title').textContent=editing?'Edit transaction':'Add transaction';for(const field of ['description','type','category'])if(t)form.elements[field].value=t[field];form.elements.date.value=t?.date||today();form.elements.amount.value=t?(t.amount/100).toFixed(2):'';$('form-error').textContent='';$('dialog').showModal();}
$('add').onclick=$('empty-add').onclick=()=>open();$('close').onclick=()=>$('dialog').close();
$('transaction-form').onsubmit=e=>{e.preventDefault();try{const v=Object.fromEntries(new FormData(e.target));const t={...v,description:v.description.trim(),amount:cents(v.amount),id:editing||crypto.randomUUID()};const next={...state,transactions:editing?state.transactions.map(x=>x.id===editing?t:x):[...state.transactions,t]};validate(next);if(save(next)){$('month').value=t.date.slice(0,7);render();$('dialog').close();notice('Transaction saved.');}}catch(error){$('form-error').textContent=error.message;}};
$('budget-form').onsubmit=e=>{e.preventDefault();try{if(save({...state,budgets:{...state.budgets,[$('month').value]:cents($('budget-input').value)}}))notice('Monthly budget saved.');}catch(error){notice(error.message);}};
for(const id of ['month','search','type-filter','category-filter'])$(id).addEventListener('input',()=>{if(!$('month').value)$('month').value=today().slice(0,7);render();});
$('export').onclick=()=>{if(blocked){notice('Saved data could not be read. Reload before exporting.');return;}const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mintbook-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Backup exported. Store it privately; it contains your financial records.');};
$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw Error('Backup must be smaller than 5 MB.');const next=validate(JSON.parse(await file.text()));if(confirm('Replace all current transactions and budgets with this backup?')&&save(next,true))notice('Backup restored.');}catch(error){notice('Import failed: '+error.message);}e.target.value='';};
window.addEventListener('storage',e=>{if(e.key===key||e.key===null){blocked=true;notice('Data changed in another tab. Reload before making changes.');}});
render();
