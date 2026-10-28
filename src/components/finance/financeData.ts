import { loadListRows } from '../overseas/instructionListState';
import { instructionSeedRows, pickupRows } from '../overseas/instructionListSource';
import { loadInstructionDetail, getInstructionFeeTotal } from '../overseas/instructionDetailStore';
import type { InstructionListRow } from '../overseas/instructionListTypes';
import type { InstructionFeeRow } from '../overseas/instructionDetailData';

export type ApprovalStatus = '待审批' | '已通过' | '已驳回';
export interface FinanceLog { id: string; at: string; operator: string; action: string; note: string; total: number | null; revision: string }
export interface Approval { status: '已通过' | '已驳回' | '待审批'; revision: string; logs: FinanceLog[] }
export type ApprovalStore = Record<string, Approval>;
export interface FinanceRecord { row: InstructionListRow; fees: InstructionFeeRow[]; total: number | null; status: ApprovalStatus; revision: string; approval?: Approval; changed: boolean }
export const FINANCE_KEY = 'ans_instruction_finance_v1';
export const money = (value: number | null) => value === null ? '—' : value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const sumMoney = (values: (number | null)[]) => values.reduce<number>((sum, n) => sum + Math.round((n ?? 0) * 100), 0) / 100;

export function feeRevision(row: InstructionListRow, fees: InstructionFeeRow[]) {
  return JSON.stringify([row.instructionNo, row.waybill, row.customer, fees.map(f => [f.id, f.name, f.type, f.unit, f.currency, f.unitPrice, f.quantity, f.exchangeRate, f.remark, f.instructionRemark || '']).sort((a,b) => String(a[0]).localeCompare(String(b[0])))]);
}
export function readApprovals(): ApprovalStore {
  try {
    const raw = JSON.parse(localStorage.getItem(FINANCE_KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => {
      const a = value as Approval;
      return a && ['已通过','已驳回','待审批'].includes(a.status) && typeof a.revision === 'string' && Array.isArray(a.logs) && a.logs.every(l => l && typeof l.id === 'string' && typeof l.action === 'string' && typeof l.at === 'string' && typeof l.note === 'string');
    })) as ApprovalStore;
  } catch { return {}; }
}
export function financeRecord(row: InstructionListRow, fees: InstructionFeeRow[], approvals: ApprovalStore): FinanceRecord {
  const revision = feeRevision(row, fees), approval = approvals[row.instructionNo];
  const changed = !!approval && approval.revision !== revision;
  const total = fees.length ? getInstructionFeeTotal(fees) : null;
  const status: ApprovalStatus = !approval || changed ? '待审批' : approval.status;
  return { row, fees, total, revision, approval, changed, status };
}
export function loadFinanceRecords(): FinanceRecord[] {
  const approvals = readApprovals();
  return loadListRows([...pickupRows(), ...instructionSeedRows]).map(row => financeRecord(row, loadInstructionDetail(row).fees, approvals));
}
export function decideApprovals(store: ApprovalStore, records: FinanceRecord[], action: 'approve' | 'reject' | 'resubmit', note: string, at = new Date().toLocaleString('sv-SE')): ApprovalStore {
  if (!records.length) throw new Error('请先选择指令单');
  if (action === 'reject' && !note.trim()) throw new Error('请填写驳回原因');
  if (note.length > 500) throw new Error('审批意见不能超过500字');
  if (records.some(r => action === 'resubmit' ? r.status !== '已驳回' : r.status !== '待审批')) throw new Error('所选指令状态已变更，请刷新后重试');
  if (records.some(isInactiveFinanceRecord)) throw new Error('已取消或业务驳回的指令不可审批');
  if (records.some(r => r.total === null)) throw new Error('请先填写指令费用');
  const next = { ...store };
  for (const r of records) {
    const status = action === 'approve' ? '已通过' : action === 'reject' ? '已驳回' : '待审批';
    const log: FinanceLog = { id: `${r.row.instructionNo}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, at, operator: '天朗', action: action === 'resubmit' ? '重新提交' : action === 'approve' ? '审批通过' : '审批驳回', note: note.trim(), total: r.total, revision: r.revision };
    next[r.row.instructionNo] = { status, revision: r.revision, logs: [...(store[r.row.instructionNo]?.logs || []), log] };
  }
  return next;
}
export function saveDecision(records: FinanceRecord[], action: 'approve' | 'reject' | 'resubmit', note: string) {
  const current = loadFinanceRecords();
  const checked = records.map(record => {
    const live = current.find(r => r.row.instructionNo === record.row.instructionNo);
    if (!live || live.revision !== record.revision || live.status !== record.status) throw new Error('费用或状态已变更，请刷新后重新审批');
    return live;
  });
  localStorage.setItem(FINANCE_KEY, JSON.stringify(decideApprovals(readApprovals(), checked, action, note)));
}
export function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`;
}

export function financeOrderType(row: InstructionListRow): '发货' | '增值服务' | '销毁' | '自提' {
  if (row.instructionType === '自提') return '自提';
  if (row.instructionType === '销毁') return '销毁';
  if (row.instructionType === '放货' || row.instructionType === '发货') return '发货';
  return '增值服务';
}
export function financeCustomerFullName(row: InstructionListRow & { customerFullName?: string }): string {
  return row.customerFullName?.trim() || '—';
}
export function isInactiveFinanceRecord(record: FinanceRecord): boolean {
  return record.row.tab === '取消' || record.row.tab === '驳回' || record.row.status === '已取消' || record.row.status === '已驳回';
}
export function canReviewFinanceRecord(record: FinanceRecord): boolean {
  return record.status === '待审批' && record.total !== null && !isInactiveFinanceRecord(record);
}
