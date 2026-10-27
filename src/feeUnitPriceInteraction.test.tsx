import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act } from 'react';
import type { Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import InventoryPage from './components/overseas/OverseasStagingInventoryPage';
import InstructionDetailPage from './components/overseas/InstructionDetailPage';
import { createInitialOverseasInventory, createReleaseDraft, getInventoryFeeCatalog, loadOverseasInventory, persistOverseasInventory, submitInventoryRelease, OVERSEAS_INVENTORY_STORAGE_KEY } from './components/overseas/overseasStorageInventoryData';
import { getInstructionFeeTotal, loadInstructionDetail, INSTRUCTION_DETAIL_STORAGE_KEY } from './components/overseas/instructionDetailStore';
import { loadListRows, persistListRows } from './components/overseas/instructionListState';
import { persistInventoryFeePrice } from './components/overseas/feeUnitPriceStore';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:4206/A--a/', pretendToBeVisual: true });
const originals = new Map<string, PropertyDescriptor | undefined>();
let createRoot: typeof import('react-dom/client')['createRoot'], root: Root, host: HTMLDivElement;
let failKey = '';
const storage = {
  getItem: (key: string) => dom.window.localStorage.getItem(key),
  setItem: (key: string, value: string) => { if (key === failKey) throw new Error('Storage full'); dom.window.localStorage.setItem(key, value); },
  removeItem: (key: string) => dom.window.localStorage.removeItem(key),
};
before(async () => {
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, localStorage: storage, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  ({ createRoot } = await import('react-dom/client'));
});
beforeEach(() => { failKey = ''; dom.window.localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
after(() => { dom.window.close(); for (const [key, value] of originals) { if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key); } });
const click = async (element: HTMLElement) => { assert.ok(element); await act(async () => element.click()); };
const button = (name: string) => { const element = [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === name); assert.ok(element, name); return element; };
const priceButton = () => { const element = document.querySelector<HTMLButtonElement>('[aria-label="编辑计费单价1"]'); assert.ok(element); return element; };
const inputPrice = async (value: string) => {
  const input = document.querySelector<HTMLInputElement>('[aria-label="计费单价1"]'); assert.ok(input);
  await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
};
const save = async () => { const form = document.querySelector('.operation-instruction-price-editor'); assert.ok(form); await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))); };
const mountInventory = async () => { await act(async () => root.render(<InventoryPage addToast={() => {}} />)); };
const reopen = async (render: () => Promise<void>) => { await act(async () => root.unmount()); root = createRoot(host); await render(); };

test('inventory detail edits persist decimal prices, recalculate totals and preserve other fee fields after reload', async () => {
  const data = createInitialOverseasInventory();
  const record = data.records.find(row => row.status === '暂存' && row.instructions?.length)!;
  persistOverseasInventory(data); await mountInventory(); await click(button(record.waybillNo!));
  const original = structuredClone(record.instructions!);
  await click(priceButton()); await inputPrice('12.3456'); await save();
  const expected = original.map((fee, index) => index ? fee : { ...fee, unitPrice: 12.3456 });
  assert.deepEqual(loadOverseasInventory().records.find(row => row.id === record.id)!.instructions, expected);
  assert.match(document.querySelector('.oi-fee-summary')!.textContent!, new RegExp(expected.reduce((sum, fee) => sum + fee.unitPrice * fee.quantity * fee.exchangeRate, 0).toFixed(2)));
  await reopen(mountInventory); await click(button(record.waybillNo!)); await click(priceButton());
  assert.equal(document.querySelector<HTMLInputElement>('[aria-label="计费单价1"]')!.value, '12.3456');
});

test('blank and negative prices are rejected, cancellation discards changes and zero is saved', async () => {
  const record = createInitialOverseasInventory().records.find(row => row.status === '暂存' && row.instructions?.length)!;
  await mountInventory(); await click(button(record.waybillNo!)); await click(priceButton());
  for (const value of ['', '-1']) {
    await inputPrice(value); await save(); assert.match(document.querySelector('[role="alert"]')!.textContent!, /有效单价/);
    assert.equal(localStorage.getItem(OVERSEAS_INVENTORY_STORAGE_KEY), null);
  }
  await inputPrice('99'); await click(button('取消')); assert.equal(localStorage.getItem(OVERSEAS_INVENTORY_STORAGE_KEY), null);
  await click(priceButton()); await inputPrice('0'); await save();
  assert.equal(loadOverseasInventory().records.find(row => row.id === record.id)!.instructions![0].unitPrice, 0);
});

