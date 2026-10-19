export type StagingStatus = '暂存' | '待出库' | '已出库';

export interface StagingRecord {
  id: string;
  clientName: string;
  containerNo: string;
  systemContainerNo: string;
  inboundNo: string;
  intercepted: boolean;
  transferMode: string;
  destination: string;
  deliveryMethod: string;
  palletLabel: string;
  inboundTime: string;
  weight: number;
  volume: number;
  boxCount: number;
  pendingBoxes: number;
  unshippedBoxes: number;
  shippedBoxes: number;
  location: string;
  status: StagingStatus;
}

export interface StagingFilters {
  keyword: string;
  clientName: string;
  inboundNos: string;
  transferMode: string;
  containerNo: string;
  systemContainerNo: string;
  destination: string;
  deliveryMethod: string;
  intercepted: string;
  inboundFrom: string;
  inboundTo: string;
}

export interface StagingLog {
  id: string;
  recordId: string;
  timestamp: string;
  operator: string;
  action: string;
  detail: string;
}

export const EMPTY_STAGING_FILTERS: StagingFilters = {
  keyword: '',
  clientName: '',
  inboundNos: '',
  transferMode: '',
  containerNo: '',
  systemContainerNo: '',
  destination: '',
  deliveryMethod: '',
  intercepted: '',
  inboundFrom: '',
  inboundTo: '',
};

type StagingSeed = Pick<StagingRecord, 'id' | 'containerNo' | 'inboundNo' | 'destination' | 'palletLabel' | 'inboundTime' | 'weight' | 'volume' | 'boxCount' | 'pendingBoxes' | 'unshippedBoxes' | 'shippedBoxes'> & Partial<StagingRecord>;

