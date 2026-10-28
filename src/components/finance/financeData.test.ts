import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { csvCell, decideApprovals, financeRecord, loadFinanceRecords, saveDecision, readApprovals, sumMoney, FINANCE_KEY } from './financeData';
import { instructionSeedRows } from '../overseas/instructionListSource';
import { buildInstructionDetail } from '../overseas/instructionDetailData';
import { loadInstructionDetail, saveInstructionDetail } from '../overseas/instructionDetailStore';
const data=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v)}});
beforeEach(()=>data.clear());
const row=instructionSeedRows[0],fees=buildInstructionDetail(row).feeRows;
test('approval is keyed by instruction, leaves business state intact and retains history',()=>{
  const record=financeRecord(row,fees,{}),next=decideApprovals({},[record],'approve','金额核对无误');
  assert.equal(financeRecord(row,fees,next).status,'已通过');
  assert.equal(next[row.instructionNo].logs[0].total,144);
  assert.equal(financeRecord({...row,instructionNo:'another-instruction'},fees,next).status,'待审批');
  assert.equal(record.row.tab,row.tab);
});
test('price, quantity, currency, rate and remarks changes invalidate a previous approval even when total is equal',()=>{
  const record=financeRecord(row,fees,{}),store=decideApprovals({},[record],'approve','');
  for(const patch of [{unitPrice:72,quantity:2},{currency:'USD'},{exchangeRate:2},{remark:'已核实新计费规则'}]){
    const changed=financeRecord(row,fees.map(f=>({...f,...patch})),store);
    assert.equal(changed.status,'待审批');assert.equal(changed.changed,true);assert.equal(changed.approval?.logs.length,1);
  }
});
test('warehouse progress does not invalidate finance approval; cancelled or rejected business stops approval',()=>{
  const store=decideApprovals({},[financeRecord(row,fees,{})],'approve','');
  assert.equal(financeRecord({...row,tab:'已完成'},fees,store).status,'已通过');
  for(const tab of ['取消','驳回'] as const){const r=financeRecord({...row,tab},fees,store);assert.equal(r.status,'已通过');assert.throws(()=>decideApprovals(store,[r],'approve',''));}
});
test('unknown fees remain unknown while an explicit zero amount can be approved',()=>{
  const missing=financeRecord(row,[],{});assert.equal(missing.total,null);assert.equal(missing.status,'待审批');assert.throws(()=>decideApprovals({},[missing],'approve',''));
  const zero=financeRecord(row,fees.map(f=>({...f,unitPrice:0})),{});assert.equal(zero.total,0);assert.equal(zero.status,'待审批');
});
test('reject requires a reason and resubmission retains the complete history',()=>{
  const r=financeRecord(row,fees,{});assert.throws(()=>decideApprovals({},[r],'reject','   '));
  const rejected=decideApprovals({},[r],'reject','请核实件数');
  const submitted=decideApprovals(rejected,[financeRecord(row,fees,rejected)],'resubmit','已核实');
  assert.equal(financeRecord(row,fees,submitted).status,'待审批');assert.equal(submitted[row.instructionNo].logs.length,2);
});
test('rounding totals and CSV exports are safe for money and formula-like text',()=>{
  assert.equal(sumMoney([0.1,0.2,null]),0.3);assert.equal(csvCell('=SUM(A1)'),`"'=SUM(A1)"`);assert.equal(csvCell('a"b'), '"a""b"');
});
test('loads the same instruction fee source and rejects stale approvals after source changes',()=>{
  const r=loadFinanceRecords().find(r=>r.status==='待审批')!;assert.ok(r);
  const state=loadInstructionDetail(r.row);
  saveInstructionDetail(r.row,{...state,feesEdited:true,fees:state.fees.map(f=>({...f,unitPrice:f.unitPrice+1}))});
  assert.throws(()=>saveDecision([r],'approve',''),/费用或状态已变更/);assert.equal(data.has(FINANCE_KEY),false);
  const current=loadFinanceRecords().find(v=>v.row.instructionNo===r.row.instructionNo)!;
  saveDecision([current],'approve','');assert.equal(readApprovals()[r.row.instructionNo].status,'已通过');
});
