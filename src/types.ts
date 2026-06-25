export type WaybillStatus = '入仓' | '出库' | '出仓' | '运输' | '签收' | '扣货' | '取消';

export interface Waybill {
  id: string;
  idx: number;
  clientName: string; // 客户简称
  fbaNo: string; // FBA单号
  waybillNo: string; // 运单号
  destination: string; // 目的地
  declarationType: string; // 报关方式
  tradeMode: string; // 贸易方式 (9610/9710/9810/0110/1039)
  eta: string; // ETA
  productName: string; // 品名
  etd: string; // ETD
  vesselVoyage: string; // 船名航次
  declarationValue: number; // 申报总值
  attachments: number; // 附件个数
  issueType: string; // 问题类型
  courierCompany: string; // 快递公司
  channel: string; // 渠道
  status: WaybillStatus; // 运单状态
  clientRemark: string; // 客户备注
  internalRemark: string; // 内部备注
  warehouseCode: string; // 仓库代码
  zipCode: string; // 邮编
  merchandiser: string; // 跟单员
  label: string; // 标签
  taxPayment: string; // 交税方式
  operator: string; // 经营单位
  trackingNo: string; // 转单号 (跟单/转单)
  invoiceMade: string; // 制作发票
  createTime: string; // 下单/创建时间
  pickTime?: string; // 拣货时间
  outTime?: string; // 出仓时间
  pickWarehouse?: string; // 拣货仓库
  salesman: string; // 业务员
  customerService: string; // 客服
  waybillType: string; // 运单类型
  hasInsurance: string; // 有无退运保
  hasDocs: string; // 有无报关资料
  customsRoom: string; // 国内查验室
}

export interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  department: string;
  role: string;
  position: string;
  warehouse: string[];
  wechatId: string;
  linkedPerson: string;
  createTime: string;
}

export interface FilterParams {
  keyword: string;
  clientName: string;
  warehouseCode: string;
  zipCode: string;
  merchandiser: string;
  label: string;
  waybillNo: string;
  invoiceMade: string;
  destination: string;
  unlabelled: string;
  taxPayment: string;
  operator: string;
  trackingNo: string;
  declarationType: string;
  tradeMode: string[];
  clientRemark: string;
  warehouseAttr: string;
  createTimeStart: string;
  createTimeEnd: string;
  pickTimeStart: string;
  pickTimeEnd: string;
  fbaNo: string;
  channel: string;
  internalRemark: string;
  outTimeStart: string;
  outTimeEnd: string;
  pickWarehouse: string;
  salesman: string;
  customerService: string;
  waybillType: string;
  hasInsurance: string;
  hasDocs: string;
  customsRoom: string;
  productName: string;
}
