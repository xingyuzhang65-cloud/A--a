import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import OverseasStagingInventoryPage from './components/overseas/OverseasStagingInventoryPage';
import { createInitialOverseasInventory, createReleaseDraft, persistOverseasInventory, type InventoryRecord, type InventoryState } from './components/overseas/overseasStorageInventoryData';
import { buildInventoryInstructionDetail } from './components/overseas/InventoryInstructionDetail';
import { loadInstructionDetail, saveInstructionDetail } from './components/overseas/instructionDetailStore';
import { getInstructionWaybillContext } from './components/overseas/instructionWaybillContext';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:4213/A--a/', pretendToBeVisual: true });
const originals = new Map<string, PropertyDescriptor | undefined>();
let root: any;
let host: HTMLDivElement;
let createRoot: any;
let inventory: InventoryState;
before(async () => {
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
    navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    FileReader: dom.window.FileReader, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  ({ createRoot } = await import('react-dom/client'));
});
beforeEach(() => {
  localStorage.clear(); inventory = createInitialOverseasInventory();
  const ready = inventory.records.find(record => record.status === '待出库')!;
  const shipped = inventory.records.find(record => record.status === '已出库')!;
  inventory.records = [ready, shipped]; persistOverseasInventory(inventory);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
after(() => { dom.window.close(); for (const [key, value] of originals) { if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key); } });
const mount = async () => act(async () => root.render(<OverseasStagingInventoryPage addToast={() => {}} />));
function get<T extends Element = HTMLElement>(selector: string, scope: ParentNode = document): T {
  const element = scope.querySelector<T>(selector); assert.ok(element, selector); return element;
}
function button(text: string, scope: ParentNode = document) {
  const element = [...scope.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === text);
  assert.ok(element, text); return element;
}
const click = async (element: HTMLElement) => act(async () => element.click());
async function input(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  const prototype = element.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
  await act(async () => { element.dispatchEvent(new dom.window.Event('input', { bubbles: true })); element.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
}
async function open(record: InventoryRecord) {
  const tab = [...host.querySelectorAll<HTMLButtonElement>('[role=tab]')].find(tab => tab.textContent?.startsWith(record.status === '待出库' ? '指令处理完成' : record.status));
  assert.ok(tab); await click(tab); await click(button(record.waybillNo!, host));
}

for (const status of ['待出库', '已出库'] as const) {
  test(`${status} uses all processing-detail tabs with the selected batch's actual data`, async () => {
    const record = inventory.records.find(record => record.status === status)!; await mount(); await open(record);
    const detail = get<HTMLElement>('.instruction-detail-drawer');
    assert.deepEqual([...detail.querySelectorAll('[role=tab]')].map(tab => tab.textContent), ['货箱信息', '运踪信息', '费用信息', '其它信息']);
    assert.equal(document.querySelector('.oi-drawer'), null); assert.ok(detail.textContent?.includes(record.applicationNo!));
    assert.equal(get<HTMLInputElement>('[aria-label="ShipmentID"]', detail).value, record.shipmentId);
    assert.equal(get<HTMLInputElement>('[aria-label="ShipmentID"]', detail).readOnly, true);
    assert.equal(get<HTMLInputElement>('[aria-label="ReferenceID"]', detail).value, record.referenceId);
    assert.equal(get<HTMLInputElement>('[aria-label="箱数"]', detail).value, String(record.boxes));
    assert.equal(detail.querySelectorAll('.overseas-cargo-table tbody tr').length, record.boxes);
    assert.ok(button('添加转单号', detail));
    await click(button('运踪信息', detail)); assert.ok(get('[aria-label="新增运踪节点"]', detail));
    await click(button('费用信息', detail));
    assert.equal(get<HTMLElement>('.operation-instruction-table').querySelectorAll('tbody tr').length, record.instructions!.length);
    assert.ok(detail.textContent?.includes(record.instructions![0].instructionRemark)); assert.equal(button('处理', detail).disabled, true);
    assert.equal([...detail.querySelectorAll('button')].some(button => button.textContent === '新增费用'), false);
    assert.equal(detail.querySelector('[aria-label="编辑操作指令1"]'), null);
    await click(button('其它信息', detail)); assert.ok(button('上传附件', detail));
    await click(get<HTMLButtonElement>('[aria-label="关闭指令详情"]'));
    assert.equal(document.querySelector('[role=dialog]'), null);
  });
}

test('batch-scoped cargo does not include another outbound record with the same waybill', async () => {
  const [ready, shipped] = inventory.records; shipped.waybillNo = ready.waybillNo;
  shipped.cargoBoxes = shipped.cargoBoxes.map(box => ({ ...box, boxNo: `OTHER-${box.boxNo}` })); persistOverseasInventory(inventory);
  await mount(); await open(ready); const table = get<HTMLElement>('.overseas-cargo-table');
  assert.ok(table.textContent?.includes(ready.cargoBoxes[0].boxNo)); assert.equal(table.textContent?.includes('OTHER-'), false);
  assert.equal(table.querySelectorAll('tbody tr').length, ready.boxes);
});

test('transfers, tracking, selected fee processing and attachments persist after reopening', async () => {
  const record = inventory.records[0]; await mount(); await open(record);
  await click(button('添加转单号')); await input(get('[aria-label="第1箱转单号"]'), 'TRANSFER-ONE'); await click(button('保存转单号'));
  await click(button('运踪信息')); await click(get<HTMLButtonElement>('[aria-label="新增运踪节点"]'));
  await input(get('[aria-label="节点描述"]'), '已复核，等待提货'); await input(get('[aria-label="时间"]'), '2026-11-09T15:20'); await click(button('保存'));
  await click(button('费用信息')); await click(get<HTMLInputElement>('[aria-label="选择操作指令1"]')); await click(button('处理'));
  await input(get('[aria-label="处理状态"]'), '待处理'); await click(button('保存'));
  await click(button('其它信息')); await click(button('上传附件')); const fileInput = get<HTMLInputElement>('[aria-label="文件附件"]');
  Object.defineProperty(fileInput, 'files', { configurable: true, value: [new dom.window.File(['warehouse proof'], 'proof.txt', { type: 'text/plain' })] });
  await act(async () => { fileInput.dispatchEvent(new dom.window.Event('change', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 25)); });
  await click(button('确定'));
  await click(get<HTMLButtonElement>('[aria-label="关闭指令详情"]')); await open(record);
  assert.ok(get('.overseas-cargo-table').textContent?.includes('TRANSFER-ONE'));
  await click(button('运踪信息')); assert.ok(get('.instruction-detail-drawer').textContent?.includes('已复核，等待提货'));
  await click(button('费用信息')); const statuses = [...document.querySelectorAll('.operation-instruction-status')].map(element => element.textContent);
  assert.equal(statuses[0], '待处理'); assert.ok(statuses.slice(1).every(status => status === '已处理'));
  await click(button('其它信息')); assert.ok(get('.instruction-detail-drawer').textContent?.includes('proof.txt'));
  const model = buildInventoryInstructionDetail(record, inventory); const saved = loadInstructionDetail(model.row);
  assert.equal(saved.fees[0].id, record.instructions![0].id); assert.ok(saved.attachments[0].dataUrl.startsWith('data:text/plain;base64,'));
  assert.equal(saved.cargoTransferNumbers?.[record.cargoBoxes[0].id], 'TRANSFER-ONE');
  assert.equal(JSON.parse(localStorage.getItem('ans-overseas-overseas-inventory-v1')!).records[0].status, '待出库');
});

test('existing shared detail takes precedence and an empty fee list stays empty', async () => {
  const record = inventory.records[1]; record.instructions = []; persistOverseasInventory(inventory);
  const model = buildInventoryInstructionDetail(record, inventory);
  saveInstructionDetail(model.row, { ...model.initialState, trackingEvents: [{ id: 'existing', occurredAt: '2026-11-08 14:00:00', operator: '仓库', status: '已有运踪' }] });
  await mount(); await open(record); await click(button('运踪信息')); assert.ok(get('.instruction-detail-drawer').textContent?.includes('已有运踪'));
  await click(button('费用信息')); assert.ok(get('.operation-instruction-table').textContent?.includes('暂无数据'));
  assert.ok(get('.oi-fee-summary').textContent?.includes('共 0 条'));
});

test('original release attachments remain visible and unavailable source files do not prevent saving tracking', async () => {
  const record = inventory.records[0]; const draft = createReleaseDraft([record]);
  record.cargoBoxes[0].status = '处理中'; record.pending = 1; record.unsent = record.boxes - 1;
  inventory.orders = [{ ...draft, id: 'source-order', recordIds: [record.id], applicationNo: record.applicationNo!, createdAt: '2026-11-07 10:00:00', status: '待审批',
    boxIds: [record.cargoBoxes[0].id], boxCount: 1,
    attachments: [{ id: 'original', name: 'legacy-proof.pdf', size: 2048, type: 'application/pdf' }] }]; persistOverseasInventory(inventory);
  await mount(); await open(record); await click(button('其它信息')); assert.ok(get('.instruction-detail-drawer').textContent?.includes('legacy-proof.pdf'));
  await click(button('运踪信息')); await click(get<HTMLButtonElement>('[aria-label="新增运踪节点"]')); await input(get('[aria-label="节点描述"]'), '保留原附件'); await click(button('保存'));
  assert.ok(get('.instruction-detail-drawer').textContent?.includes('保留原附件')); assert.equal(document.querySelector('[role=alert]'), null);
});

test('a shared release retains its delivery fields when viewing a single outbound batch', () => {
  const record = inventory.records[0]; const draft = createReleaseDraft(inventory.records);
  inventory.orders = [{ ...draft, id: 'shared-order', recordIds: inventory.records.map(record => record.id),
    applicationNo: record.applicationNo!, createdAt: '2026-11-07 10:00:00', status: '待审批', deliveryMethod: 'UPS',
    shipmentId: 'ORIGINAL-SHIPMENT', referenceId: 'ORIGINAL-REFERENCE', scheduledAt: '2026-11-10' }];
  const model = buildInventoryInstructionDetail(record, inventory);
  const context = getInstructionWaybillContext(model.row, model.inventory);
  assert.equal(context.summary.deliveryMethod, 'UPS'); assert.equal(context.fields.scheduledAt, '2026-11-10');
  assert.deepEqual(inventory.orders[0].recordIds, inventory.records.map(record => record.id));
});
