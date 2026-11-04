import { loadFinanceRecords, isInactiveFinanceRecord, readApprovals, FINANCE_KEY, sumMoney, csvCell, financeCustomerFullName, financeOrderType, type FinanceRecord, type ApprovalStore } from './financeData';
import type { InstructionFeeRow } from '../overseas/instructionDetailData';
import { getInstructionFeeTotal } from '../overseas/instructionDetailStore';

export const RECEIVABLE_STATEMENTS_KEY = 'ans_receivable_statements_v1';
export type StatementStatus = '待对账' | '已对账' | '已作废';
export interface StatementItem {
  instructionNo:string; waybill:string; customer:string; customerFullName:string; warehouse:string; destination:string;
  orderType:string; names:string[]; packages:string; createdAt:string; approvedAt:string; approvedBy:string;
  revision:string; fees:InstructionFeeRow[]; baseAmount:number; extraAmount:number; total:number;
}
export interface StatementLog { at:string; operator:string; action:string; note:string }
export interface ReceivableStatement {
  id:string; no:string; customer:string; customerFullName:string; period:string; currency:'CNY';
  status:StatementStatus; createdAt:string; createdBy:string; confirmedAt:string; voidReason:string; remark:string;
  items:StatementItem[]; total:number; logs:StatementLog[];
}
export interface ReceivableRecord { record:FinanceRecord; statement?:ReceivableStatement }
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const validPeriod=(s:string)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(s)&&Number(s.slice(0,4))>0;
export const currentPeriod=()=>new Date().toLocaleString('sv-SE').slice(0,7);
export function readStatements():ReceivableStatement[] {
  const raw=localStorage.getItem(RECEIVABLE_STATEMENTS_KEY);
  if(raw===null)return [];
  try {
    const data=JSON.parse(raw);
    if(!Array.isArray(data)||data.some(s=>!s||typeof s.id!=='string'||typeof s.no!=='string'||typeof s.customer!=='string'||!validPeriod(s.period)||s.currency!=='CNY'||!['待对账','已对账','已作废'].includes(s.status)||!Number.isFinite(s.total)||!Array.isArray(s.items)||!s.items.length||!Array.isArray(s.logs)||s.items.some(i=>!i||typeof i.instructionNo!=='string'||typeof i.revision!=='string'||!Array.isArray(i.fees)||!Number.isFinite(i.total))))throw Error();
    return data;
  } catch { throw new Error('对账单数据无法读取，请保留当前数据并联系管理员处理'); }
}
function writeStatements(rows:ReceivableStatement[]) {
  try { localStorage.setItem(RECEIVABLE_STATEMENTS_KEY,JSON.stringify(rows)); }
  catch { throw new Error('对账单保存失败，请保留当前选择后重试'); }
}
export function activeStatementFor(instructionNo:string,statements=readStatements()) {
  return statements.find(s=>s.status!=='已作废'&&s.items.some(i=>i.instructionNo===instructionNo));
}
export function assertFinanceFeesEditable(instructionNo:string) {
  const statement=activeStatementFor(instructionNo);
  if(statement)throw new Error(`该指令已生成对账单 ${statement.no}，请先作废该对账单再调整费用`);
}
export function loadReceivableRecords():ReceivableRecord[] {
  const statements=readStatements();
  return loadFinanceRecords().filter(r=>r.status==='已通过'&&!isInactiveFinanceRecord(r)&&r.total!==null).map(record=>({record,statement:activeStatementFor(record.row.instructionNo,statements)}));
}
export function snapshotFinanceRecord(record:FinanceRecord):StatementItem {
  if(record.status!=='已通过'||record.total===null||isInactiveFinanceRecord(record)||!record.fees.length)throw new Error('仅审批通过且费用完整的有效指令可生成对账单');
  const approval=[...(record.approval?.logs||[])].reverse().find(log=>log.action==='审批通过'&&log.revision===record.revision);
  if(!approval)throw new Error('缺少当前费用的审批记录，请重新审批');
  const fees=structuredClone(record.fees).map(fee=>({...fee,originalAmount:round(fee.unitPrice*fee.quantity),rmbAmount:round(fee.unitPrice*fee.quantity*fee.exchangeRate)}));
  if(fees.some(f=>!Number.isFinite(f.rmbAmount)||f.unitPrice<0||f.quantity<=0||f.exchangeRate<=0))throw new Error('费用金额、数量或汇率无效，请核实后重新审批');
  const total=getInstructionFeeTotal(fees);
  if(total!==record.total||!Number.isSafeInteger(Math.round(total*100)))throw new Error('费用合计不一致或超出有效范围，请核实后重试');
  return {instructionNo:record.row.instructionNo,waybill:record.row.waybill,customer:record.row.customer,customerFullName:financeCustomerFullName(record.row),warehouse:record.row.warehouse,destination:record.row.destination,orderType:financeOrderType(record.row),names:[...record.row.names],packages:record.row.packages,createdAt:record.row.created,approvedAt:approval.at,approvedBy:approval.operator,revision:record.revision,fees,baseAmount:sumMoney(fees.filter(f=>!f.id.startsWith('finance-extra:')).map(f=>f.rmbAmount)),extraAmount:sumMoney(fees.filter(f=>f.id.startsWith('finance-extra:')).map(f=>f.rmbAmount)),total};
}
function checkedItems(records:FinanceRecord[],statements:ReceivableStatement[]):StatementItem[] {
  if(!records.length)throw new Error('请勾选运单！');
  if(new Set(records.map(r=>r.row.instructionNo)).size!==records.length)throw new Error('所选指令重复，请重新选择');
  const live=loadFinanceRecords();
  return records.map(record=>{
    const current=live.find(r=>r.row.instructionNo===record.row.instructionNo);
    if(!current||current.revision!==record.revision||current.status!=='已通过')throw new Error('费用或审批状态已变更，请刷新后重新选择');
    const linked=activeStatementFor(current.row.instructionNo,statements);
    if(linked)throw new Error(`指令 ${current.row.instructionNo} 已生成对账单 ${linked.no}，请勿重复生成`);
    return snapshotFinanceRecord(current);
  });
}
export function previewStatements(records:FinanceRecord[],period:string) {
  if(!validPeriod(period))throw new Error('请选择有效账期');
  const items=checkedItems(records,readStatements());
  const groups=new Map<string,StatementItem[]>();
  for(const item of items){const key=JSON.stringify([item.customer,item.customerFullName]);groups.set(key,[...(groups.get(key)||[]),item]);}
  return [...groups.values()].map(rows=>({customer:rows[0].customer,customerFullName:rows[0].customerFullName,items:rows,total:sumMoney(rows.map(i=>i.total)),period}));
}
export function generateStatements(records:FinanceRecord[],period:string,remark='',at=new Date().toLocaleString('sv-SE')):ReceivableStatement[] {
  if(remark.length>500)throw new Error('账单备注不能超过500字');
  const stored=readStatements(),groups=previewStatements(records,period);
  const prefix='AR'+at.slice(0,10).replaceAll('-','');
  let serial=Math.max(0,...stored.filter(s=>s.no.startsWith(prefix)).map(s=>Number(s.no.slice(prefix.length))||0));
  const created=groups.map(group=>{
    const no=prefix+String(++serial).padStart(4,'0');
    return {id:no,no,customer:group.customer,customerFullName:group.customerFullName,period,currency:'CNY' as const,status:'待对账' as const,createdAt:at,createdBy:'天朗',confirmedAt:'',voidReason:'',remark:remark.trim(),items:group.items,total:group.total,logs:[{at,operator:'天朗',action:'生成应收对账单',note:`按客户归集 ${group.items.length} 张指令单；账期 ${period}`}]} satisfies ReceivableStatement;
  });
  writeStatements([...created,...stored]);return created;
}
export function statementSourceIssues(statement:ReceivableStatement,live=loadFinanceRecords()):string[] {
  return statement.items.flatMap(item=>{
    const current=live.find(r=>r.row.instructionNo===item.instructionNo);
    return !current||current.status!=='已通过'||current.revision!==item.revision||isInactiveFinanceRecord(current)?[item.instructionNo]:[];
  });
}
export function transitionStatement(id:string,action:'confirm'|'void',note='',at=new Date().toLocaleString('sv-SE')) {
  const rows=readStatements(),target=rows.find(s=>s.id===id);
  if(!target)throw new Error('对账单不存在，请刷新后重试');
  if(target.status==='已作废')throw new Error('该对账单已作废');
  if(action==='confirm'&&target.status!=='待对账')throw new Error('仅待对账单可以确认对账');
  if(action==='confirm'&&statementSourceIssues(target).length)throw new Error('来源费用或审批状态已变更，请作废账单并重新生成');
  if(action==='void'&&!note.trim())throw new Error('请填写作废原因');
  if(note.length>500)throw new Error('处理原因不能超过500字');
  const updated={...target,status:action==='confirm'?'已对账' as const:'已作废' as const,confirmedAt:action==='confirm'?at:target.confirmedAt,voidReason:action==='void'?note.trim():target.voidReason,logs:[...target.logs,{at,operator:'天朗',action:action==='confirm'?'确认对账':'作废对账单',note:note.trim()||'已核对账单金额与费用明细'}]};
  writeStatements(rows.map(row=>row.id===id?updated:row));return updated;
}
export function reverseFinanceApprovals(records:FinanceRecord[],reason:string) {
  if(!records.length)throw new Error('请勾选运单！');
  if(!reason.trim())throw new Error('请填写反审核原因');
  if(reason.length>500)throw new Error('反审核原因不能超过500字');
  const live=loadFinanceRecords(),store:ApprovalStore={...readApprovals()},at=new Date().toLocaleString('sv-SE');
  const checked=records.map(record=>{
    assertFinanceFeesEditable(record.row.instructionNo);
    const current=live.find(r=>r.row.instructionNo===record.row.instructionNo);
    if(!current||current.status!=='已通过'||current.revision!==record.revision||isInactiveFinanceRecord(current))throw new Error('费用或审批状态已变更，请刷新后重试');
    return current;
  });
  for(const record of checked)store[record.row.instructionNo]={status:'待审批',revision:record.revision,logs:[...(record.approval?.logs||[]),{id:`reverse:${record.row.instructionNo}:${at}`,at,operator:'天朗',action:'反审核',note:reason.trim(),total:record.total,revision:record.revision}]};
  try{localStorage.setItem(FINANCE_KEY,JSON.stringify(store));}catch{throw new Error('反审核保存失败，请重试');}
}
export function exportStatementsCsv(statements:ReceivableStatement[]) {
  const headers=['对账单号','客户简称','客户名称','账期','账单状态','指令单号','原运单号','下单类型','仓库代码','费用类别','费用名称','单价','币种','汇率','数量','单位','原币金额','金额(CNY)','添加时间','添加人','费用备注','审批人','审批时间'];
  const rows=statements.flatMap(s=>s.items.flatMap(item=>item.fees.map(f=>[s.no,s.customer,s.customerFullName,s.period,s.status,item.instructionNo,item.waybill,item.orderType,item.warehouse,f.id.startsWith('finance-extra:')?'追加费用':'指令费用',f.name,f.unitPrice,f.currency,f.exchangeRate,f.quantity,f.unit,f.originalAmount,f.rmbAmount,f.addedAt,f.addedBy,f.remark,item.approvedBy,item.approvedAt])));
  return '\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
