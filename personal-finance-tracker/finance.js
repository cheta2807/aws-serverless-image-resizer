export const categories = ['Housing','Food','Transport','Shopping','Health','Entertainment','Salary','Other'];
export const today = () => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
export function cents(value) {
 if (!/^\d+(\.\d{1,2})?$/.test(value)) throw Error('Use a positive amount with up to two decimal places.');
 const n = Math.round(Number(value)*100);
 if (!Number.isSafeInteger(n) || n <= 0 || n > 100000000000) throw Error('Amount must be between 0.01 and 1,000,000,000.');
 return n;
}
export function validate(data) {
 if (!data || data.version !== 1 || !Array.isArray(data.transactions) || data.transactions.length > 10000 || !data.budgets || typeof data.budgets !== 'object' || Array.isArray(data.budgets)) throw Error('Invalid backup.');
 const ids = new Set();
 for (const t of data.transactions) {
  if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || typeof t.description !== 'string' || !t.description.trim() || t.description.length > 100 || !['income','expense'].includes(t.type) || !categories.includes(t.category) || !Number.isSafeInteger(t.amount) || t.amount <= 0 || t.amount > 100000000000 || typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || !Number.isFinite(Date.parse(t.date)) || new Date(t.date).toISOString().slice(0,10) !== t.date) throw Error('Invalid transaction.');
  ids.add(t.id);
 }
 for (const [month,n] of Object.entries(data.budgets)) if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isSafeInteger(n) || n <= 0 || n > 100000000000) throw Error('Invalid budget.');
 return data;
}
export function summary(transactions,month) {
 let income=0,expense=0;
 for (const t of transactions.filter(t=>t.date.startsWith(month))) { if(t.type==='income') income+=t.amount; else expense+=t.amount; }
 return {income,expense,balance:income-expense};
}
