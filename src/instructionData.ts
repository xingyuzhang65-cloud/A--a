export type InstructionStatus = '启用' | '停用';
export type InstructionBusinessAttribute = '操作指令' | '纯费用';

export interface InstructionBusinessConfiguration {
  businessAttribute: InstructionBusinessAttribute;
  requiresPda: boolean;
}

/** Legacy rows keep their operational behavior; fee type never determines routing. */
export function normalizeInstructionBusiness<T extends object>(row: T): Omit<T, keyof InstructionBusinessConfiguration> & InstructionBusinessConfiguration {
  const config = row as { businessAttribute?: unknown; requiresPda?: unknown };
  const businessAttribute = config.businessAttribute === '纯费用' ? '纯费用' : '操作指令';
  return { ...row, businessAttribute, requiresPda: businessAttribute === '操作指令' && (typeof config.requiresPda === 'boolean' ? config.requiresPda : true) };
}

export interface Instruction extends InstructionBusinessConfiguration {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  price: number;
  cost: number;
  currency: string;
  status: InstructionStatus;
  description: string;
}

export interface InstructionLog {
  id: string;
  instructionId: string;
  timestamp: string;
  operator: string;
  changes: { field: string; before: string; after: string }[];
}

export interface InstructionFilters {
  code: string;
  type: string;
  status: string;
  businessAttribute?: InstructionBusinessAttribute | '';
  requiresPda?: '' | 'true' | 'false';
}

type InstructionSeed = [code: string, name: string, type: string, unit: string, cost: number, description: string];

const seeds: InstructionSeed[] = [
  ['FY20261010209', '开箱费（仅开箱）', '开箱费', '箱', 0.8, '客户要求开箱的开箱费用'],
  ['FY20260904070', '重新包装费-多个产品', '重新包装费', '个', 0.4, '单箱多个产品，按每个产品计费'],
  ['FY20260904068', '出/入仓费', '出/入仓费', 'Per Pallet', 10.5, '货物入仓上架存储和出仓，按板收费'],
  ['FY20260904067', '销毁费-按板', '销毁费', '托', 50, '整板弃货处理费（普货）'],
  ['FY20260904066', '销毁费-按箱', '销毁费', '箱', 5, '单箱/包裹/产品'],
  ['FY20260831025', '拍视频', '拍视频费', '条', 3, '拍视频，按一条3美金计费'],
  ['FY20260831023', '验货费-产品', '验货费', 'PCS', 2, '检查产品是否破损或有瑕疵'],
  ['FY20260831022', '验货费-外包装', '验货费', '箱', 1, '检查外包装是否破损'],
  ['FY20260826029', 'YQN自提费-并板', 'YQN自提费', '托', 14, '并板$14/托'],
  ['FY20260821001', '拦截费-拆转柜', '拦截费', '票', 50, '未拆柜前拦截及拆柜后拦截'],
  ['FY20260820028', '重新打板费-按托', '重新打板费', '托', 12, '≥12箱以上，针对有需求拆打板操作时'],
  ['FY20260820027', '重新打板费-按箱', '重新打板费', '箱', 1, '≤11箱'],
  ['FY20260820024', '拍照费', '拍照费', '张', 1, '拍照，按张计费'],
  ['FY20260820020', '破损修复费', '破损修复费', 'Pre Box', 1, '破损箱重新包装（仅胶带缠绕）'],
  ['FY20260820019', '换箱费', '换箱费', '箱', 10, '包括操作换箱费与标准纸箱费'],
  ['FY20260820016', '分拣费-按SKU', '分拣费', 'SKU', 1, '需要扣货或者挑出特定货物时产生'],
  ['FY20260820015', '分拣费-按箱', '分拣费', '箱', 1, '需要扣货或者挑出特定货物时产生'],
  ['FY20260820013', '自提费', '自提费', 'Per Pallet', 10, '客户自提的出库费用'],
  ['FY20260820012', '加急费-拆柜', '加急费', '柜', 200, '指令加急'],
  ['FY20260820011', '加急费-提柜', '加急费', '柜', 300, '指令加急'],
];

export const INITIAL_INSTRUCTIONS: Instruction[] = seeds.map(([code, name, type, unit, cost, description]) => ({
  id: code,
  code,
  name,
  type,
  businessAttribute: '操作指令',
  requiresPda: true,
  unit,
  price: 0,
  cost,
  currency: 'USD',
  status: '启用',
  description,
}));

export function filterInstructions(rows: Instruction[], filters: InstructionFilters): Instruction[] {
  const code = filters.code.trim().toLowerCase();
  return rows.map(normalizeInstructionBusiness).filter(row => (
    (!code || row.code.toLowerCase().includes(code)) &&
    (!filters.type || filters.type === '全部' || row.type === filters.type) &&
    (!filters.status || filters.status === '全部' || row.status === filters.status) &&
    (!filters.businessAttribute || row.businessAttribute === filters.businessAttribute) &&
    (!filters.requiresPda || String(row.requiresPda) === filters.requiresPda)
  ));
}

const fieldLabels: [keyof Instruction, string][] = [
  ['id', '费用ID'],
  ['code', '费用代码'],
  ['name', '费用名称'],
  ['type', '费用类型'],
  ['businessAttribute', '业务属性'],
  ['requiresPda', '是否需要PDA操作'],
  ['unit', '计费单位'],
  ['price', '计费单价（元）'],
  ['cost', '成本单价（元）'],
  ['currency', '币种'],
  ['status', '状态'],
  ['description', '描述'],
];

function displayValue(field: keyof Instruction, value: string | number | boolean): string {
  if (field === 'requiresPda') return value ? '需要' : '不需要';
  if (field === 'currency') {
    const currencyLabels: Record<string, string> = { USD: '美元', CNY: '人民币', EUR: '欧元', GBP: '英镑', HKD: '港币' };
    return currencyLabels[String(value)] ?? String(value);
  }
  return String(value);
}

function csvCell(value: string | number): string {
  let text = String(value);
  // Spreadsheet applications can execute formula-shaped text even in quoted CSV cells.
  // Keep numeric values numeric, but force untrusted formula-shaped strings to text.
  if (typeof value === 'string' && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

/** Return a BOM-prefixed CSV string ready for a UTF-8 Blob/download. */
export function exportInstructionsCsv(rows: Instruction[]): string {
  const header = fieldLabels.map(([, label]) => csvCell(label)).join(',');
  const body = rows.map(normalizeInstructionBusiness).map(row => fieldLabels.map(([field]) => {
    const value = row[field];
    return csvCell(typeof value === 'number' ? value : displayValue(field, value));
  }).join(','));
  return `\uFEFF${[header, ...body].join('\r\n')}\r\n`;
}

export function createInstructionChanges(before: Instruction, after: Instruction): InstructionLog['changes'] {
  before = normalizeInstructionBusiness(before);
  after = normalizeInstructionBusiness(after);
  return fieldLabels.flatMap(([field, label]) => before[field] === after[field] ? [] : [{
    field: label,
    before: displayValue(field, before[field]),
    after: displayValue(field, after[field]),
  }]);
}
