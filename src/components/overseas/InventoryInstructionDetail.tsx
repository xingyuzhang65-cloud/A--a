import { useState } from 'react';
import InstructionDetailPage from './InstructionDetailPage';
import { readListState } from './instructionListState';
import { assignInstructionNumbers } from './instructionNumbers';
import type { InstructionListRow } from './instructionListTypes';
import type { InstructionDetailState } from './instructionDetailStore';
import type { InventoryRecord, InventoryState } from './overseasStorageInventoryData';

/** Adapt one outbound batch to the same detail used by processing instructions. */
export function buildInventoryInstructionDetail(record: InventoryRecord, inventory: InventoryState) {
  const order = inventory.orders.find(order => order.recordIds.includes(record.id) && order.applicationNo === record.applicationNo);
  const linked = readListState().rows.find(row => order && row.id === `release:${order.id}`
    || row.waybill === record.waybillNo && !!record.applicationNo
      && (row.instructionNo === record.applicationNo || row.legacyInstructionNo === record.applicationNo));
  const identity = order ? assignInstructionNumbers(inventory.orders.map(item => ({ id: `release:${item.id}`,
    instructionNo: item.applicationNo, created: item.createdAt,
    waybill: inventory.records.find(record => item.recordIds.includes(record.id))?.waybillNo || '—',
  }))).find(item => item.id === `release:${order.id}`) : undefined;
  const fees = [...new Map([...(record.instructions || []), ...(order?.instructions || [])].map(fee => [fee.id, fee])).values()];
  const kind = order?.kind || record.releaseType || '发货';
  const row: InstructionListRow = {
    ...linked,
    id: linked?.id || (order ? `release:${order.id}` : `inventory:${record.id}`),
    instructionNo: linked?.instructionNo || identity?.instructionNo || record.applicationNo || record.id,
    legacyInstructionNo: linked?.legacyInstructionNo || identity?.legacyInstructionNo,
    tab: '处理中', status: '已处理',
    waybill: record.waybillNo || '—', customer: record.customer,
    names: fees.map(fee => fee.name),
    created: linked?.created || order?.createdAt || '', updated: linked?.updated || order?.createdAt || record.time,
    shipment: record.shipmentId || order?.shipmentId || record.fbaNo || '-',
    reference: record.referenceId || order?.referenceId || '-',
    warehouse: record.warehouseCode || '-', zip: order?.postalCode || linked?.zip || '-',
    orderType: record.waybillType || order?.waybillType || '-', instructionType: kind === '发货' ? '放货' : kind,
    destination: order?.destination || record.destination,
    salesman: linked?.salesman || '-', merchandiser: linked?.merchandiser || '-',
    packages: String(record.boxes), weight: String(record.weight), volume: String(record.volume),
    fee: String(fees.reduce((sum, fee) => sum + fee.unitPrice * fee.quantity * fee.exchangeRate, 0)),
    arrived: '是', overseasTime: record.time, inventoryRecordIds: [record.id],
    palletLabel: record.pallet, internalRemark: linked?.internalRemark || order?.remark || record.remark,
    scheduledAt: linked?.scheduledAt || order?.scheduledAt || '',
    waybillRemark: linked?.waybillRemark ?? order?.remark ?? record.remark,
    expectedPickupTime: order?.pickupAt || linked?.expectedPickupTime,
    pickupContact: order?.contact || linked?.pickupContact, pickupPhone: order?.phone || linked?.pickupPhone,
  };
  const initialState: InstructionDetailState = {
    fees: fees.map(fee => ({ ...fee, billingTime: fee.billingTime || fee.addedAt,
      remark: fee.feeRemark, originalAmount: fee.unitPrice * fee.quantity,
      rmbAmount: Math.round(fee.unitPrice * fee.quantity * fee.exchangeRate * 100) / 100 })),
    feesEdited: true,
    attachments: (order?.attachments || []).map(file => ({ id: file.id, name: file.name, type: '其他',
      customerVisible: '可见', fileSize: file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.ceil(file.size / 1024))}KB`,
      uploadedBy: '—', uploadedAt: order?.createdAt || '—', dataUrl: file.dataUrl || '' })),
    customerNote: row.customerNote || '', internalRemark: row.internalRemark || '', failureReason: row.failureReason || '',
    boxSelectionMode: linked?.boxSelectionMode || '指定',
    waybillInfo: { shipmentId: row.shipment === '-' ? '' : row.shipment, referenceId: row.reference === '-' ? '' : row.reference,
      scheduledAt: row.scheduledAt || '', remark: row.waybillRemark || '' },
  };
  // The same waybill may have multiple outbound batches. Scope every tab to this batch.
  const scopedInventory: InventoryState = { ...inventory, records: [record], orders: order ? [{ ...order, recordIds: [record.id] }] : [],
    logs: inventory.logs.filter(log => log.recordId === record.id) };
  return { row, initialState, inventory: scopedInventory };
}

export default function InventoryInstructionDetail({ record, inventory, onClose }: {
  record: InventoryRecord; inventory: InventoryState; onClose: () => void;
}) {
  const [detail] = useState(() => buildInventoryInstructionDetail(record, inventory));
  const [row, setRow] = useState(detail.row);
  return <InstructionDetailPage row={row} initialState={detail.initialState} inventory={detail.inventory}
    onClose={onClose} onUpdate={patch => setRow(current => ({ ...current, ...patch }))} />;
}
