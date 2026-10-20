export type InstructionListTab = '待确认' | '已确认' | '已推送海外仓' | '处理中' | '已完成' | '驳回' | '取消' | '全部';

export interface InstructionListRecord {
  id: string;
  tab: Exclude<InstructionListTab, '全部'>;
  waybill: string;
  instructionNo: string;
  names: string[];
  created: string;
  updated: string;
  shipment: string;
  reference: string;
  status: string;
  processingResult: string;
  failureReason: string;
  photo: string;
  customer: string;
  warehouse: string;
  zip: string;
  orderType: string;
  instructionType: string;
  interceptReason: string;
  destination: string;
  salesman: string;
  merchandiser: string;
  fee: number;
  currency: string;
  packages: number;
  customerRemark: string;
  weight: number;
  volume: number;
  arrived: '是' | '否';
  overseasTime: string;
  expectedPickupTime: string;
  pickupContact: string;
  pickupPhone: string;
  remark: string;
  palletLabel: string;
  sourceOrderId: string;
  sourceRecordId: string;
}

export interface InstructionListFilters {
  instructionNo: string;
  waybill: string;
  shipment: string;
  reference: string;
  customer: string;
  salesman: string;
  merchandiser: string;
  warehouse: string;
  orderType: string;
  instructionType: string;
  arrived: string;
  dateFrom: string;
  dateTo: string;
}

export interface InstructionListLog {
  id: string;
  recordId: string;
  instructionNo: string;
  timestamp: string;
  operator: string;
  action: string;
  before: string;
  after: string;
  detail: string;
}

export interface InstructionListState {
  records: InstructionListRecord[];
  logs: InstructionListLog[];
}

export const INSTRUCTION_LIST_STORAGE_KEY = 'ans_instruction_list_v1';
export const INSTRUCTION_LIST_TABS: InstructionListTab[] = ['待确认', '已确认', '已推送海外仓', '处理中', '已完成', '驳回', '取消', '全部'];
export const EMPTY_INSTRUCTION_LIST_FILTERS: InstructionListFilters = {
  instructionNo: '', waybill: '', shipment: '', reference: '', customer: '', salesman: '', merchandiser: '',
  warehouse: '', orderType: '', instructionType: '', arrived: '', dateFrom: '', dateTo: '',
};

type OptionalSeedKey = 'currency' | 'processingResult' | 'failureReason' | 'photo' | 'interceptReason' | 'expectedPickupTime' | 'pickupContact' | 'pickupPhone' | 'customerRemark' | 'remark' | 'palletLabel' | 'sourceOrderId' | 'sourceRecordId';
type InstructionListSeed = Omit<InstructionListRecord, OptionalSeedKey | 'fee' | 'packages' | 'weight' | 'volume'> &
  Partial<Pick<InstructionListRecord, OptionalSeedKey>> & { fee: string; packages: string; weight: string; volume: string };

