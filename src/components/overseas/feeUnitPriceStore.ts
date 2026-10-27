import { INSTRUCTION_DETAIL_STORAGE_KEY, getInstructionFeeTotal, loadInstructionDetail, saveInstructionDetail, type InstructionDetailState } from './instructionDetailStore';
import { LIST_STATE_KEY, loadListRows } from './instructionListState';
import type { InstructionListRow } from './instructionListTypes';
import { OVERSEAS_INVENTORY_STORAGE_KEY, loadOverseasInventory, persistOverseasInventory, type InventoryState } from './overseasStorageInventoryData';

export function validateFeeUnitPrice(price: number, quantity: number, rate: number) {
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(price * quantity * rate * 100)) {
    throw new Error('请输入大于或等于0的有效单价，费用金额不能超出范围');
  }
}

// A linked release is stored in both inventory and instruction details.
// Restore both snapshots if either write fails, so the views cannot disagree.
function transaction<T>(save: () => T): T {
  const snapshots = [OVERSEAS_INVENTORY_STORAGE_KEY, INSTRUCTION_DETAIL_STORAGE_KEY, LIST_STATE_KEY]
    .map(key => [key, localStorage.getItem(key)] as const);
  try { return save(); }
  catch (error) {
    for (const [key, value] of snapshots) {
      if (localStorage.getItem(key) === value) continue;
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    }
    throw error;
  }
}

export function persistInstructionFeePrice(row: InstructionListRow, state: InstructionDetailState, feeId: string) {
  const fee = state.fees.find(item => item.id === feeId);
  if (!fee) throw new Error('费用已变更，请重新打开详情');
  validateFeeUnitPrice(fee.unitPrice, fee.quantity, fee.exchangeRate);
  if (!Number.isFinite(getInstructionFeeTotal(state.fees))) throw new Error('费用合计超出范围');
  transaction(() => {
    saveInstructionDetail(row, state);
    if (!row.id.startsWith('release:')) return;
    const data = loadOverseasInventory();
    const order = data.orders.find(item => 'release:' + item.id === row.id);
    if (!order?.instructions.some(item => item.id === feeId)) return;
    persistOverseasInventory({ ...data, orders: data.orders.map(item => item.id !== order.id ? item : {
      ...item, instructions: item.instructions.map(line => line.id === feeId ? { ...line, unitPrice: fee.unitPrice } : line),
    }) });
  });
}

export function persistInventoryFeePrice(data: InventoryState, recordIds: string[], feeId: string, unitPrice: number): InventoryState {
  const update = <T extends { id: string; unitPrice: number; quantity: number; exchangeRate: number }>(fees: T[]) => fees.map(fee => {
    if (fee.id !== feeId) return fee;
    validateFeeUnitPrice(unitPrice, fee.quantity, fee.exchangeRate);
    return { ...fee, unitPrice };
  });
  const orders = data.orders.filter(order => order.recordIds.some(id => recordIds.includes(id)) && order.instructions.some(fee => fee.id === feeId));
  const next: InventoryState = {
    ...data,
    records: data.records.map(record => !recordIds.includes(record.id) || !record.instructions ? record : { ...record, instructions: update(record.instructions) }),
    orders: data.orders.map(order => orders.some(item => item.id === order.id) ? { ...order, instructions: update(order.instructions) } : order),
  };
  for (const fees of [...next.records.filter(record => recordIds.includes(record.id)).map(record => record.instructions || []), ...next.orders.filter(order => orders.some(item => item.id === order.id)).map(order => order.instructions)]) {
    if (!Number.isFinite(fees.reduce((sum, fee) => sum + fee.unitPrice * fee.quantity * fee.exchangeRate, 0) * 100)) throw new Error('费用合计超出范围');
  }
  return transaction(() => {
    // Materialize release details before changing their source prices.
    const rows = orders.length ? loadListRows([]) : [];
    for (const order of orders) {
      const row = rows.find(item => item.id === 'release:' + order.id);
      if (!row) continue;
      const detail = loadInstructionDetail(row);
      // Deleted fees must not be reintroduced by changing an inventory price.
      if (!detail.fees.some(fee => fee.id === feeId)) continue;
      saveInstructionDetail(row, { ...detail, fees: update(detail.fees), feesEdited: true, updatedAt: new Date().toLocaleString('sv-SE') });
    }
    persistOverseasInventory(next);
    return next;
  });
}
