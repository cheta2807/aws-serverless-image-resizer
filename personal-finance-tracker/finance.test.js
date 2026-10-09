import test from 'node:test';
import assert from 'node:assert/strict';
import {cents,summary,validate} from './finance.js';
const t={id:'one',description:'Groceries',type:'expense',category:'Food',amount:1030,date:'2026-10-09'};
const data=()=>({version:1,transactions:[{...t}],budgets:{'2026-10':20000}});
test('amounts preserve cents and reject malformed values',()=>{assert.equal(cents('10.30'),1030);assert.equal(cents('0.29'),29);for(const n of ['0','-1','NaN','1e3','1.001','1000000001',''])assert.throws(()=>cents(n));});
test('monthly totals separate income and exclude other months',()=>{assert.deepEqual(summary([t,{...t,type:'income',amount:20000},{...t,date:'2026-09-30'}],'2026-10'),{income:20000,expense:1030,balance:18970});assert.deepEqual(summary([],'2026-10'),{income:0,expense:0,balance:0});});
test('backups round trip and reject corrupt records',()=>{assert.deepEqual(validate(JSON.parse(JSON.stringify(data()))),data());for(const patch of [{amount:-1},{amount:1.1},{date:'2026-02-30'},{type:'unknown'},{category:'unknown'},{description:' '}]){const d=data();Object.assign(d.transactions[0],patch);assert.throws(()=>validate(d));}const d=data();d.transactions.push(t);assert.throws(()=>validate(d));assert.throws(()=>validate({...data(),budgets:{'2026-13':100}}));assert.throws(()=>validate({...data(),version:2}));});