// Local sample records transcribed from the reference, plus five workflow examples.
// The three box columns are mutually exclusive and always add up to boxCount.
const seeds: StagingSeed[] = [
  { id: 'STG-001', containerNo: 'TEST0280745', inboundNo: 'USSZ202609050004', destination: 'ABE4', palletLabel: 'TEST0280745-260912-USSZ202609050004-ABE4-4-4', inboundTime: '2026-09-05 16:48:29', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 2, unshippedBoxes: 0, shippedBoxes: 0 },
  { id: 'STG-002', containerNo: 'TEST0280745', inboundNo: 'USSZ202609050004', destination: 'ABE4', palletLabel: 'TEST0280745-260912-USSZ202609050004-ABE4-4-2', inboundTime: '2026-09-05 16:48:29', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 1, unshippedBoxes: 0, shippedBoxes: 1 },
  { id: 'STG-003', containerNo: 'TTTX2609105', inboundNo: 'USSZ202609100006', destination: 'ABE4', palletLabel: 'TTTX2609105-260912-ABE4-1', inboundTime: '2026-09-10 17:55:03', weight: 480, volume: 0.432, boxCount: 12, pendingBoxes: 6, unshippedBoxes: 0, shippedBoxes: 6 },
  { id: 'STG-004', clientName: 'FA102', containerNo: 'TTTY2609191', systemContainerNo: 'TTTY2609191-260908', inboundNo: '001', destination: 'BWI9', palletLabel: 'TTTY2609191-260908-BWI9-1', inboundTime: '2026-09-19 11:41:49', weight: 9, volume: 13.5, boxCount: 3, pendingBoxes: 0, unshippedBoxes: 2, shippedBoxes: 1 },
  { id: 'STG-005', containerNo: 'TEST0280753', inboundNo: 'USSZ202609100001', destination: 'ABE4,650 Boulder Drive', deliveryMethod: 'Truck-Other', palletLabel: 'TEST0280753-260912-USSZ202609100001-2', inboundTime: '2026-09-10 11:07:30', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 1, unshippedBoxes: 0, shippedBoxes: 1 },
  { id: 'STG-006', containerNo: 'TEST0280753', inboundNo: 'USSZ202609100001', destination: 'ABE4,650 Boulder Drive', deliveryMethod: 'Truck-Other', palletLabel: 'TEST0280753-260912-USSZ202609100001-3', inboundTime: '2026-09-10 11:07:30', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 2, unshippedBoxes: 0, shippedBoxes: 0 },
  { id: 'STG-007', containerNo: 'TEST0280753', inboundNo: 'USSZ202609100001', destination: 'ABE4,650 Boulder Drive', deliveryMethod: 'Truck-Other', palletLabel: 'TEST0280753-260912-USSZ202609100001-4', inboundTime: '2026-09-10 11:07:30', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 1, unshippedBoxes: 1, shippedBoxes: 0 },
  { id: 'STG-008', containerNo: 'TEST0280750', inboundNo: 'USSZ202609070007', intercepted: false, destination: '650 Boulder Drive', deliveryMethod: 'Storage', palletLabel: 'TEST0280750-260912-USSZ202609070007-1', inboundTime: '2026-09-07 19:27:38', weight: 40, volume: 0.036, boxCount: 1, pendingBoxes: 1, unshippedBoxes: 0, shippedBoxes: 0 },
  { id: 'STG-009', containerNo: 'TEST0280753', inboundNo: 'USSZ202609100001', destination: 'ABE4,650 Boulder Drive', deliveryMethod: 'Truck-Other', palletLabel: 'TEST0280753-260912-USSZ202609100001-5', inboundTime: '2026-09-10 11:07:30', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 1, unshippedBoxes: 0, shippedBoxes: 1 },
  { id: 'STG-010', containerNo: 'TEST0280753', inboundNo: 'USSZ202609100001', destination: 'ABE4,650 Boulder Drive', deliveryMethod: 'Truck-Other', palletLabel: 'TEST0280753-260912-USSZ202609100001-1', inboundTime: '2026-09-10 11:07:30', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 2, unshippedBoxes: 0, shippedBoxes: 0 },
  { id: 'STG-011', containerNo: 'TEST0280752', inboundNo: 'USSZ202609070010', destination: 'ABE4', palletLabel: 'TEST0280752-260912-USSZ202609070010-ABE4-10', inboundTime: '2026-09-07 21:27:00', weight: 40, volume: 0.036, boxCount: 1, pendingBoxes: 1, unshippedBoxes: 0, shippedBoxes: 0 },
  { id: 'STG-012', containerNo: 'TEST0280752', inboundNo: 'USSZ202609070010', destination: 'ABE4', palletLabel: 'TEST0280752-260912-USSZ202609070010-ABE4-8', inboundTime: '2026-09-07 21:27:00', weight: 40, volume: 0.036, boxCount: 1, pendingBoxes: 1, unshippedBoxes: 0, shippedBoxes: 0 },
  { id: 'STG-013', containerNo: 'TEST0280751', inboundNo: 'USSZ202609070009', destination: 'ABE4', palletLabel: 'TEST0280751-260912-USSZ202609070009-ABE4-11', inboundTime: '2026-09-07 20:06:38', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 1, unshippedBoxes: 1, shippedBoxes: 0 },
  { id: 'STG-014', containerNo: 'TEST0280760', inboundNo: 'USSZ202609150001', intercepted: false, destination: 'ONT8', palletLabel: 'TEST0280760-260912-USSZ202609150001-ONT8-1', inboundTime: '2026-09-15 09:20:00', weight: 160, volume: 0.144, boxCount: 4, pendingBoxes: 0, unshippedBoxes: 4, shippedBoxes: 0, status: '待出库' },
  { id: 'STG-015', clientName: 'FA102', containerNo: 'TEST0280761', inboundNo: 'USSZ202609160002', intercepted: false, destination: 'LAX9', palletLabel: 'TEST0280761-260912-USSZ202609160002-LAX9-1', inboundTime: '2026-09-16 14:35:00', weight: 120, volume: 0.108, boxCount: 3, pendingBoxes: 0, unshippedBoxes: 3, shippedBoxes: 0, status: '待出库' },
  { id: 'STG-016', containerNo: 'TEST0280760', inboundNo: 'USSZ202609150001', intercepted: false, destination: 'ONT8', palletLabel: 'TEST0280760-260912-USSZ202609150001-ONT8-2', inboundTime: '2026-09-15 09:20:00', weight: 80, volume: 0.072, boxCount: 2, pendingBoxes: 0, unshippedBoxes: 2, shippedBoxes: 0, status: '待出库' },
  { id: 'STG-017', containerNo: 'TEST0280738', inboundNo: 'USSZ202609010003', intercepted: false, destination: 'ABE4', palletLabel: 'TEST0280738-260912-USSZ202609010003-ABE4-1', inboundTime: '2026-09-01 10:15:00', weight: 200, volume: 0.18, boxCount: 5, pendingBoxes: 0, unshippedBoxes: 0, shippedBoxes: 5, status: '已出库' },
  { id: 'STG-018', clientName: 'FA102', containerNo: 'TEST0280740', inboundNo: 'USSZ202609020005', intercepted: false, destination: 'BWI9', palletLabel: 'TEST0280740-260912-USSZ202609020005-BWI9-1', inboundTime: '2026-09-02 15:45:00', weight: 120, volume: 0.108, boxCount: 3, pendingBoxes: 0, unshippedBoxes: 0, shippedBoxes: 3, status: '已出库' },
];

