import reference from './interceptReference.json';
﻿import seeds from './interceptSeeds.json';
import { getInventoryFeeCatalog, loadOverseasInventory, OVERSEAS_INVENTORY_STORAGE_KEY, type InventoryState, type StorageFeeLine, type StorageAttachment } from './overseasStorageInventoryData';
export type InterceptStatus = '待审批'|'拦截中'|'拦截成功'|'拦截失败'|'已取消'|'已驳回';
export type InterceptTab = '全部'|'待审批'|'拦截中'|'已完成'|'取消/驳回';
export type InterceptAction = 'approve'|'reject'|'cancel'|'success'|'failure'|'remark';
export interface InterceptLog { time:string; user:string; action:string; change:string; note:string }
export interface InterceptAttachment extends StorageAttachment { category:string; visible:boolean; uploadedAt:string; uploadedBy:string; blobKey?:string }
export interface InterceptTask {
 id:number; no:string; waybillNo:string; customerOrderNo:string; latestTracking:string; waybill:string; container:string; system:string; customer:string; source:string; warehouse:string;
 cargoStatus:string; inventoryStatus:string; outboundStatus:string; boxes:number; status:InterceptStatus; interceptType:string;
 reconciliationStatus:string; forecastStatus?:string; reason:string; customerRemark:string; remark:string; applicant:string; appliedAt:string;
 handler:string; handleAt:string; failReason:string; terminationReason:string; actualBoxes:string; storageNo:string; resultRemark:string;
 fees:StorageFeeLine[]; charges:StorageFeeLine[]; attachments:InterceptAttachment[]; logs:InterceptLog[];
}
export const INTERCEPT_STORAGE_KEY='ans-overseas-intercepts-v1';
export const interceptTabs:InterceptTab[]=['待审批','拦截中','已完成','取消/驳回','全部'];
export const emptyInterceptFilters={no:'',waybillNo:'',customerOrderNo:'',latestTracking:'',customer:'',from:'',to:''};
export type InterceptFilters=typeof emptyInterceptFilters;
export const nowText=()=>new Date().toLocaleString('sv-SE');
export const uid=()=>crypto.randomUUID();
function referenceFees(no:string,rows:Record<string,unknown>[]):StorageFeeLine[]{
 return rows.map((row,index)=>({id:'charge-'+no+'-'+index,code:String(row.code||''),name:String(row.name||''),type:String(row.type||'操作费'),unit:String(row.unit||'票'),currency:String(row.currency||'人民币'),exchangeRate:Number(row.exchangeRate||1),unitPrice:Number(row.unitPrice??row.price??0),quantity:Number(row.quantity??1),feeRemark:String(row.remark||row.description||''),instructionRemark:String(row.description||''),billingTime:String(row.billingTime||row.addedAt||''),addedAt:String(row.addedAt||''),addedBy:String(row.addedBy||'系统'),status:row.status==='已处理'?'已处理':'待处理'}));
}
export function normalizeIntercept(task:InterceptTask):InterceptTask {
 const ref=reference.find(row=>row.no===task.no);
 return {...task,status:(String(task.status)==='已确认'?'拦截中':task.status),waybillNo:task.waybillNo??ref?.waybillNo??task.waybill??'',customerOrderNo:task.customerOrderNo??ref?.customerOrderNo??'',latestTracking:task.latestTracking??ref?.latestTracking??'',charges:Array.isArray(task.charges)?task.charges:referenceFees(task.no,ref?.fees||[])};
}
export function createInitialIntercepts():InterceptTask[]{
 const catalog=getInventoryFeeCatalog();
 const template=catalog.find(row=>row.name.includes('拦截'));
 return seeds.map(seed=>{
  const status=({'待处理':'待审批','已确认':'拦截中','已完成':'拦截成功'} as Record<string,InterceptStatus>)[seed.status]||seed.status as InterceptStatus;
  return normalizeIntercept({...seed,status,waybillNo:reference.find(r=>r.no===seed.no)?.waybillNo||seed.waybill,customerOrderNo:reference.find(r=>r.no===seed.no)?.customerOrderNo||'',latestTracking:reference.find(r=>r.no===seed.no)?.latestTracking||'',charges:referenceFees(seed.no,reference.find(r=>r.no===seed.no)?.fees||[]),interceptType:('interceptType' in seed?String(seed.interceptType):'')||(seed.cargoStatus==='未拆柜'?'拆柜前拦截':'拆柜后拦截'),
   terminationReason:('terminationReason' in seed?String(seed.terminationReason):'')||seed.failReason||'',
   fees:reference.some(r=>r.no===seed.no)?referenceFees(seed.no,reference.find(r=>r.no===seed.no)?.instructionFees||[]):template?[{...template,id:'INT-'+seed.no+'-fee',quantity:1,images:[]}]:[],
   attachments:seed.attachment&&seed.attachment!=='-'?[{id:'attachment-'+seed.id,name:seed.attachment,size:0,type:'',category:'其他',visible:true,uploadedAt:seed.appliedAt,uploadedBy:seed.applicant}]:[]});
 });
}
export function loadIntercepts():InterceptTask[]{
 try{const saved=JSON.parse(localStorage.getItem(INTERCEPT_STORAGE_KEY)||'null');
 if(Array.isArray(saved)&&saved.every(t=>t&&Number.isInteger(t.id)&&typeof t.no==='string'&&['待审批','已确认','拦截中','拦截成功','拦截失败','已取消','已驳回'].includes(t.status)&&Array.isArray(t.fees)&&Array.isArray(t.attachments)&&Array.isArray(t.logs)))return saved.map(normalizeIntercept);
 }catch{}return createInitialIntercepts();
}
export function matchesInterceptTab(task:InterceptTask,tab:string){return tab==='全部'||!tab||tab==='已完成'&&['拦截成功','拦截失败'].includes(task.status)||tab==='取消/驳回'&&['已取消','已驳回'].includes(task.status)||task.status===tab;}
export function forecastStatus(task:InterceptTask){return task.forecastStatus||({'待审批':'待预报','拦截中':'预报中','拦截成功':'预报成功','拦截失败':'预报失败','已取消':'已取消','已驳回':'预报失败'}[task.status]);}
export function filterIntercepts(tasks:InterceptTask[],filters:InterceptFilters,tab:InterceptTab){
 const includes=(actual:string,expected:string)=>(actual||'').toLowerCase().includes(expected.trim().toLowerCase());
 return tasks.filter(task=>matchesInterceptTab(task,tab)&&(['no','waybillNo','customerOrderNo','latestTracking'] as const).every(key=>includes(task[key],filters[key]))
 &&(!filters.customer||task.customer===filters.customer)
 &&(!filters.from||task.appliedAt.slice(0,10)>=filters.from)&&(!filters.to||task.appliedAt.slice(0,10)<=filters.to));
}
const actionNames:Record<InterceptAction,string>={approve:'审批通过',reject:'审批驳回',cancel:'取消拦截',success:'拦截成功',failure:'拦截失败',remark:'内部备注'};
export function transitionIntercepts(tasks:InterceptTask[],ids:number[],action:InterceptAction,note:string,inventory:InventoryState,actualBoxes?:number){
 const selected=tasks.filter(t=>ids.includes(t.id));
 if(!selected.length||selected.length!==new Set(ids).size)throw new Error('请先选择拦截任务');
 if(['reject','cancel','failure'].includes(action)&&!note.trim())throw new Error('请填写处理原因');
 if(note.trim().length>200)throw new Error('备注不能超过200字');
 for(const task of selected){
  if(['approve','reject'].includes(action)&&task.status!=='待审批')throw new Error('仅待审批任务可进行审批');
  if(['cancel','success','failure'].includes(action)&&task.status!=='拦截中')throw new Error('仅拦截中任务可反馈处理结果');
  if(action==='success'&&actualBoxes!==undefined&&(!Number.isInteger(actualBoxes)||actualBoxes<=0||actualBoxes>task.boxes))throw new Error('实际拦截箱数必须为正整数，且不能超过申请箱数');
 }
 const nextInventory:InventoryState={...inventory,records:[...inventory.records],logs:[...inventory.logs]};
 const next=tasks.map(task=>{
  if(!ids.includes(task.id))return task;
  const row={...task,logs:[...task.logs]};const previous=row.status;const at=nowText();
  if(action==='approve'){
   row.status=task.cargoStatus==='已出库'?'已驳回':'拦截中';
   if(row.status==='已驳回')row.terminationReason='货物已完成出库，无法执行拦截';
  }else if(action==='reject'){row.status='已驳回';row.terminationReason=note.trim();}
  else if(action==='cancel'){row.status='已取消';row.terminationReason=note.trim();}
  else if(action==='failure'){row.status='拦截失败';row.failReason=note.trim();row.terminationReason=note.trim();}
  else if(action==='remark'){row.remark=note.trim();}
  else{
   row.status='拦截成功';row.actualBoxes=String(actualBoxes??task.boxes);row.cargoStatus='暂存中';row.inventoryStatus='暂存';row.outboundStatus='未出库';
   row.storageNo||='STG'+at.slice(0,10).replaceAll('-','')+String(task.id).padStart(4,'0');
   const id='INT-'+task.no;const count=Number(row.actualBoxes);
   if(!nextInventory.records.some(record=>record.id===id)){
    nextInventory.records.unshift({id,customer:row.customer,container:row.container,system:row.system,inbound:row.waybill,waybillNo:row.waybill,blocked:'拦截',transfer:'拆转',destination:'',dispatch:'',pallet:row.storageNo,time:at,weight:0,volume:0,boxes:count,pending:0,unsent:count,sent:0,status:'暂存',location:'待分配',remark:note.trim()||row.reason,
     instructions:structuredClone(row.fees),cargoBoxes:Array.from({length:count},(_,i)=>({id:id+'-box-'+i,recordId:id,boxNo:row.waybill+'-'+String(i+1).padStart(3,'0'),weight:0,dimensions:'待复核',systemWeight:0,status:'待处理' as const}))});
    nextInventory.logs.push({id:uid(),recordId:id,at,action:'拦截转暂存',details:['拦截单号：'+row.no,'实际拦截箱数：'+count,'暂存单号：'+row.storageNo]});
   }
  }
  if(action!=='remark'){row.handler='仓库-李明';row.handleAt=at;row.resultRemark=note.trim();}
  row.logs.push({time:at,user:'仓库-李明',action:actionNames[action],change:previous===row.status?'—':previous+' → '+row.status,note:action==='success'?'实际拦截 '+row.actualBoxes+' 箱，已生成暂存单 '+row.storageNo+(note?'；'+note:''):row.terminationReason&&row.status==='已驳回'?row.terminationReason:note.trim()||actionNames[action]});
  return row;
 });
 return {tasks:next,inventory:nextInventory};
}
export function persistIntercepts(tasks:InterceptTask[],inventory?:InventoryState){
 const before=localStorage.getItem(INTERCEPT_STORAGE_KEY);const beforeInventory=inventory?localStorage.getItem(OVERSEAS_INVENTORY_STORAGE_KEY):null;
 try{localStorage.setItem(INTERCEPT_STORAGE_KEY,JSON.stringify(tasks));if(inventory)localStorage.setItem(OVERSEAS_INVENTORY_STORAGE_KEY,JSON.stringify(inventory));}
 catch{try{before===null?localStorage.removeItem(INTERCEPT_STORAGE_KEY):localStorage.setItem(INTERCEPT_STORAGE_KEY,before);if(inventory)beforeInventory===null?localStorage.removeItem(OVERSEAS_INVENTORY_STORAGE_KEY):localStorage.setItem(OVERSEAS_INVENTORY_STORAGE_KEY,beforeInventory);}catch{}throw new Error('保存失败，本地存储空间不足或不可用，请减少附件后重试');}
}
export type InterceptColumnKey='customer'|'no'|'waybillNo'|'customerOrderNo'|'latestTracking'|'reason'|'boxes'|'instructionCount'|'instructions'|'customerRemark'|'remark'|'applicant'|'appliedAt'|'result'|'failureReason'|'status'|'terminationReason';
export function getInterceptColumns(tab:InterceptTab):{key:InterceptColumnKey;label:string}[]{
 const columns:{key:InterceptColumnKey;label:string}[]=[{key:'customer',label:'客户名称'},{key:'no',label:'拦截单号'},{key:'waybillNo',label:'运单号'},{key:'customerOrderNo',label:'客户单号'},{key:'latestTracking',label:'最新运踪'},{key:'reason',label:'拦截原因'},{key:'boxes',label:'拦截箱数'},{key:'instructionCount',label:'指令数量'},{key:'instructions',label:'指令'},{key:'customerRemark',label:'客户备注'},{key:'remark',label:'内部备注'},{key:'applicant',label:'申请人'},{key:'appliedAt',label:'申请时间'}];
 if(tab==='已完成')columns.push({key:'result',label:'拦截结果'},{key:'failureReason',label:'失败原因'});
 if(tab==='取消/驳回')columns.push({key:'terminationReason',label:'取消/驳回原因'});
 return columns;
}
export function getInterceptCellText(task:InterceptTask,key:InterceptColumnKey):string{
 if(key==='boxes')return task.actualBoxes||String(task.boxes);
 if(key==='instructionCount')return task.fees.filter(f=>f.status==='已处理').length+'/'+task.fees.length;
 if(key==='instructions')return task.fees.map(f=>(f.status==='已处理'?'已处理':'待处理')+' '+Number((f.unitPrice*f.quantity).toFixed(4))+' '+({'人民币':'CNY','美元':'USD','欧元':'EUR','英镑':'GBP'}[f.currency]||f.currency)+' '+f.name+' ('+f.unitPrice+'/'+f.unit+')').join('；');
 if(key==='status')return ['拦截成功','拦截失败'].includes(task.status)?'已完成':task.status==='待审批'?'待处理':task.status;
 if(key==='result')return ['拦截成功','拦截失败'].includes(task.status)?task.status:'';
 if(key==='failureReason')return task.status==='拦截失败'?task.failReason:'';
 if(key==='terminationReason')return ['已取消','已驳回'].includes(task.status)?task.terminationReason:'';
 return String(task[key]??'');
}
export function exportInterceptCsv(rows:InterceptTask[],tab:InterceptTab='全部'){
 const columns=getInterceptColumns(tab);const cell=(value:unknown)=>{let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return '\uFEFF'+[columns.map(c=>cell(c.label)).join(','),...rows.map(row=>columns.map(c=>cell(getInterceptCellText(row,c.key))).join(','))].join('\r\n');
}
export {loadOverseasInventory};