// Business fixtures mirror the instruction-list reference; no UI from that system is reused.
const referenceSeeds: InstructionListSeed[] = [
  { id: '1', tab: '待确认', waybill: 'USSZ202608160010', instructionNo: 'CI20260816212041676418', names: ['拍照5', '拍照4', '换单2'], created: '2026-08-16 21:20:41', updated: '2026-08-16 21:23:46', shipment: 'FBA19KBC16CK', reference: '-', status: '已处理', photo: '拍照5', customer: '郑志强', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '144', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 21:19:38' },
  { id: '2', tab: '待确认', waybill: 'USSZ202608160007', instructionNo: 'CI20260816204724154817', names: ['拍照4'], created: '2026-08-16 20:47:24', updated: '2026-08-17 12:14:31', shipment: 'FBA19ACB16CK', reference: '-', status: '待处理', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '不放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 18:49:46' },
  { id: '3', tab: '待确认', waybill: 'USSZ202608160008', instructionNo: 'CI20260816203326240194', names: ['拍照4'], created: '2026-08-16 20:33:26', updated: '2026-08-16 20:33:36', shipment: 'FBA19BBA16CK', reference: '-', status: '待处理', photo: '拍照4', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 20:24:17' },
  { id: '4', tab: '待确认', waybill: 'USSZ202608160008', instructionNo: 'CI20260816202855497409', names: ['拍照5'], created: '2026-08-16 20:28:56', updated: '2026-08-16 20:29:03', shipment: 'FBA19BBA16CK', reference: '-', status: '待处理', photo: '拍照5', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '不放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '56', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 20:24:17' },
  { id: '5', tab: '待确认', waybill: 'USSZ202608160008', instructionNo: 'CI20260816202623348225', names: ['拦截照片8.16'], created: '2026-08-16 20:26:23', updated: '2026-08-16 20:39:01', shipment: 'FBA19ABA16CK', reference: '-', status: '已处理', photo: '拦截照片8.16', customer: '郑志强', warehouse: 'AVP3', zip: '18424-9492', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '3.05', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 20:24:17' },
  { id: '6', tab: '待确认', waybill: 'USSZ202608160007', instructionNo: 'CI20260816193802324353', names: ['拦截照片8.16'], created: '2026-08-16 19:38:02', updated: '2026-08-16 19:38:12', shipment: 'FBA19ACB16CK', reference: '-', status: '待处理', customer: '郑志强', warehouse: 'ABE3', zip: '18031-1536', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '3', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 18:49:46' },
  { id: '7', tab: '待确认', waybill: 'USSZ202608160007', instructionNo: 'CI20260816195234275586', names: ['拦截照片8.16'], created: '2026-08-16 19:52:34', updated: '2026-08-16 19:52:43', shipment: 'FBA19ACB16CK', reference: '-', status: '待处理', customer: '郑志强', warehouse: 'ABE3', zip: '18031-1536', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '3', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 18:49:46' },
  { id: '8', tab: '待确认', waybill: 'USSZ202608160006', instructionNo: 'CI20260816184242053121', names: ['拦截照片8.16'], created: '2026-08-16 18:42:42', updated: '2026-08-16 19:39:40', shipment: 'FBA19AAB16CK', reference: '-', status: '已处理', photo: '拦截照片8.16', customer: '郑志强', warehouse: 'RDU2', zip: '27577', orderType: '沃尔玛', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '3', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 17:01:00' },
  { id: '9', tab: '待确认', waybill: 'USSZ202608160006', instructionNo: 'CI20260816184014763649', names: ['人工照片8.16'], created: '2026-08-16 18:41:04', updated: '2026-08-16 18:47:19', shipment: 'FBA19AAB16CK', reference: '-', status: '已处理', photo: '人工照片8.16', customer: '郑志强', warehouse: 'ABE3', zip: '18031-1536', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-16 17:01:00' },
  { id: '10', tab: '待确认', waybill: 'USSZ202608130006', instructionNo: 'CI202608161612771649', names: ['人工照片8.16'], created: '2026-08-16 16:16:12', updated: '2026-08-16 16:16:30', shipment: 'FBAFPXRWE32K', reference: 'ABCDEFG12345', status: '待处理', customer: '福奈测试客户', warehouse: 'ABE3', zip: '18031-1536', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '管理员', merchandiser: '天顺', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-13 16:18:01' },
  { id: '13', tab: '待确认', waybill: 'USSZ202608180013', instructionNo: 'CI20260818103028623540', names: ['拦截-退回仓库'], created: '2026-08-18 10:30:28', updated: '2026-08-18 10:31:12', shipment: 'FBA1INTERCEPT01', reference: 'INT-20260818-01', status: '待处理', customer: '郑志强', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '拦截', interceptReason: '客户取消订单，申请拦截并退回海外仓', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '2', weight: '28', volume: '0.0640', arrived: '是', overseasTime: '2026-08-18 10:15:06' },
  { id: '14', tab: '待确认', waybill: 'USSZ202608180014', instructionNo: 'CI20260818094516178205', names: ['销毁-整票销毁'], created: '2026-08-18 09:45:16', updated: '2026-08-18 09:48:36', shipment: 'FBA1DESTROY01', reference: 'DES-20260818-01', status: '待处理', customer: '福奈测试客户', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '销毁', destination: 'MW003', salesman: '管理员', merchandiser: '天顺', fee: '5', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-18 09:30:00' },
  { id: '11', tab: '已确认', waybill: 'USSZ202608120002', instructionNo: 'CI202608151005320118', names: ['贴标'], created: '2026-08-15 10:05:32', updated: '2026-08-15 10:20:01', shipment: 'FBA1CONF16CK', reference: '-', status: '已处理', photo: '贴标', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '12', packages: '2', weight: '20', volume: '0.0480', arrived: '是', overseasTime: '2026-08-15 09:58:10' },
  { id: '12', tab: '已推送海外仓', waybill: 'USSZ202608110001', instructionNo: 'CI202608141024190021', names: ['换单'], created: '2026-08-14 10:24:19', updated: '2026-08-14 10:40:18', shipment: 'FBA1ORDER16CK', reference: '-', status: '已处理', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '20', packages: '1', weight: '12', volume: '0.0250', arrived: '是', overseasTime: '2026-08-14 10:20:03' },

  // --- 已确认 ---
  { id: '15', tab: '已确认', waybill: 'USSZ202608120003', instructionNo: 'CI202608151130450102', names: ['贴标', '换单'], created: '2026-08-15 11:30:45', updated: '2026-08-15 11:45:20', shipment: 'FBA1CONF16CK02', reference: '-', status: '已处理', photo: '贴标', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '18', packages: '3', weight: '26', volume: '0.0720', arrived: '是', overseasTime: '2026-08-15 11:22:08' },
  { id: '16', tab: '已确认', waybill: 'USSZ202608120004', instructionNo: 'CI202608151402338719', names: ['换单'], created: '2026-08-15 14:02:33', updated: '2026-08-15 14:20:11', shipment: 'FBA1CONF16CK03', reference: '-', status: '已处理', photo: '换单', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW006', salesman: '公司', merchandiser: '天惠', fee: '20', packages: '2', weight: '18', volume: '0.0420', arrived: '是', overseasTime: '2026-08-15 13:50:44' },
  { id: '17', tab: '已确认', waybill: 'USSZ202608120005', instructionNo: 'CI202608160910156642', names: ['拍照4', '拍照5'], created: '2026-08-16 09:10:15', updated: '2026-08-16 09:35:02', shipment: 'FBA1CONF16CK04', reference: 'REF-CONF-0005', status: '已处理', photo: '拍照4', customer: '福奈测试客户', warehouse: 'ABE3', zip: '18031-1536', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '管理员', merchandiser: '天顺', fee: '96', packages: '4', weight: '52', volume: '0.1240', arrived: '是', overseasTime: '2026-08-16 08:55:30' },
  { id: '18', tab: '已完成', waybill: 'USSZ202608120006', instructionNo: 'CI202608161120337788', names: ['拦截-退回仓库'], created: '2026-08-16 11:20:33', updated: '2026-08-16 11:52:41', shipment: '-', reference: '-', status: '已处理', processingResult: '拦截失败', failureReason: '货物已完成出库，无法拦截', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW006', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '2', weight: '28', volume: '0.0640', arrived: '是', overseasTime: '2026-08-16 11:05:19' },

  // --- 已下单 ---
  { id: '19', tab: '已推送海外仓', waybill: 'USSZ202608110002', instructionNo: 'CI202608141210336655', names: ['换单'], created: '2026-08-14 12:10:33', updated: '2026-08-14 12:30:55', shipment: 'FBA1ORDER16CK02', reference: '-', status: '已处理', photo: '换单', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '20', packages: '1', weight: '12', volume: '0.0250', arrived: '是', overseasTime: '2026-08-14 12:02:19' },
  { id: '20', tab: '已推送海外仓', waybill: 'USSZ202608110003', instructionNo: 'CI202608141530276612', names: ['贴标', '拍照5'], created: '2026-08-14 15:30:27', updated: '2026-08-14 15:52:44', shipment: 'FBA1ORDER16CK03', reference: '-', status: '已处理', photo: '贴标', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '30', packages: '2', weight: '22', volume: '0.0560', arrived: '是', overseasTime: '2026-08-14 15:20:03' },
  { id: '21', tab: '已推送海外仓', waybill: 'USSZ202608110004', instructionNo: 'CI202608150945128803', names: ['不放货'], created: '2026-08-15 09:45:12', updated: '2026-08-15 10:05:38', shipment: '-', reference: '-', status: '已处理', customer: '福奈测试客户', warehouse: '-', zip: '-', orderType: '-', instructionType: '不放货', destination: 'MW003', salesman: '管理员', merchandiser: '天顺', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-15 09:30:41' },
  { id: '22', tab: '已完成', waybill: 'USSZ202608110005', instructionNo: 'CI202608151610447755', names: ['拦截-整票拦截'], created: '2026-08-15 16:10:44', updated: '2026-08-15 16:20:33', shipment: '-', reference: '-', status: '已处理', processingResult: '拦截成功', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW009', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '2', weight: '28', volume: '0.0640', arrived: '是', overseasTime: '2026-08-15 15:58:12' },

  // --- 转运中 ---
  { id: '23', tab: '处理中', waybill: 'USSZ202608090001', instructionNo: 'CI202608121045332201', names: ['发货'], created: '2026-08-12 10:45:33', updated: '2026-08-13 08:20:15', shipment: 'FBA1TRANS16CK1', reference: 'TR-20260812-01', status: '已处理', photo: '发货', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '150', packages: '5', weight: '68', volume: '0.1820', arrived: '是', overseasTime: '2026-08-12 10:30:22' },
  { id: '24', tab: '处理中', waybill: 'USSZ202608090002', instructionNo: 'CI202608121420556677', names: ['发货', '贴标'], created: '2026-08-12 14:20:55', updated: '2026-08-13 09:15:40', shipment: 'FBA1TRANS16CK2', reference: 'TR-20260812-02', status: '已处理', photo: '发货', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW006', salesman: '公司', merchandiser: '天惠', fee: '180', packages: '6', weight: '82', volume: '0.2160', arrived: '是', overseasTime: '2026-08-12 14:05:11' },
  { id: '25', tab: '处理中', waybill: 'USSZ202608090003', instructionNo: 'CI202608130910334488', names: ['发货'], created: '2026-08-13 09:10:33', updated: '2026-08-14 07:42:29', shipment: 'FBA1TRANS16CK3', reference: 'TR-20260813-01', status: '已处理', photo: '发货', customer: '福奈测试客户', warehouse: 'ABE3', zip: '18031-1536', orderType: '亚马逊', instructionType: '放货', destination: 'MW009', salesman: '管理员', merchandiser: '天顺', fee: '120', packages: '4', weight: '55', volume: '0.1430', arrived: '是', overseasTime: '2026-08-13 08:58:47' },
  // 拦截指令处理中：海外仓尚未回传拦截结果
  { id: '35', tab: '处理中', waybill: 'USSZ202608090004', instructionNo: 'CI202608131520117799', names: ['拦截-退回仓库'], created: '2026-08-13 15:20:11', updated: '2026-08-14 09:05:22', shipment: '-', reference: '-', status: '已处理', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '2', weight: '28', volume: '0.0640', arrived: '是', overseasTime: '2026-08-13 15:05:48' },

  // --- 签收 ---
  { id: '26', tab: '已完成', waybill: 'USSZ202608050001', instructionNo: 'CI202608080930112233', names: ['发货'], created: '2026-08-08 09:30:11', updated: '2026-08-11 16:05:33', shipment: 'FBA1SIGN16CK01', reference: 'SG-20260808-01', status: '已处理', photo: '发货', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '160', packages: '5', weight: '70', volume: '0.1860', arrived: '是', overseasTime: '2026-08-08 09:15:02' },
  { id: '27', tab: '已完成', waybill: 'USSZ202608050002', instructionNo: 'CI202608081510445566', names: ['换单'], created: '2026-08-08 15:10:44', updated: '2026-08-12 10:22:18', shipment: 'FBA1SIGN16CK02', reference: 'SG-20260808-02', status: '已处理', photo: '换单', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '24', packages: '2', weight: '24', volume: '0.0620', arrived: '是', overseasTime: '2026-08-08 14:55:30' },

  // --- 取消 ---
  { id: '28', tab: '取消', waybill: 'USSZ202608070001', instructionNo: 'CI202608101020304050', names: ['拦截-退回仓库'], created: '2026-08-10 10:20:30', updated: '2026-08-10 11:05:12', shipment: '-', reference: '-', status: '已取消', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '2', weight: '28', volume: '0.0640', arrived: '是', overseasTime: '2026-08-10 10:05:44' },
  { id: '29', tab: '取消', waybill: 'USSZ202608070002', instructionNo: 'CI202608101430556677', names: ['换单'], created: '2026-08-10 14:30:55', updated: '2026-08-10 15:12:08', shipment: '-', reference: '-', status: '已取消', customer: '福奈测试客户', warehouse: '-', zip: '-', orderType: '-', instructionType: '不放货', destination: 'MW003', salesman: '管理员', merchandiser: '天顺', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-10 14:18:20' },
  { id: '30', tab: '取消', waybill: 'USSZ202608070003', instructionNo: 'CI202608110910223344', names: ['销毁-整票销毁'], created: '2026-08-11 09:10:22', updated: '2026-08-11 09:40:50', shipment: '-', reference: '-', status: '已取消', customer: '深圳天图', warehouse: '-', zip: '-', orderType: '-', instructionType: '销毁', destination: 'MW006', salesman: '公司', merchandiser: '天惠', fee: '5', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-11 08:55:10' },
  { id: '31', tab: '取消', waybill: 'USSZ202608070004', instructionNo: 'CI202608111610556699', names: ['拍照5'], created: '2026-08-11 16:10:55', updated: '2026-08-11 16:48:03', shipment: '-', reference: '-', status: '已取消', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '不放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '56', packages: '1', weight: '15', volume: '0.0358', arrived: '否', overseasTime: '-' },

  // --- 已完成 · 拦截指令海外仓回传结果 ---
  { id: '36', tab: '已完成', waybill: 'USSZ202608040001', instructionNo: 'CI202608071015223344', names: ['拦截-整票拦截'], created: '2026-08-07 10:15:22', updated: '2026-08-07 14:38:09', shipment: '-', reference: '-', status: '已处理', processingResult: '拦截失败', failureReason: '货物已交接承运商，海外仓无法追回', customer: '福奈测试客户', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW006', salesman: '管理员', merchandiser: '天顺', fee: '8', packages: '3', weight: '42', volume: '0.0960', arrived: '是', overseasTime: '2026-08-07 09:58:31' },
  { id: '37', tab: '已完成', waybill: 'USSZ202608040002', instructionNo: 'CI202608071430551122', names: ['拦截-退回仓库'], created: '2026-08-07 14:30:55', updated: '2026-08-08 09:12:40', shipment: '-', reference: '-', status: '已处理', processingResult: '拦截成功', customer: '深圳天图', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW009', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '1', weight: '14', volume: '0.0320', arrived: '是', overseasTime: '2026-08-07 14:15:18' },

  // --- 驳回 ---
  { id: '32', tab: '驳回', waybill: 'USSZ202608060001', instructionNo: 'CI202608091030445511', names: ['拦截-退回仓库'], created: '2026-08-09 10:30:44', updated: '2026-08-09 15:20:18', shipment: '-', reference: '-', status: '已驳回', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '2', weight: '28', volume: '0.0640', arrived: '是', overseasTime: '2026-08-09 10:15:02' },
  { id: '33', tab: '驳回', waybill: 'USSZ202608060002', instructionNo: 'CI202608091425336622', names: ['不放货'], created: '2026-08-09 14:25:33', updated: '2026-08-10 09:12:47', shipment: '-', reference: '-', status: '已驳回', customer: '福奈测试客户', warehouse: '-', zip: '-', orderType: '-', instructionType: '不放货', destination: 'MW006', salesman: '管理员', merchandiser: '天顺', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-09 14:10:21' },
  { id: '34', tab: '驳回', waybill: 'USSZ202608060003', instructionNo: 'CI202608101615227733', names: ['销毁-整票销毁'], created: '2026-08-10 16:15:22', updated: '2026-08-11 11:38:05', shipment: '-', reference: '-', status: '已驳回', customer: '深圳天图', warehouse: '-', zip: '-', orderType: '-', instructionType: '销毁', destination: 'MW009', salesman: '公司', merchandiser: '天惠', fee: '5', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-10 16:02:39' },
];

export const INITIAL_INSTRUCTION_LIST_RECORDS: InstructionListRecord[] = referenceSeeds.map(seed => ({
  currency: 'CNY', processingResult: '', failureReason: '', photo: '', interceptReason: '', expectedPickupTime: '',
  pickupContact: '', pickupPhone: '', customerRemark: '', remark: '', palletLabel: '', sourceOrderId: '', sourceRecordId: '',
  ...seed,
  // Only release instructions in the reference have shipment/address fields.
  ...(seed.instructionType === '放货' ? {} : { shipment: '-', reference: '-', warehouse: '-', zip: '-', orderType: '-' }),
  names: [...seed.names], fee: Number(seed.fee), packages: Number(seed.packages), weight: Number(seed.weight), volume: Number(seed.volume),
}));

INITIAL_INSTRUCTION_LIST_RECORDS.push({
  ...INITIAL_INSTRUCTION_LIST_RECORDS[0],
  id: 'pickup-example', tab: '待确认', waybill: 'DEMO-PICKUP-001', instructionNo: 'CI-DEMO-PICKUP-001', names: ['客户自提（示例）'],
  created: '2026-10-16 09:00:00', updated: '2026-10-16 09:00:00', shipment: '', reference: '', status: '待处理', photo: '',
  customer: '自提示例客户', warehouse: '-', zip: '', orderType: '-', instructionType: '自提', destination: '海外仓',
  salesman: '公司', merchandiser: '天朗', fee: 0, packages: 2, weight: 28, volume: 0.064,
  overseasTime: '2026-10-15 16:00:00', expectedPickupTime: '2026-10-20 14:30:00', pickupContact: '示例联系人',
  pickupPhone: '待客户提供', remark: '本条为本地示例，用于展示自提指令详情。',
});

const normalize = (value: string): string => value.trim().toLocaleLowerCase();
const unrestricted = (value: string): boolean => !normalize(value) || value.trim() === '全部';

/** Batch tokens are OR within each field; separate fields and dates are AND. */
export function filterInstructionList(records: InstructionListRecord[], filters: InstructionListFilters, tab: InstructionListTab = '全部'): InstructionListRecord[] {
  const batchFields = ['instructionNo', 'waybill', 'shipment', 'reference'] as const;
  const batch = batchFields.map(field => ({ field, tokens: filters[field].split(/[\s,;，；]+/u).map(normalize).filter(Boolean) }));
  const textFields = ['customer', 'merchandiser', 'warehouse'] as const;
  const selectFields = ['salesman', 'orderType', 'instructionType', 'arrived'] as const;
  const from = filters.dateFrom.trim();
  const to = filters.dateTo.trim();
  return records.filter(row => {
    const date = row.overseasTime.slice(0, 10);
    return (tab === '全部' || row.tab === tab) &&
      batch.every(({ field, tokens }) => !tokens.length || tokens.some(token => normalize(row[field]).includes(token))) &&
      textFields.every(field => unrestricted(filters[field]) || normalize(row[field]).includes(normalize(filters[field]))) &&
      selectFields.every(field => unrestricted(filters[field]) || normalize(row[field]) === normalize(filters[field])) &&
      (!(from || to) || /^\d{4}-\d{2}-\d{2}$/.test(date)) && (!from || date >= from) && (!to || date <= to);
  });
}

export function displayInstructionStatus(row: InstructionListRecord): string {
  if (row.instructionType === '拦截') {
    if (row.tab === '已完成' && ['拦截成功', '拦截失败'].includes(row.processingResult)) return row.processingResult;
    if (!['取消', '驳回'].includes(row.tab) && (['已推送海外仓', '处理中', '已完成'].includes(row.tab) || row.status === '已处理')) return '待海外仓回传';
  }
  return row.status === '已处理' ? '已完成' : row.status;
}

export function getInstructionFailureReason(row: InstructionListRecord): string {
  return row.tab === '已完成' && row.instructionType === '拦截' && row.processingResult === '拦截失败' ? row.failureReason.trim() : '';
}

const csvFields: [keyof InstructionListRecord, string][] = [
  ['id', '记录ID'], ['tab', '指令阶段'], ['waybill', '运单号'], ['instructionNo', '指令单号'], ['names', '指令名称'],
  ['created', '创建时间'], ['updated', '修改时间'], ['shipment', 'Shipment ID'], ['reference', 'Reference ID'],
  ['status', '指令处理状态'], ['processingResult', '处理结果'], ['failureReason', '失败原因'], ['photo', '指令操作图片'],
  ['customer', '客户简称'], ['warehouse', '仓库代码'], ['zip', '邮编'], ['orderType', '下单类型'], ['instructionType', '指令单类型'],
  ['interceptReason', '拦截原因'], ['destination', '目的地'], ['salesman', '业务员'], ['merchandiser', '跟单员'],
  ['fee', '指令费用'], ['currency', '币种'], ['packages', '发货件数'], ['customerRemark', '客户备注'], ['weight', '重量（kg）'], ['volume', '方数（m³）'],
  ['arrived', '是否到达海外仓'], ['overseasTime', '入仓时间（海外仓）'], ['expectedPickupTime', '预计提货时间'],
  ['pickupContact', '提货联系人'], ['pickupPhone', '提货联系电话'], ['remark', '备注'], ['palletLabel', '托盘标签'],
  ['sourceOrderId', '来源作业订单ID'], ['sourceRecordId', '来源暂存记录ID'],
];

function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && (/^\s*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text))) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Preserve native currencies and all business fields; CSV values are never converted. */
export function exportInstructionListCsv(records: InstructionListRecord[]): string {
  const header = csvFields.map(([, label]) => csvCell(label)).join(',');
  const body = records.map(row => csvFields.map(([field]) => {
    const value = field === 'status' ? displayInstructionStatus(row) : field === 'failureReason' ? getInstructionFailureReason(row) : row[field];
    return csvCell(Array.isArray(value) ? value.join(' / ') : value);
  }).join(','));
  return `\uFEFF${[header, ...body].join('\r\n')}\r\n`;
}

type UnknownObject = Record<string, unknown>;
const isObject = (value: unknown): value is UnknownObject => !!value && typeof value === 'object' && !Array.isArray(value);
const numericKeys = ['fee', 'packages', 'weight', 'volume'] as const;
const recordStringKeys = csvFields.map(([field]) => field).filter(field => field !== 'names' && !numericKeys.includes(field as typeof numericKeys[number]));
const logStringKeys = ['id', 'recordId', 'instructionNo', 'timestamp', 'operator', 'action', 'before', 'after', 'detail'] as const;
const isNonnegativeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function validRecord(value: unknown): value is InstructionListRecord {
  return isObject(value) && recordStringKeys.every(key => typeof value[key] === 'string') &&
    typeof value.id === 'string' && !!value.id.trim() && value.tab !== '全部' && INSTRUCTION_LIST_TABS.includes(value.tab as InstructionListTab) &&
    (value.arrived === '是' || value.arrived === '否') && Array.isArray(value.names) && value.names.every(name => typeof name === 'string') &&
    numericKeys.every(key => isNonnegativeNumber(value[key]));
}

function validLog(value: unknown): value is InstructionListLog {
  return isObject(value) && logStringKeys.every(key => typeof value[key] === 'string') && !!value.id;
}

function validRecords(value: unknown): value is InstructionListRecord[] {
  return Array.isArray(value) && value.every(validRecord) && new Set(value.map(row => row.id)).size === value.length;
}

function readStored(storage: Pick<Storage, 'getItem'>, key: string): unknown {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}

function localTimestamp(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('指令时间无效');
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Multiplying the decimal representations avoids artifacts such as 0.1 * 0.2.
function decimalProduct(left: number, right: number): number {
  const parts = (value: number) => {
    const [base, exponent = '0'] = String(value).split(/[eE]/);
    return { coefficient: BigInt(base.replace('.', '')), power: Number(exponent) - (base.split('.')[1]?.length || 0) };
  };
  const a = parts(left); const b = parts(right);
  return Number(`${a.coefficient * b.coefficient}e${a.power + b.power}`);
}

function stagingInstruction(order: unknown, records: unknown[]): InstructionListRecord | null {
  if (!isObject(order) || !['id', 'recordId', 'instructionName', 'currency', 'createdAt'].every(key => typeof order[key] === 'string' && !!String(order[key]).trim()) ||
    !isNonnegativeNumber(order.quantity) || order.quantity === 0 || !isNonnegativeNumber(order.price)) return null;
  const source = records.find(record => isObject(record) && record.id === order.recordId);
  if (!isObject(source) || !['inboundNo', 'clientName', 'location', 'destination', 'palletLabel', 'inboundTime'].every(key => typeof source[key] === 'string') ||
    !['boxCount', 'weight', 'volume'].every(key => isNonnegativeNumber(source[key]))) return null;
  const fee = decimalProduct(order.quantity, order.price);
  if (!Number.isFinite(fee)) return null;
  let created: string;
  try { created = localTimestamp(String(order.createdAt)); } catch { return null; }
  return {
    id: `staging-${order.id}`, tab: '待确认', waybill: String(source.inboundNo), instructionNo: `CI-STG-${order.id}`,
    names: [String(order.instructionName)], created, updated: created, shipment: '', reference: '', status: '待处理',
    processingResult: '', failureReason: '', photo: '', customer: String(source.clientName), warehouse: '', zip: '',
    orderType: '', instructionType: '作业', interceptReason: '', destination: String(source.destination), salesman: '', merchandiser: '',
    fee, currency: String(order.currency), packages: Number(source.boxCount), weight: Number(source.weight), volume: Number(source.volume),
    arrived: source.inboundTime ? '是' : '否', overseasTime: String(source.inboundTime), expectedPickupTime: '', pickupContact: '', pickupPhone: '',
    customerRemark: typeof source.customerRemark === 'string' ? source.customerRemark : '',
    remark: typeof order.remark === 'string' ? order.remark : '', palletLabel: String(source.palletLabel), sourceOrderId: String(order.id), sourceRecordId: String(order.recordId),
  };
}

/** Merge new local staging orders by stable source ID; never replace or revive a saved instruction. */
export function loadInstructionListState(storage: Pick<Storage, 'getItem'> = globalThis.localStorage): InstructionListState {
  const saved = readStored(storage, INSTRUCTION_LIST_STORAGE_KEY);
  // This additive field must not invalidate earlier saved instructions or their workflow history.
  const savedRecords = isObject(saved) && Array.isArray(saved.records)
    ? saved.records.map(row => isObject(row) && !('customerRemark' in row) ? { ...row, customerRemark: '' } : row)
    : null;
  const state: InstructionListState = isObject(saved) && validRecords(savedRecords)
    ? { records: savedRecords, logs: Array.isArray(saved.logs) ? saved.logs.filter(validLog) : [] }
    : { records: INITIAL_INSTRUCTION_LIST_RECORDS.map(row => ({ ...row, names: [...row.names] })), logs: [] };
  const staging = readStored(storage, 'ans_staging_management_v1');
  if (!isObject(staging) || !Array.isArray(staging.records) || !Array.isArray(staging.orders)) return state;
  const knownIds = new Set(state.records.map(row => row.id));
  const knownSourceIds = new Set(state.records.map(row => row.sourceOrderId).filter(Boolean));
  const incoming: InstructionListRecord[] = [];
  const logs = [...state.logs];
  const knownLogIds = new Set(logs.map(log => log.id));
  for (const order of staging.orders) {
    if (isObject(order) && (knownIds.has(`staging-${order.id}`) || knownSourceIds.has(String(order.id)))) continue;
    const row = stagingInstruction(order, staging.records);
    if (!row) continue;
    incoming.push(row); knownIds.add(row.id); knownSourceIds.add(row.sourceOrderId);
    const logId = `staging-created-${row.sourceOrderId}`;
    if (!knownLogIds.has(logId) && isObject(order)) {
      // The source creates its log immediately after the order, without an order ID.
      // Match only its record, instruction name, and creation instant before using that operator.
      const sourceLog = Array.isArray(staging.logs) ? staging.logs.find(log => isObject(log) && log.recordId === row.sourceRecordId &&
        log.action === '创建指令' && typeof log.timestamp === 'string' && typeof log.detail === 'string' &&
        log.detail.includes(row.names[0]) && Math.abs(new Date(log.timestamp).getTime() - new Date(String(order.createdAt)).getTime()) < 1000) : null;
      logs.push({
        id: logId, recordId: row.id, instructionNo: row.instructionNo, timestamp: String(order.createdAt),
        operator: isObject(sourceLog) && typeof sourceLog.operator === 'string' ? sourceLog.operator : '天朗', action: '创建指令', before: '', after: '待确认',
        detail: `从暂存管理创建作业指令：${row.names[0]}；数量：${order.quantity}${typeof order.unit === 'string' ? ` ${order.unit}` : ''}；金额：${row.fee} ${row.currency}${row.remark ? `；备注：${row.remark}` : ''}`,
      });
      knownLogIds.add(logId);
    }
  }
  return { records: [...incoming, ...state.records], logs };
}

/** One serialized write keeps records and logs atomic. Storage failures propagate to the caller. */
export function persistInstructionListState(state: InstructionListState, storage: Pick<Storage, 'setItem'> = globalThis.localStorage): void {
  if (!isObject(state) || !validRecords(state.records) || !Array.isArray(state.logs) || !state.logs.every(validLog)) throw new TypeError('指令列表数据无效');
  storage.setItem(INSTRUCTION_LIST_STORAGE_KEY, JSON.stringify(state));
}

/** Staff notes are editable independently of the read-only customer note and workflow phase. */
export function updateInstructionRemark(state: InstructionListState, id: string, remark: string, timestamp = new Date().toISOString(), operator = '天朗'): InstructionListState {
  if (typeof id !== 'string' || !id.trim()) throw new TypeError('指令记录ID无效');
  if (typeof remark !== 'string') throw new TypeError('备注必须为文本');
  if (typeof timestamp !== 'string' || typeof operator !== 'string') throw new TypeError('备注操作信息无效');
  const row = state.records.find(record => record.id === id);
  if (!row) throw new RangeError('指令记录不存在');
  if (row.remark === remark) return state;
  const updated = localTimestamp(timestamp);
  const next: InstructionListRecord = { ...row, remark, updated };
  const log: InstructionListLog = {
    id: `${row.id}-remark-${new Date(timestamp).getTime()}-${state.logs.length + 1}`,
    recordId: row.id, instructionNo: row.instructionNo, timestamp: updated, operator,
    action: '修改备注', before: row.remark, after: remark, detail: `${row.instructionNo}：修改备注`,
  };
  return { records: state.records.map(record => record.id === id ? next : record), logs: [...state.logs, log] };
}

/** Approval and confirmation change workflow phase only; warehouse processing results are kept intact. */
export function transitionInstructionList(state: InstructionListState, ids: string[], action: 'approve' | 'confirm' | 'cancel', timestamp = new Date().toISOString(), operator = '天朗'): InstructionListState {
  if (action !== 'approve' && action !== 'confirm' && action !== 'cancel') throw new TypeError('不支持的指令操作');
  const selected = new Set(ids);
  const eligible = state.records.some(row => selected.has(row.id) && row.tab === '待确认');
  if (!eligible) return state;
  const updated = localTimestamp(timestamp);
  const logs: InstructionListLog[] = [];
  const records = state.records.map(row => {
    if (!selected.has(row.id) || row.tab !== '待确认') return row;
    const next: InstructionListRecord = { ...row, tab: action === 'cancel' ? '取消' : '已确认', status: action === 'cancel' ? '已取消' : row.status, updated };
    logs.push({
      id: `${row.id}-${action}-${new Date(timestamp).getTime()}`, recordId: row.id, instructionNo: row.instructionNo, timestamp: updated, operator,
      action: action === 'approve' ? '批量审批' : action === 'confirm' ? '确认下单' : '取消下单', before: `${row.tab} / ${row.status}`, after: `${next.tab} / ${next.status}`,
      detail: `${row.instructionNo}：${action === 'approve' ? '审批通过，已进入已确认，保留海外仓原处理状态' : action === 'confirm' ? '已确认，保留海外仓原处理状态' : '已取消待确认指令'}`,
    });
    return next;
  });
  return { records, logs: [...state.logs, ...logs] };
}
