import assert from 'node:assert/strict';
import {test,beforeEach} from 'node:test';
import {loadFinanceRecords,saveDecision,readApprovals,FINANCE_KEY} from './financeData';
import {loadInstructionDetail,saveInstructionDetail} from '../overseas/instructionDetailStore';
import {readStatements,generateStatements,previewStatements,transitionStatement,statementSourceIssues,exportStatementsCsv,assertFinanceFeesEditable,reverseFinanceApprovals,RECEIVABLE_STATEMENTS_KEY} from './receivablesData';
const data=new Map<string,string>();let failWrites=false;
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{if(failWrites)throw Error('quota');data.set(key,value);},removeItem:(key:string)=>data.delete(key)}});
beforeEach(()=>{data.clear();failWrites=false;});
const approved=()=>loadFinanceRecords().filter(record=>record.status==='已通过');

test('approved instructions produce one immutable CNY statement per customer with all fee lines',()=>{
 const records=approved(),preview=previewStatements(records,'2026-11');assert.equal(records.length,12);assert.equal(preview.length,6);
 const created=generateStatements(records,'2026-11','11月费用','2026-11-04 10:00:00');assert.equal(created.length,6);assert.equal(new Set(created.map(s=>s.no)).size,6);
 assert.equal(created.reduce((sum,s)=>sum+s.items.length,0),12);
 for(const bill of created){assert.ok(bill.items.every(item=>item.customer===bill.customer));assert.equal(bill.total,Math.round(bill.items.reduce((sum,item)=>sum+item.total,0)*100)/100);for(const item of bill.items){assert.equal(item.total,Math.round((item.baseAmount+item.extraAmount)*100)/100);assert.deepEqual(item.fees,records.find(r=>r.row.instructionNo===item.instructionNo)!.fees);}}
 assert.ok(created.some(s=>s.items.some(item=>item.extraAmount>0)));assert.deepEqual(readStatements(),created);assert.equal(data.has(FINANCE_KEY),false,'generation must not change approvals');
});

test('stale, unapproved and previously billed instructions fail without partial writes',()=>{
 const records=approved(),first=generateStatements([records[0]],'2026-11'),before=data.get(RECEIVABLE_STATEMENTS_KEY);
 assert.throws(()=>generateStatements([records[1],records[0]],'2026-11'),/重复生成/);assert.equal(data.get(RECEIVABLE_STATEMENTS_KEY),before);
 const pending=loadFinanceRecords().find(r=>r.status==='待审批')!;assert.throws(()=>generateStatements([records[1],pending],'2026-11'),/状态已变更/);assert.equal(data.get(RECEIVABLE_STATEMENTS_KEY),before);
 const state=loadInstructionDetail(records[1].row);saveInstructionDetail(records[1].row,{...state,feesEdited:true,fees:records[1].fees.map(f=>({...f,unitPrice:f.unitPrice+1}))});assert.throws(()=>generateStatements([records[1]],'2026-11'),/状态已变更/);assert.equal(data.get(RECEIVABLE_STATEMENTS_KEY),before);assert.ok(first[0].total>=0);
});

test('confirmation validates sources, voiding retains history and releases allocations for regeneration',()=>{
 const record=approved()[0],bill=generateStatements([record],'2026-11')[0];assert.throws(()=>assertFinanceFeesEditable(record.row.instructionNo),/先作废/);
 const confirmed=transitionStatement(bill.id,'confirm');assert.equal(confirmed.status,'已对账');assert.throws(()=>transitionStatement(bill.id,'confirm'),/仅待对账/);assert.throws(()=>transitionStatement(bill.id,'void',' '),/作废原因/);
 const voided=transitionStatement(bill.id,'void','客户要求重新整理');assert.equal(voided.status,'已作废');assert.equal(voided.logs.length,3);assert.equal(voided.total,bill.total);assertFinanceFeesEditable(record.row.instructionNo);
 const next=generateStatements([record],'2026-11')[0];assert.notEqual(next.no,bill.no);assert.equal(readStatements().length,2);
});

test('statement snapshots and totals remain unchanged after source edits and cannot be confirmed as current',()=>{
 const record=approved()[0],bill=generateStatements([record],'2026-11')[0],before=JSON.stringify(bill);
 const state=loadInstructionDetail(record.row);saveInstructionDetail(record.row,{...state,feesEdited:true,fees:record.fees.map(f=>({...f,quantity:f.quantity+1}))});
 assert.deepEqual(statementSourceIssues(bill),[record.row.instructionNo]);assert.throws(()=>transitionStatement(bill.id,'confirm'),/来源费用或审批状态/);assert.equal(JSON.stringify(readStatements()[0]),before);
});

test('reversal preserves approval history, blocks billed sources, and requires renewed approval before billing',()=>{
 const [first,second]=approved();generateStatements([first],'2026-11');const before=data.get(FINANCE_KEY);
 assert.throws(()=>reverseFinanceApprovals([second,first],'数量需要核对'),/先作废/);assert.equal(data.get(FINANCE_KEY),before);
 reverseFinanceApprovals([second],'数量需要核对');const live=loadFinanceRecords().find(r=>r.row.instructionNo===second.row.instructionNo)!;assert.equal(live.status,'待审批');assert.equal(readApprovals()[second.row.instructionNo].logs.length,2);assert.throws(()=>generateStatements([live],'2026-11'),/状态已变更/);
 saveDecision([live],'approve','核实后通过');const reviewed=loadFinanceRecords().find(r=>r.row.instructionNo===second.row.instructionNo)!;assert.equal(reviewed.status,'已通过');assert.equal(generateStatements([reviewed],'2026-11').length,1);
});

test('failed storage writes do not claim a generated statement or modify existing state',()=>{
 const record=approved()[0];failWrites=true;assert.throws(()=>generateStatements([record],'2026-11'),/保存失败/);assert.equal(data.has(RECEIVABLE_STATEMENTS_KEY),false);failWrites=false;
 const bill=generateStatements([record],'2026-11')[0],before=data.get(RECEIVABLE_STATEMENTS_KEY);failWrites=true;assert.throws(()=>transitionStatement(bill.id,'confirm'),/保存失败/);assert.equal(data.get(RECEIVABLE_STATEMENTS_KEY),before);
});

test('exports use statement fee snapshots including extra charges and invalid data is never overwritten',()=>{
 const bill=generateStatements(approved().slice(0,3),'2026-11')[0],csv=exportStatementsCsv([bill]);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/对账单号/);assert.match(csv,/原币金额/);assert.match(csv,/指令费用/);assert.ok(csv.includes(bill.no));
 data.set(RECEIVABLE_STATEMENTS_KEY,'broken json');assert.throws(()=>readStatements(),/无法读取/);assert.throws(()=>generateStatements(approved().slice(3,4),'2026-11'),/无法读取/);assert.equal(data.get(RECEIVABLE_STATEMENTS_KEY),'broken json');
});