function seedRelease() {
  const data = createInitialOverseasInventory(), record = data.records.find(row => row.status === '暂存' && row.cargoBoxes.some(box => box.status === '待处理'))!;
  const draft = { ...createReleaseDraft([record]), kind: '自提' as const, boxIds: [record.cargoBoxes.find(box => box.status === '待处理')!.id], boxCount: 1,
    instructions: [{ ...getInventoryFeeCatalog()[0], id: 'release-test-fee', unitPrice: 2.5, quantity: 3, exchangeRate: 7.1 }] };
  persistOverseasInventory(submitInventoryRelease(data, [record.id], draft));
  const row = { ...loadListRows([])[0], tab: '已下单' as const }; persistListRows([row]);
  return { row, record };
}

test('ordered instructions support editing prices with conversion, reload persistence and linked inventory updates', async () => {
  const { row } = seedRelease(); let patch: Record<string, unknown> = {};
  const render = async () => { await act(async () => root.render(<InstructionDetailPage row={row} onClose={() => {}} onUpdate={value => { patch = value; }} />)); await click(button('费用信息')); };
  await render(); await click(priceButton()); await inputPrice('4.25'); await save();
  const detail = loadInstructionDetail(row);
  assert.equal(detail.fees[0].unitPrice, 4.25); assert.equal(detail.fees[0].originalAmount, 12.75); assert.equal(detail.fees[0].rmbAmount, 90.53);
  assert.equal(patch.fee, '90.53'); assert.equal(loadOverseasInventory().orders[0].instructions[0].unitPrice, 4.25);
  assert.equal(loadListRows([])[0].tab, '已下单');
  await reopen(render); await click(priceButton()); assert.equal(document.querySelector<HTMLInputElement>('[aria-label="计费单价1"]')!.value, '4.25');
});

test('inventory price changes synchronize existing instruction details and roll back when a linked save fails', () => {
  const { row, record } = seedRelease();
  const data = persistInventoryFeePrice(loadOverseasInventory(), [record.id], 'release-test-fee', 5);
  assert.equal(loadInstructionDetail(row).fees[0].unitPrice, 5); assert.equal(getInstructionFeeTotal(loadInstructionDetail(row).fees), 106.5);
  const beforeInventory = localStorage.getItem(OVERSEAS_INVENTORY_STORAGE_KEY), beforeDetail = localStorage.getItem(INSTRUCTION_DETAIL_STORAGE_KEY);
  failKey = OVERSEAS_INVENTORY_STORAGE_KEY;
  assert.throws(() => persistInventoryFeePrice(data, [record.id], 'release-test-fee', 8), /Storage full/);
  assert.equal(localStorage.getItem(OVERSEAS_INVENTORY_STORAGE_KEY), beforeInventory); assert.equal(localStorage.getItem(INSTRUCTION_DETAIL_STORAGE_KEY), beforeDetail);
});

test('failed instruction price saves retain the editor value and recover on retry', async () => {
  const { row } = seedRelease();
  await act(async () => root.render(<InstructionDetailPage row={row} onClose={() => {}} />)); await click(button('费用信息')); await click(priceButton()); await inputPrice('7.5');
  failKey = OVERSEAS_INVENTORY_STORAGE_KEY; await save();
  assert.equal(loadInstructionDetail(row).fees[0].unitPrice, 2.5); assert.equal(document.querySelector<HTMLInputElement>('[aria-label="计费单价1"]')!.value, '7.5');
  assert.match(document.querySelector('.operation-instruction-price-editor [role="alert"]')!.textContent!, /保存失败/);
  failKey = ''; await save(); assert.equal(loadInstructionDetail(row).fees[0].unitPrice, 7.5);
});

test('Escape cancels only the inline price edit and leaves instruction details open', async () => {
  const { row } = seedRelease(); let closed = false;
  await act(async () => root.render(<InstructionDetailPage row={row} onClose={() => { closed = true; }} />));
  await click(button('费用信息')); await click(priceButton()); await inputPrice('123');
  const input = document.querySelector<HTMLInputElement>('[aria-label="计费单价1"]')!;
  await act(async () => input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
  assert.equal(closed, false); assert.equal(document.querySelector('.operation-instruction-price-editor'), null);
  assert.equal(loadInstructionDetail(row).fees[0].unitPrice, 2.5);
});
