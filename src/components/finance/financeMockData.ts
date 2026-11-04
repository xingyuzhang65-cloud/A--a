import type { InstructionListRow } from '../overseas/instructionListTypes';
import type { InstructionFeeRow } from '../overseas/instructionDetailData';

export interface FinanceMock {
  row: InstructionListRow & { customerFullName: string };
  fees: InstructionFeeRow[];
  status: '待审批' | '已通过' | '已驳回';
  note: string;
}
const customers = [
  ['天图跨境', '深圳市天图跨境物流有限公司'], ['海辰电商', '深圳市海辰电子商务有限公司'],
  ['星宇供应链', '广州星宇供应链管理有限公司'], ['远航国际', '宁波远航国际贸易有限公司'],
  ['盛达科技', '东莞市盛达科技有限公司'], ['优品出海', '杭州优品出海贸易有限公司'],
];
const warehouses = ['LAX1','FTW1','ABE3','ONT8','RDU4','LGB8'];
const services = [
  {type:'放货', names:['贴标','换箱'], name:'贴标服务费', unit:'箱'},
  {type:'不放货', names:['拍照','清点'], name:'清点服务费', unit:'件'},
  {type:'销毁', names:['货物销毁'], name:'货物销毁费', unit:'kg'},
  {type:'自提', names:['自提装卸'], name:'自提装卸费', unit:'托'},
];
const round = (value:number) => Math.round((value + Number.EPSILON) * 100) / 100;

// Finance-only examples: stable identities and no writes on page load.
export const financeMocks: FinanceMock[] = Array.from({length:48}, (_, index) => {
  const serial = String(index + 1).padStart(3,'0');
  const day = String(20 + index % 9).padStart(2,'0');
  const created = `2026-10-${day} ${String(8 + index % 10).padStart(2,'0')}:20:00`;
  const waybill = `USSZ202610${day}90${serial}`;
  const service = services[index % services.length];
  const [customer,customerFullName] = customers[index % customers.length];
  const status = index < 24 ? '待审批' : index < 36 ? '已通过' : '已驳回';
  const currency = index % 3 === 0 ? 'USD' : index % 3 === 1 ? 'CNY' : 'EUR';
  const exchangeRate = currency === 'USD' ? 7.1 : currency === 'EUR' ? 7.75 : 1;
  const fee = (id:string,name:string,unitPrice:number,quantity:number,unit:string,extra=false):InstructionFeeRow => ({
    id,name,type:'操作费',unit,currency,exchangeRate,unitPrice,quantity,
    originalAmount:round(unitPrice * quantity),rmbAmount:round(unitPrice * quantity * exchangeRate),
    billingTime:created,addedAt:created,addedBy:extra?'财务-天朗':'业务-李敏',
    remark:extra?'客户临时增加作业，按实际发生计费':'按客户确认的服务项目计费',status:'待处理',
  });
  const fees = [fee(`finance-demo:${serial}:base`,service.name,3.5 + index % 8,2 + index % 9,service.unit)];
  if(index % 2 === 0) fees.push(fee(`finance-demo:${serial}:packing`,'包材使用费',1.5,2 + index % 4,'件'));
  if(index % 3 !== 1) fees.push(fee(`finance-extra:demo:${serial}`,'临时加急作业费',8 + index % 5,1,'次',true));
  const total=round(fees.reduce((sum,item)=>sum+item.rmbAmount,0));
  const row:FinanceMock['row']={
    id:`finance-mock:${serial}`,instructionNo:`${waybill}_10${day}_001`,waybill,
    tab:index % 3 === 0?'已下单':index % 3 === 1?'处理中':'已完成',
    status:index % 3 === 2?'已处理':'待处理',names:service.names,created,updated:created,
    customer,customerFullName,warehouse:warehouses[index % warehouses.length],destination:`MW00${index % 6 + 1}`,
    instructionType:service.type,orderType:index % 2 === 0?'亚马逊':'沃尔玛',shipment:'-',reference:'-',zip:'-',
    salesman:'业务-李敏',merchandiser:'客服-张敏',fee:String(total),packages:String(2 + index % 9),weight:String(18 + index * 2),volume:'0.12',arrived:'是',overseasTime:created,
  };
  return {row,fees,status,note:status==='已通过'?'费用、数量及汇率已核对无误':status==='已驳回'?['计费数量与实际作业记录不一致，请核实','追加费用缺少客户确认，请补充说明','费用单价与约定报价不一致，请调整'][index % 3]:''};
});
