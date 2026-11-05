import type { InstructionListRow } from './instructionListTypes';
import type { InventoryState } from './overseasStorageInventoryData';
import type { InstructionCargoRow } from './instructionDetailData';
import { getInstructionInventoryRecords } from './instructionInventoryLinks';
import { buildInstructionDetail } from './instructionDetailData';

export function getInstructionCargoRows(row: InstructionListRow, inventory: InventoryState): InstructionCargoRow[] {
  const count = Number(row.packages);
  if (!Number.isSafeInteger(count) || count < 1) return [];
  const order = inventory.orders.find(order => row.id === `release:${order.id}`);
  const boxes = getInstructionInventoryRecords(row, inventory.records).flatMap(record => record.cargoBoxes)
    .filter(box => !order || order.boxIds.includes(box.id));
  if (boxes.length === count) return boxes.map(box => ({ id: box.id, boxNo: box.boxNo, packages: 1,
    weight: box.weight, dimensions: box.dimensions, systemWeight: box.systemWeight,
    customerLines: [`重量：${box.weight} KG`, `尺寸：${box.dimensions}`], pickingLines: [`${box.systemWeight} KG`] }));
  const summary = buildInstructionDetail(row).cargoRows[0];
  return Array.from({ length: count }, (_, index) => ({
    id: `${row.id}:cargo:${index + 1}`, boxNo: '—', packages: 1,
    weight: count === 1 && /^\d+(?:\.\d+)?$/.test(row.weight.trim()) ? Number(row.weight) : undefined,
    customerLines: count === 1 ? summary.customerLines : ['件数：1 件', '重量：—', '尺寸：—'], pickingLines: ['—'],
  }));
}
