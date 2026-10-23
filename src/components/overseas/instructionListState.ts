import { loadOverseasInventory, type ReleaseOrder } from './overseasStorageInventoryData';
import { applyInstructionDetailOverrides, loadInstructionDetail, saveInstructionDetail } from './instructionDetailStore';
import { assignInstructionNumbers } from './instructionNumbers';
import type { InstructionListRow } from './instructionListTypes';

export const LIST_STATE_KEY = 'ans_overseas_instruction_list_v2';
export interface ListLog { at: string; ids: string[]; action: string }
export function readListState(): { rows: InstructionListRow[]; logs: ListLog[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(LIST_STATE_KEY) || 'null');
    if (Array.isArray(saved?.rows) && saved.rows.every((row: InstructionListRow) => row && typeof row.id === 'string' && typeof row.instructionNo === 'string' && typeof row.waybill === 'string' && Array.isArray(row.names))) return {
      rows: saved.rows.map((row: InstructionListRow & { tab: string }) => ({ ...row,
        // Previously confirmed instructions had not been ordered yet.
        tab: String(row.tab) === '已确认' ? '待确认' : String(row.tab) === '已推送海外仓' ? '已下单' : row.tab,
      })), logs: Array.isArray(saved.logs) ? saved.logs : [],
    };
  } catch { /* Recover the bundled examples without touching stored source data. */ }
  return { rows: [], logs: [] };
}
export function persistListRows(rows: InstructionListRow[], log?: ListLog) {
  const logs = readListState().logs;
  localStorage.setItem(LIST_STATE_KEY, JSON.stringify({ rows, logs: log ? [...logs, log] : logs }));
}

export function loadListRows(seed: InstructionListRow[]): InstructionListRow[] {
  const inventory = loadOverseasInventory();
  const saved = readListState().rows;
  const byId = new Map([...seed, ...saved].map(row => [row.id, row]));
  const orders = new Map<string, ReleaseOrder>();
  for (const order of inventory.orders) {
    const id = 'release:' + order.id;
    orders.set(id, order);
    if (byId.has(id)) continue;
    const records = inventory.records.filter(record => order.recordIds.includes(record.id));
    const boxes = records.flatMap(record => record.cargoBoxes).filter(box => order.boxIds.includes(box.id));
    const first = records[0];
    if (!first) continue;
    byId.set(id, {
      id, tab: '待确认', waybill: first.waybillNo || '—', instructionNo: order.applicationNo,
      names: order.instructions.length ? order.instructions.map(fee => fee.name) : [order.kind],
      created: order.createdAt, updated: order.createdAt, shipment: order.shipmentId || '-', reference: order.referenceId || '-',
      status: '待处理', customer: first.customer, warehouse: first.warehouseCode || '-', zip: order.postalCode || '-',
      orderType: order.kind === '发货' ? order.waybillType : '-', instructionType: order.kind === '发货' ? '放货' : order.kind,
      destination: order.destination || first.destination, salesman: '-', merchandiser: '-',
      fee: String(order.instructions.reduce((sum, fee) => sum + fee.unitPrice * fee.quantity * fee.exchangeRate, 0)),
      packages: String(boxes.length), weight: String(boxes.reduce((sum, box) => sum + box.weight, 0)),
      volume: String(records.reduce((sum, record) => sum + record.volume * record.cargoBoxes.filter(box => order.boxIds.includes(box.id)).length / record.boxes, 0)),
      arrived: '是', overseasTime: first.time, inventoryRecordIds: order.recordIds, palletLabel: records.map(record => record.pallet).join('；'),
      expectedPickupTime: order.pickupAt, pickupContact: order.contact, pickupPhone: order.phone,
      internalRemark: order.remark, scheduledAt: order.scheduledAt, boxSelectionMode: '指定',
    });
  }
  return assignInstructionNumbers([...byId.values()]).map(row => {
    const order = orders.get(row.id);
    if (order && order.instructions.length) {
      const state = loadInstructionDetail(row);
      if (!state.feesEdited) {
        try { saveInstructionDetail(row, { ...state, feesEdited: true, internalRemark: order.remark,
          fees: order.instructions.map(fee => ({ ...fee, billingTime: fee.billingTime || order.createdAt, addedAt: fee.addedAt || order.createdAt,
            remark: fee.feeRemark, originalAmount: fee.unitPrice * fee.quantity, rmbAmount: Math.round(fee.unitPrice * fee.quantity * fee.exchangeRate * 100) / 100 })),
        }); } catch { /* Display remains available when local storage is full. */ }
      }
    }
    return applyInstructionDetailOverrides(row);
  });
}