export const INITIAL_STAGING_RECORDS: StagingRecord[] = seeds.map((seed, index) => ({
  clientName: 'TTTX',
  systemContainerNo: `${seed.containerNo}-260912`,
  intercepted: true,
  transferMode: '拆转',
  deliveryMethod: 'Truck-Amazon',
  location: `${index < 10 ? 'A' : 'B'}-${String(Math.floor(index / 4) + 1).padStart(2, '0')}-${String(index % 4 + 1).padStart(2, '0')}`,
  status: '暂存',
  ...seed,
}));

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function unrestricted(value: string): boolean {
  return !normalize(value) || value.trim() === '全部';
}

export function filterStagingRecords(records: StagingRecord[], filters: StagingFilters): StagingRecord[] {
  const keyword = normalize(filters.keyword);
  const inboundNos = new Set(filters.inboundNos.split(/[;,；，\r\n]+/).map(normalize).filter(Boolean));
  const includes = (actual: string, expected: string) => !normalize(expected) || normalize(actual).includes(normalize(expected));
  const equals = (actual: string, expected: string) => unrestricted(expected) || normalize(actual) === normalize(expected);
  const interception = normalize(filters.intercepted);
  const interceptValue = ['true', '拦截', '是'].includes(interception) ? true : ['false', '未拦截', '否'].includes(interception) ? false : null;

  return records.filter(row => {
    const inboundDate = row.inboundTime.slice(0, 10);
    return (
      (!keyword || [row.containerNo, row.systemContainerNo, row.inboundNo, row.palletLabel, row.clientName, row.destination].some(value => normalize(value) === keyword)) &&
      equals(row.clientName, filters.clientName) &&
      (!inboundNos.size || inboundNos.has(normalize(row.inboundNo))) &&
      equals(row.transferMode, filters.transferMode) &&
      includes(row.containerNo, filters.containerNo) &&
      includes(row.systemContainerNo, filters.systemContainerNo) &&
      includes(row.destination, filters.destination) &&
      equals(row.deliveryMethod, filters.deliveryMethod) &&
      (interceptValue === null || row.intercepted === interceptValue) &&
      (!filters.inboundFrom || inboundDate >= filters.inboundFrom) &&
      (!filters.inboundTo || inboundDate <= filters.inboundTo)
    );
  });
}

export function summarizeStagingRecords(records: StagingRecord[]): { pallets: number; boxes: number; containers: number; weight: number; volume: number } {
  return {
    pallets: new Set(records.map(row => row.palletLabel.trim()).filter(Boolean)).size,
    boxes: records.reduce((total, row) => total + row.boxCount, 0),
    containers: new Set(records.map(row => row.systemContainerNo.trim()).filter(Boolean)).size,
    weight: Math.round(records.reduce((total, row) => total + row.weight, 0) * 1000) / 1000,
    volume: Math.round(records.reduce((total, row) => total + row.volume, 0) * 1000000) / 1000000,
  };
}

const csvFields: [keyof StagingRecord, string][] = [
  ['id', '记录ID'],
  ['clientName', '客户名称'],
  ['containerNo', '柜号'],
  ['systemContainerNo', '系统柜号'],
  ['inboundNo', '入仓号'],
  ['intercepted', '是否拦截'],
  ['transferMode', '转运方式'],
  ['destination', '目的地'],
  ['deliveryMethod', '派送方式'],
  ['palletLabel', '托盘标签'],
  ['inboundTime', '入库时间'],
  ['weight', '重量（kg）'],
  ['volume', '体积（m³）'],
  ['boxCount', '总箱数'],
  ['pendingBoxes', '待审核箱数'],
  ['unshippedBoxes', '未发货箱数'],
  ['shippedBoxes', '已发货箱数'],
  ['location', '库位'],
  ['status', '状态'],
];

function csvCell(value: string | number | boolean): string {
  let text = typeof value === 'boolean' ? (value ? '拦截' : '未拦截') : String(value);
  // Quoting alone does not prevent spreadsheets from executing formula-shaped text.
  if (typeof value === 'string' && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Return UTF-8 BOM CSV with CRLF rows, suitable for an Excel-compatible download. */
export function exportStagingCsv(records: StagingRecord[]): string {
  const header = csvFields.map(([, label]) => csvCell(label)).join(',');
  const body = records.map(row => csvFields.map(([field]) => csvCell(row[field])).join(','));
  return `\uFEFF${[header, ...body].join('\r\n')}\r\n`;
}
