import type { InstructionListRow as Row } from './instructionListTypes';
import { readPickupInstructions } from './pickupInstructionStore';
import { withInstructionInventoryLink } from './instructionInventoryLinks';
// Local fixtures mirror the two reference screenshots and keep the static GitHub Pages build usable without an API.
const rawRows: Row[] = [
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
  { id: '11', tab: '待确认', waybill: 'USSZ202608120002', instructionNo: 'CI202608151005320118', names: ['贴标'], created: '2026-08-15 10:05:32', updated: '2026-08-15 10:20:01', shipment: 'FBA1CONF16CK', reference: '-', status: '已处理', photo: '贴标', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '12', packages: '2', weight: '20', volume: '0.0480', arrived: '是', overseasTime: '2026-08-15 09:58:10' },
  { id: '12', tab: '已下单', waybill: 'USSZ202608110001', instructionNo: 'CI202608141024190021', names: ['换单'], created: '2026-08-14 10:24:19', updated: '2026-08-14 10:40:18', shipment: 'FBA1ORDER16CK', reference: '-', status: '已处理', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '20', packages: '1', weight: '12', volume: '0.0250', arrived: '是', overseasTime: '2026-08-14 10:20:03' },

  // Previously confirmed examples return to pending in the simplified workflow.
  { id: '15', tab: '待确认', waybill: 'USSZ202608120003', instructionNo: 'CI202608151130450102', names: ['贴标', '换单'], created: '2026-08-15 11:30:45', updated: '2026-08-15 11:45:20', shipment: 'FBA1CONF16CK02', reference: '-', status: '已处理', photo: '贴标', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '18', packages: '3', weight: '26', volume: '0.0720', arrived: '是', overseasTime: '2026-08-15 11:22:08' },
  { id: '16', tab: '待确认', waybill: 'USSZ202608120004', instructionNo: 'CI202608151402338719', names: ['换单'], created: '2026-08-15 14:02:33', updated: '2026-08-15 14:20:11', shipment: 'FBA1CONF16CK03', reference: '-', status: '已处理', photo: '换单', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW006', salesman: '公司', merchandiser: '天惠', fee: '20', packages: '2', weight: '18', volume: '0.0420', arrived: '是', overseasTime: '2026-08-15 13:50:44' },
  { id: '17', tab: '待确认', waybill: 'USSZ202608120005', instructionNo: 'CI202608160910156642', names: ['拍照4', '拍照5'], created: '2026-08-16 09:10:15', updated: '2026-08-16 09:35:02', shipment: 'FBA1CONF16CK04', reference: 'REF-CONF-0005', status: '已处理', photo: '拍照4', customer: '福奈测试客户', warehouse: 'ABE3', zip: '18031-1536', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '管理员', merchandiser: '天顺', fee: '96', packages: '4', weight: '52', volume: '0.1240', arrived: '是', overseasTime: '2026-08-16 08:55:30' },
  { id: '18', tab: '已完成', waybill: 'USSZ202608120006', instructionNo: 'CI202608161120337788', names: ['拦截-退回仓库'], created: '2026-08-16 11:20:33', updated: '2026-08-16 11:52:41', shipment: '-', reference: '-', status: '已处理', processingResult: '拦截失败', failureReason: '货物已完成出库，无法拦截', customer: '郑志强', warehouse: '-', zip: '-', orderType: '-', instructionType: '拦截', destination: 'MW006', salesman: '公司', merchandiser: '天惠', fee: '8', packages: '2', weight: '28', volume: '0.0640', arrived: '是', overseasTime: '2026-08-16 11:05:19' },

  // --- 已下单 ---
  { id: '19', tab: '已下单', waybill: 'USSZ202608110002', instructionNo: 'CI202608141210336655', names: ['换单'], created: '2026-08-14 12:10:33', updated: '2026-08-14 12:30:55', shipment: 'FBA1ORDER16CK02', reference: '-', status: '已处理', photo: '换单', customer: '郑志强', warehouse: 'RDU4', zip: '28303', orderType: '沃尔玛', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '20', packages: '1', weight: '12', volume: '0.0250', arrived: '是', overseasTime: '2026-08-14 12:02:19' },
  { id: '20', tab: '已下单', waybill: 'USSZ202608110003', instructionNo: 'CI202608141530276612', names: ['贴标', '拍照5'], created: '2026-08-14 15:30:27', updated: '2026-08-14 15:52:44', shipment: 'FBA1ORDER16CK03', reference: '-', status: '已处理', photo: '贴标', customer: '深圳天图', warehouse: 'FTW1', zip: '75241-7203', orderType: '亚马逊', instructionType: '放货', destination: 'MW003', salesman: '公司', merchandiser: '天惠', fee: '30', packages: '2', weight: '22', volume: '0.0560', arrived: '是', overseasTime: '2026-08-14 15:20:03' },
  { id: '21', tab: '已下单', waybill: 'USSZ202608110004', instructionNo: 'CI202608150945128803', names: ['不放货'], created: '2026-08-15 09:45:12', updated: '2026-08-15 10:05:38', shipment: '-', reference: '-', status: '已处理', customer: '福奈测试客户', warehouse: '-', zip: '-', orderType: '-', instructionType: '不放货', destination: 'MW003', salesman: '管理员', merchandiser: '天顺', fee: '48', packages: '1', weight: '15', volume: '0.0358', arrived: '是', overseasTime: '2026-08-15 09:30:41' },
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

// 仅“放货”需要在创建页填写收件地址；其它指令类型不产生地址/货件标识字段。
export const instructionSeedRows: Row[] = rawRows.map((row) => {
  const linked = withInstructionInventoryLink(row);
  if (row.instructionType === '放货') return linked;
  return {
    ...linked,
    shipment: '-',
    reference: '-',
    warehouse: '-',
    zip: '-',
    orderType: '-',
  };
});

export const pickupRows = (): Row[] => readPickupInstructions().map((pickup) => ({
  id: pickup.id,
  tab: '待确认',
  waybill: pickup.waybill,
  instructionNo: pickup.instructionNo,
  palletLabel: pickup.palletLabel,
  names: ['自提'],
  created: pickup.createdAt,
  updated: pickup.createdAt,
  shipment: '-',
  reference: '-',
  status: '待处理',
  customer: pickup.customer,
  warehouse: '-',
  zip: '-',
  orderType: '-',
  instructionType: '自提',
  expectedPickupTime: pickup.expectedPickupTime.replace('T', ' '),
  pickupContact: pickup.pickupContact,
  pickupPhone: pickup.pickupPhone,
  destination: '-',
  salesman: '-',
  merchandiser: '-',
  fee: '-',
  packages: String(pickup.boxes),
  weight: '-',
  volume: '-',
  arrived: '是',
  overseasTime: '-',
}));
