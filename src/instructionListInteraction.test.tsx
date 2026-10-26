import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act } from 'react';
import type { Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import InstructionListPage from './components/InstructionListPage';
import {
  INITIAL_INSTRUCTION_LIST_RECORDS, INSTRUCTION_LIST_STORAGE_KEY, INSTRUCTION_LIST_TABS,
  loadInstructionListState, type InstructionListRecord, type InstructionListState,
} from './instructionListData';
import { INITIAL_STAGING_RECORDS } from './stagingData';
import { INITIAL_INSTRUCTIONS } from './instructionData';

const columnKey = 'ans_instruction_list_columns_v1';
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:4205/A--a/', pretendToBeVisual: true,
});
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
let createRoot: typeof import('react-dom/client')['createRoot'];
let root: Root;
let host: HTMLDivElement;

before(async () => {
  const values = {
    window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
    navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, SVGElement: dom.window.SVGElement,
    Element: dom.window.Element, Node: dom.window.Node,
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window), IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const [key, value] of Object.entries(values)) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  ({ createRoot } = await import('react-dom/client'));
});

beforeEach(async () => {
  dom.window.localStorage.clear();
  dom.window.history.replaceState(null, '', '/A--a/');
  host = dom.window.document.createElement('div');
  dom.window.document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<React.StrictMode><InstructionListPage /></React.StrictMode>));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

after(() => {
  dom.window.close();
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

function get<T extends Element = HTMLElement>(selector: string, scope: ParentNode = host): T {
  const element = scope.querySelector<T>(selector);
  assert.ok(element, `Missing element: ${selector}`);
  return element;
}

function button(text: string, scope: ParentNode = host): HTMLButtonElement {
  const element = [...scope.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === text);
  assert.ok(element, `Missing button: ${text}`);
  return element;
}

function field(label: string, scope: ParentNode = host): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const wrapper = [...scope.querySelectorAll('label')].find(item => {
    const text = item.cloneNode(true) as HTMLLabelElement;
    text.querySelectorAll('input, select, textarea, .sr-only').forEach(control => control.remove());
    return text.textContent?.trim() === label;
  });
  assert.ok(wrapper, `Missing label: ${label}`);
  return get('input, select, textarea', wrapper);
}

function tab(label: string): HTMLButtonElement {
  const element = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(item => item.textContent?.startsWith(label));
  assert.ok(element, `Missing status tab: ${label}`);
  return element;
}

function rows(): HTMLTableRowElement[] {
  return [...host.querySelectorAll<HTMLTableRowElement>('tbody tr')].filter(row => row.querySelector('td:not([colspan])'));
}
function dialog() { return get<HTMLElement>('[role="dialog"]', dom.window.document); }
function stored(): InstructionListState { return JSON.parse(dom.window.localStorage.getItem(INSTRUCTION_LIST_STORAGE_KEY)!); }
function selectRow(index: number) { return get<HTMLInputElement>('input[type="checkbox"]', rows()[index]); }
function headers() { return [...host.querySelectorAll('thead th')].map(element => element.textContent); }
function cell(row: HTMLTableRowElement, label: string) {
  const index = headers().indexOf(label);
  assert.ok(index >= 0, `Missing column: ${label}`);
  return row.querySelectorAll<HTMLTableCellElement>('td')[index];
}
function rowFor(instructionNo: string) {
  const row = rows().find(item => item.textContent?.includes(instructionNo));
  assert.ok(row, `Missing instruction row: ${instructionNo}`);
  return row;
}
async function click(element: HTMLElement) { await act(async () => element.click()); }
async function submit(form: HTMLFormElement) {
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
}
async function setValue(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  const prototype = element.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype
    : element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
  await act(async () => {
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    element.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
}
async function remount() {
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<React.StrictMode><InstructionListPage /></React.StrictMode>));
}
async function allRows() { await setValue(get<HTMLSelectElement>('[aria-label="指令列表每页条数"]'), '100'); }
function saveFixture(records: InstructionListRecord[]) {
  dom.window.localStorage.setItem(INSTRUCTION_LIST_STORAGE_KEY, JSON.stringify({ records, logs: [] }));
}

test('all eight status tabs show data-derived counts and changing tabs clears checked instructions', async () => {
  await allRows();
  assert.equal(host.querySelectorAll('[role="tab"]').length, 8);
  for (const key of INSTRUCTION_LIST_TABS) {
    const expected = INITIAL_INSTRUCTION_LIST_RECORDS.filter(row => key === '全部' || row.tab === key).length;
    assert.equal(tab(key).textContent, `${key}${expected}`);
    await click(tab(key));
    assert.equal(tab(key).getAttribute('aria-selected'), 'true');
    assert.equal(rows().length, expected);
  }
  await click(tab('待确认'));
  await click(selectRow(0));
  assert.equal(button('已确认').disabled, false);
  assert.ok(button('取消选择'));
  await click(tab('已确认'));
  assert.equal(button('已确认').disabled, true);
  assert.equal(button('取消下单').disabled, true);
  assert.equal(host.querySelector('input[type="checkbox"]:checked'), null);
  await click(tab('待确认'));
  assert.equal(host.querySelector('input[type="checkbox"]:checked'), null);
});

test('batch tokens are OR within each identifier and all four submitted identifier filters combine', async () => {
  const target = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '待确认' && row.reference && row.reference !== '-')!;
  assert.ok(target, 'fixture must contain a real reference ID');
  const initialCount = rows().length;
  await setValue(field('指令单号'), `MISSING, ${target.instructionNo.toLowerCase()}`);
  await setValue(field('运单号'), `${target.waybill} UNUSED`);
  await setValue(field('Shipment ID'), `unused；${target.shipment}`);
  await setValue(field('Reference ID'), `${target.reference}，unused`);
  assert.equal(rows().length, initialCount, 'draft filters must wait for query submission');
  await submit(get<HTMLFormElement>('form'));
  assert.equal(rows().length, 1);
  assert.ok(rowFor(target.instructionNo));
  assert.equal(tab('待确认').textContent, '待确认1');
  assert.equal(tab('全部').textContent, '全部1');
  await setValue(field('Reference ID'), 'NO-MATCH');
  await submit(get<HTMLFormElement>('form'));
  assert.equal(rows().length, 0);
  assert.ok(host.textContent?.includes('暂无符合条件的指令数据'));
  assert.equal(button('导出').disabled, true);
  await click(button('重置'));
  assert.equal(rows().length, initialCount);
});

test('advanced warehouse date filters use overseas arrival time rather than instruction creation time', async () => {
  const seed = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '待确认' && row.instructionType === '放货')!;
  const target = { ...seed, id: 'overseas-date', instructionNo: 'CI-OVERSEAS-DATE', created: '2026-01-01 09:00:00', overseasTime: '2026-10-15 23:59:59' };
  const other = { ...seed, id: 'creation-date', instructionNo: 'CI-CREATION-DATE', created: '2026-10-15 09:00:00', overseasTime: '2026-01-01 23:59:59' };
  saveFixture([target, other]);
  await remount();
  await click(button('展开'));
  await setValue(field('客户简称'), seed.customer);
  await setValue(field('业务员'), seed.salesman);
  await setValue(field('跟单代表'), seed.merchandiser);
  await setValue(field('仓库代码'), seed.warehouse);
  await setValue(field('下单类型'), seed.orderType);
  await setValue(field('指令单类型'), seed.instructionType);
  await setValue(field('是否到达海外仓'), '是');
  await setValue(get<HTMLInputElement>('[aria-label="入仓开始日期"]'), '2026-10-15');
  await setValue(get<HTMLInputElement>('[aria-label="入仓结束日期"]'), '2026-10-15');
  await submit(get<HTMLFormElement>('form'));
  assert.equal(rows().length, 1);
  assert.ok(rowFor(target.instructionNo));
  await setValue(get<HTMLInputElement>('[aria-label="入仓开始日期"]'), '2026-10-16');
  await submit(get<HTMLFormElement>('form'));
  assert.ok(get('[role="status"]', dom.window.document).textContent?.includes('开始日期不能晚于结束日期'));
  assert.equal(rows().length, 1, 'invalid date ranges must preserve the last applied query');
  await click(button('收起'));
  assert.equal(host.querySelector('#instruction-list-filters'), null);
  assert.ok(rowFor(target.instructionNo));
});

test('confirm and cancel move only pending instructions, persist audit logs, and survive remounts', async (t) => {
  const pending = INITIAL_INSTRUCTION_LIST_RECORDS.filter(row => row.tab === '待确认');
  const confirmed = pending[0];
  const cancelled = pending[1];
  const completed = INITIAL_INSTRUCTION_LIST_RECORDS.filter(row => row.tab === '已完成');
  const originalSet = dom.window.Storage.prototype.setItem;
  let writes = 0;
  t.mock.method(dom.window.Storage.prototype, 'setItem', function (this: Storage, key: string, value: string) {
    if (key === INSTRUCTION_LIST_STORAGE_KEY) writes += 1;
    originalSet.call(this, key, value);
  });
  await click(get<HTMLInputElement>(`[aria-label="选择指令单 ${confirmed.instructionNo}"]`));
  await click(button('已确认'));
  assert.ok(dialog().textContent?.includes(confirmed.instructionNo));
  assert.equal(dom.window.localStorage.getItem(INSTRUCTION_LIST_STORAGE_KEY), null, 'opening confirmation must not save');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  assert.equal(writes, 1, 'records and audit logs must be saved together');
  assert.equal(stored().records.find(row => row.id === confirmed.id)?.tab, '已确认');
  assert.equal(stored().records.find(row => row.id === confirmed.id)?.status, confirmed.status, 'approval must preserve the warehouse processing result');
  assert.equal(stored().logs.length, 1);
  assert.equal(stored().logs[0].action, '确认下单');
  assert.equal(stored().logs[0].recordId, confirmed.id);
  assert.ok(!rows().some(row => row.textContent?.includes(confirmed.instructionNo)));
  await click(get<HTMLInputElement>(`[aria-label="选择指令单 ${cancelled.instructionNo}"]`));
  await click(button('取消下单'));
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(writes, 2);
  assert.equal(stored().records.find(row => row.id === cancelled.id)?.tab, '取消');
  assert.equal(stored().records.find(row => row.id === cancelled.id)?.status, '已取消');
  assert.equal(stored().logs.length, 2);
  assert.equal(stored().logs[1].action, '取消下单');
  assert.deepEqual(stored().records.filter(row => row.tab === '已完成'), completed);
  await remount();
  await click(tab('已确认'));
  assert.ok(rowFor(confirmed.instructionNo));
  await click(get<HTMLInputElement>(`[aria-label="选择指令单 ${confirmed.instructionNo}"]`));
  assert.equal(button('已确认').disabled, true);
  assert.equal(button('取消下单').disabled, true);
  await click(button('查看日志'));
  assert.ok(dialog().textContent?.includes('确认下单'));
  assert.ok(dialog().textContent?.includes(confirmed.instructionNo));
  assert.ok(!dialog().textContent?.includes(cancelled.instructionNo), 'selected-row log view must remain scoped');
  await click(button('关闭', dialog()));
  await click(tab('取消'));
  assert.ok(rowFor(cancelled.instructionNo));
  await click(tab('已完成'));
  await click(selectRow(0));
  assert.equal(button('取消下单').disabled, true);
});

test('a failed state write retains the confirmation or batch approval dialog and selection without a false success', async (t) => {
  const target = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '待确认')!;
  const originalSet = dom.window.Storage.prototype.setItem;
  t.mock.method(dom.window.Storage.prototype, 'setItem', function (this: Storage, key: string, value: string) {
    if (key === INSTRUCTION_LIST_STORAGE_KEY) throw new Error('QuotaExceededError');
    originalSet.call(this, key, value);
  });
  await click(selectRow(0));
  for (const action of ['已确认', '批量审批']) {
    await click(button(action));
    await submit(get<HTMLFormElement>('form', dialog()));
    assert.ok(get('[role="alert"]', dialog()).textContent?.includes('本地存储不可用或空间不足'));
    assert.equal(dom.window.localStorage.getItem(INSTRUCTION_LIST_STORAGE_KEY), null);
    assert.equal(dom.window.document.querySelector('[role="status"]'), null);
    assert.ok(get<HTMLInputElement>(`[aria-label="选择指令单 ${target.instructionNo}"]`).checked);
    assert.ok(rowFor(target.instructionNo));
    await click(button('返回', dialog()));
  }
  await click(button('查看日志'));
  assert.ok(dialog().textContent?.includes('暂无操作日志'));
});

test('batch approval selects across pages, rejects stale selections atomically, and persists only the chosen approvals', async () => {
  const pending = INITIAL_INSTRUCTION_LIST_RECORDS.filter(row => row.tab === '待确认');
  assert.ok(pending.length > 11);
  assert.equal(button('批量审批').disabled, true);
  await setValue(get<HTMLSelectElement>('[aria-label="指令列表每页条数"]'), '10');
  await click(get<HTMLInputElement>('[aria-label="选择本页全部指令单"]'));
  await click(get<HTMLButtonElement>('[aria-label="指令列表下一页"]'));
  await click(selectRow(0));
  const chosen = pending.slice(0, 11);
  assert.equal(button('批量审批').disabled, false);
  await click(button('批量审批'));
  assert.equal(get('#instruction-list-dialog-title', dialog()).textContent, '批量审批');
  assert.ok(dialog().textContent?.includes('11'));
  for (const row of chosen) assert.ok(dialog().textContent?.includes(row.instructionNo));
  assert.ok(!dialog().textContent?.includes(pending[11].instructionNo));
  assert.ok(button('审批通过', dialog()));
  assert.equal(dom.window.localStorage.getItem(INSTRUCTION_LIST_STORAGE_KEY), null, 'opening batch approval must not persist changes');

  const stale = {
    records: INITIAL_INSTRUCTION_LIST_RECORDS.map(row => row.id === chosen[0].id ? { ...row, tab: '已确认' as const } : row), logs: [],
  };
  dom.window.localStorage.setItem(INSTRUCTION_LIST_STORAGE_KEY, JSON.stringify(stale));
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.ok(get('[role="alert"]', dialog()).textContent?.includes('所选指令状态已变更'));
  assert.deepEqual(stored(), stale, 'a stale row must prevent approvals and logs for the entire selection');
  assert.equal(dom.window.document.querySelector('[role="status"]'), null);
  await click(button('返回', dialog()));

  saveFixture(INITIAL_INSTRUCTION_LIST_RECORDS);
  await remount();
  await setValue(get<HTMLSelectElement>('[aria-label="指令列表每页条数"]'), '10');
  await click(get<HTMLInputElement>('[aria-label="选择本页全部指令单"]'));
  await click(get<HTMLButtonElement>('[aria-label="指令列表下一页"]'));
  await click(selectRow(0));
  await click(button('批量审批'));
  await click(button('审批通过', dialog()));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  const expectedIds = new Set(chosen.map(row => row.id));
  for (const original of INITIAL_INSTRUCTION_LIST_RECORDS) {
    const actual = stored().records.find(row => row.id === original.id)!;
    if (expectedIds.has(original.id)) assert.deepEqual([actual.tab, actual.status], ['已确认', original.status]);
    else assert.deepEqual(actual, original, 'unselected or already processed instructions must remain unchanged');
  }
  assert.equal(stored().logs.length, 11);
  assert.deepEqual(new Set(stored().logs.map(log => log.recordId)), expectedIds);
  assert.ok(stored().logs.every(log => log.action === '批量审批'));
  assert.equal(button('批量审批').disabled, true);
  await remount();
  assert.equal(tab('待确认').textContent, `待确认${pending.length - 11}`);
  assert.equal(button('批量审批').disabled, true);
  await click(tab('已确认'));
  assert.ok(![...host.querySelectorAll('button')].some(item => item.textContent?.trim() === '批量审批'), 'batch approval must only appear on the pending tab');
  await allRows();
  for (const row of chosen) assert.ok(rowFor(row.instructionNo));
  await click(get<HTMLInputElement>(`[aria-label="选择指令单 ${chosen[0].instructionNo}"]`));
  await click(button('查看日志'));
  assert.ok(dialog().textContent?.includes('批量审批'));
  assert.ok(dialog().textContent?.includes(chosen[0].instructionNo));
  assert.ok(!dialog().textContent?.includes(chosen[1].instructionNo));
});

test('existing staging orders appear with native currency totals and are not revived after approval', async () => {
  const source = INITIAL_STAGING_RECORDS[0];
  const order = {
    id: 'ORDER-INTEGRATION-USD', recordId: source.id, instructionId: 'FEE-EXAMPLE', instructionName: '暂存转入作业',
    quantity: 3, price: 2.5, currency: 'USD', createdAt: '2026-10-19T09:45:00+08:00', remark: '保留原始币种及作业要求',
  };
  dom.window.localStorage.setItem('ans_staging_management_v1', JSON.stringify({ records: INITIAL_STAGING_RECORDS, logs: [], orders: [order] }));
  await remount();
  const imported = loadInstructionListState().records.find(row => row.sourceOrderId === order.id)!;
  assert.ok(imported);
  const importedRow = rowFor(imported.instructionNo);
  assert.equal(cell(importedRow, '指令费用').textContent, '7.50 USD');
  assert.ok(importedRow.textContent?.includes(source.inboundNo));
  await click(get<HTMLButtonElement>(`[aria-label="查看指令 ${imported.instructionNo}"]`));
  assert.ok(dialog().textContent?.includes(source.palletLabel));
  assert.ok(dialog().textContent?.includes(order.remark));
  await click(button('关闭', dialog()));
  await click(get<HTMLInputElement>(`[aria-label="选择指令单 ${imported.instructionNo}"]`));
  await click(button('已确认'));
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(stored().records.find(row => row.sourceOrderId === order.id)?.tab, '已确认');
  await remount();
  assert.ok(!rows().some(row => row.textContent?.includes(imported.instructionNo)));
  await act(async () => dom.window.dispatchEvent(new dom.window.Event('ans:staging-updated')));
  assert.ok(!rows().some(row => row.textContent?.includes(imported.instructionNo)));
  assert.equal(loadInstructionListState().records.filter(row => row.sourceOrderId === order.id).length, 1);
  await click(tab('已确认'));
  assert.ok(rowFor(imported.instructionNo));
  assert.equal(cell(rowFor(imported.instructionNo), '指令费用').textContent, '7.50 USD');
});

test('pickup details show the expected time, contact and phone and completed failures stay visibly distinct', async () => {
  const pickup = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.instructionType === '自提')!;
  assert.ok(pickup);
  await allRows();
  assert.equal(cell(rowFor(pickup.instructionNo), '预计提货时间').textContent, pickup.expectedPickupTime);
  await click(get<HTMLButtonElement>(`[aria-label="查看指令 ${pickup.instructionNo}"]`));
  assert.ok(dialog().textContent?.includes('自提指令详情'));
  for (const value of [pickup.expectedPickupTime, pickup.pickupContact, pickup.pickupPhone]) assert.ok(dialog().textContent?.includes(value));
  await click(button('关闭', dialog()));
  await click(tab('已完成'));
  assert.ok(headers().includes('失败原因'));
  const failures = INITIAL_INSTRUCTION_LIST_RECORDS.filter(row => row.tab === '已完成' && row.processingResult === '拦截失败');
  assert.ok(failures.length > 0);
  for (const failed of failures) {
    const row = rowFor(failed.instructionNo);
    assert.match(row.className, /bg-rose-50/);
    assert.equal(cell(row, '指令处理状态').textContent, '拦截失败');
    assert.equal(cell(row, '失败原因').textContent, failed.failureReason);
    assert.match(get('span', cell(row, '指令处理状态')).className, /text-rose-600/);
  }
  const success = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '已完成' && row.processingResult === '拦截成功')!;
  assert.ok(!rowFor(success.instructionNo).className.includes('bg-rose'));
  assert.equal(cell(rowFor(success.instructionNo), '指令处理状态').textContent, '拦截成功');
  await click(tab('处理中'));
  assert.ok(!headers().includes('失败原因'));
  for (const row of rows()) if (cell(row, '指令单类型').textContent === '拦截') assert.equal(cell(row, '指令处理状态').textContent, '待海外仓回传');
});

test('pagination retains selections across pages and CSV export contains only the selected instructions', async (t) => {
  const pending = INITIAL_INSTRUCTION_LIST_RECORDS.filter(row => row.tab === '待确认');
  assert.ok(pending.length > 11);
  await setValue(get<HTMLSelectElement>('[aria-label="指令列表每页条数"]'), '10');
  assert.equal(rows().length, 10);
  await click(get<HTMLInputElement>('[aria-label="选择本页全部指令单"]'));
  await click(get<HTMLButtonElement>('[aria-label="指令列表下一页"]'));
  assert.equal(rows().length, pending.length - 10);
  assert.equal(get<HTMLInputElement>('[aria-label="选择本页全部指令单"]').checked, false);
  await click(selectRow(0));
  assert.equal(get<HTMLInputElement>('[aria-label="选择本页全部指令单"]').indeterminate, true);
  let exported: Blob | undefined;
  let clicked = false;
  t.mock.method(URL, 'createObjectURL', (blob: Blob) => { exported = blob; return 'blob:instruction-export'; });
  t.mock.method(URL, 'revokeObjectURL', () => {});
  t.mock.method(dom.window.HTMLAnchorElement.prototype, 'click', function (this: HTMLAnchorElement) {
    clicked = true;
    assert.ok(this.download.startsWith('指令列表_待确认_'));
  });
  await click(button('导出所选'));
  assert.equal(clicked, true);
  assert.ok(exported);
  const csv = await exported.text();
  for (const record of pending.slice(0, 11)) assert.ok(csv.includes(record.instructionNo));
  assert.ok(!csv.includes(pending[11].instructionNo));
  assert.equal(csv.trim().split('\r\n').length, 12);
  assert.ok(get('[role="status"]', dom.window.document).textContent?.includes('已导出所选 11 条指令'));
  await click(get<HTMLButtonElement>('[aria-label="指令列表上一页"]'));
  assert.equal(get<HTMLInputElement>('[aria-label="选择本页全部指令单"]').checked, true);
  await click(button('取消选择'));
  assert.equal(host.querySelector('input[type="checkbox"]:checked'), null);
  await setValue(get<HTMLInputElement>('#instruction-list-page'), '2');
  await submit(get<HTMLInputElement>('#instruction-list-page').closest('form')!);
  assert.ok(rowFor(pending[10].instructionNo));
});

test('column settings persist and protect the final visible business column', async () => {
  assert.ok(!headers().includes('关联托盘'));
  await click(get<HTMLButtonElement>('[aria-label="指令列表设置"]'));
  await click(field('关联托盘') as HTMLInputElement);
  assert.ok(headers().includes('关联托盘'));
  assert.ok(JSON.parse(dom.window.localStorage.getItem(columnKey)!).includes('palletLabel'));
  await remount();
  assert.ok(headers().includes('关联托盘'));
  await click(get<HTMLButtonElement>('[aria-label="指令列表设置"]'));
  const options = [...host.querySelectorAll<HTMLInputElement>('label input[type="checkbox"]')];
  for (const option of options.slice(1)) if (option.checked) await click(option);
  assert.equal(headers().length, 4);
  assert.equal(options[0].disabled, true);
  await click(button('恢复默认'));
  assert.ok(headers().includes('指令名称'));
  assert.ok(!headers().includes('关联托盘'));
});

test('a sole failure-reason column remains visible when changing to a status without failure results', async () => {
  await click(tab('已完成'));
  await click(get<HTMLButtonElement>('[aria-label="指令列表设置"]'));
  const failureOption = field('失败原因') as HTMLInputElement;
  const options = [...host.querySelectorAll<HTMLInputElement>('label input[type="checkbox"]')];
  for (const option of options) if (option !== failureOption && option.checked) await click(option);
  assert.equal(headers().length, 4);
  assert.ok(headers().includes('失败原因'));
  assert.equal(failureOption.disabled, true);
  await click(tab('待确认'));
  assert.equal(headers().length, 4, 'at least one non-fixed business column must remain visible');
  assert.ok(headers().includes('失败原因'));
  assert.ok(rows().every(row => cell(row, '失败原因').textContent === '—'));
  const settingsButton = get<HTMLButtonElement>('[aria-label="指令列表设置"]');
  if (settingsButton.getAttribute('aria-expanded') !== 'true') await click(settingsButton);
  await click(field('指令名称') as HTMLInputElement);
  assert.ok(headers().includes('指令名称'), 'column settings must allow recovery to other business fields');
  assert.equal((field('失败原因') as HTMLInputElement).disabled, false);
  await click(field('失败原因') as HTMLInputElement);
  assert.equal(headers().length, 4);
  assert.ok(headers().includes('指令名称'));
});

test('the overseas instruction list menu preserves order, deep links, tab closing and hash navigation', async () => {
  const { default: App } = await import('./App');
  await act(async () => root.render(<App />));
  await click(button('海外中转单'));
  const sidebar = get('#ans-sidebar');
  const items = [...sidebar.querySelectorAll<HTMLButtonElement>('button')];
  const listIndex = items.findIndex(item => item.textContent === '指令列表');
  assert.ok(listIndex >= 0);
  assert.equal(items.findIndex(item => item.textContent === '指令管理'), listIndex + 1);
  assert.equal(items.findIndex(item => item.textContent === '暂存管理'), listIndex - 1);
  assert.ok(!sidebar.textContent?.includes('中转记录'));
  await click(button('指令列表', sidebar));
  assert.equal(dom.window.location.hash, '#instruction-list');
  assert.equal(get('h1').textContent, '指令列表');
  await click(get<HTMLButtonElement>('[aria-label="关闭指令列表页签"]'));
  assert.equal(dom.window.location.hash, '');
  assert.equal(host.querySelector('h1'), null);
  await act(async () => root.unmount());
  dom.window.history.replaceState(null, '', '/A--a/#instruction-list');
  root = createRoot(host);
  await act(async () => root.render(<App />));
  assert.equal(get('h1').textContent, '指令列表');
  assert.ok(button('指令列表', get('#ans-sidebar')));
  for (const [hash, title] of [['instruction-management', '指令管理'], ['staging-management', '暂存管理'], ['instruction-list', '指令列表']]) {
    dom.window.history.replaceState(null, '', `/A--a/#${hash}`);
    await act(async () => dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')));
    assert.equal(get('h1').textContent, title);
  }
  dom.window.history.replaceState(null, '', '/A--a/');
  await act(async () => dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')));
  assert.equal(host.querySelector('h1'), null);
  dom.window.history.replaceState(null, '', '/A--a/?v=instruction-list-20261019#instruction-list');
  await act(async () => dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')));
  assert.equal(get('h1').textContent, '指令列表');
  await click(button('财务管理'));
  assert.equal(dom.window.location.hash, '#finance-approval', 'finance navigation opens its own deep link');
  assert.equal(dom.window.location.pathname, '/A--a/');
  assert.equal(dom.window.location.search, '?v=instruction-list-20261019');
  assert.equal(get('h1').textContent, '指令费用审批');
  await click(button('指令费用明细', get('#ans-sidebar')));
  assert.equal(dom.window.location.hash, '#finance-fees');
  assert.equal(get('h1').textContent, '指令费用明细');
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<App />));
  assert.equal(get('h1').textContent, '指令费用明细');
  await click(button('返回指令列表', get('#ans-sidebar')));
  assert.equal(dom.window.location.hash, '#instruction-list');
});

test('the actual staging order form supports batch ordering, prevents ordered cancellation, and persists after reload', async () => {
  const { default: App } = await import('./App');
  const { loadOverseasInventory, OVERSEAS_INVENTORY_STORAGE_KEY } = await import('./components/overseas/overseasStorageInventoryData');
  const { loadListRows, readListState } = await import('./components/overseas/instructionListState');
  dom.window.localStorage.setItem('ans_instruction_management_v1', JSON.stringify({
    instructions: INITIAL_INSTRUCTIONS.map((row, index) => ({ ...row, price: 2.5, status: index === 0 ? '启用' : '停用' })), logs: [],
  }));
  dom.window.history.replaceState(null, '', '/A--a/#staging-management');
  await act(async () => root.render(<App />));
  const source = loadOverseasInventory().records.find(row => row.status === '暂存' && row.cargoBoxes.some(box => box.status === '待处理'))!;
  const sourceRow = get(`[aria-label="选择${source.id}"]`).closest('tr')!;
  await click(button('下单', sourceRow));
  await click(field('自提', dialog()) as HTMLInputElement);
  const box = source.cargoBoxes.find(box => box.status === '待处理')!;
  await click(get<HTMLInputElement>(`[aria-label="选择货箱${box.boxNo}"]`, dialog()));
  await click(button('确定', dialog()));
  const sourceState = () => JSON.parse(dom.window.localStorage.getItem(OVERSEAS_INVENTORY_STORAGE_KEY)!);
  assert.equal(sourceState().orders.length, 1);
  const firstOrderId = sourceState().orders[0].id;
  await click(button('指令列表', get('#ans-sidebar')));
  const first = loadListRows([]).find(row => row.id === 'release:' + firstOrderId)!;
  assert.ok(first);
  await click(get<HTMLInputElement>(`[aria-label="选择${first.instructionNo}"]`));
  assert.equal([...host.querySelectorAll('button')].some(item => item.textContent === '已确认'), false);
  await click(button('批量下单'));
  assert.equal(readListState().rows.find(row => row.id === first.id)?.tab, '已下单');
  assert.equal(readListState().rows.find(row => row.id === first.id)?.status, '待处理');
  const workflowTab = (name: string) => [...host.querySelectorAll<HTMLButtonElement>('main[aria-label="指令列表"] button')].find(item => item.textContent?.startsWith(name + '('))!;
  await click(workflowTab('已下单'));
  await click(get<HTMLInputElement>(`[aria-label="选择${first.instructionNo}"]`));
  assert.equal([...host.querySelectorAll('button')].some(item => item.textContent === '取消下单'), false);
  assert.equal(readListState().rows.find(row => row.id === first.id)?.tab, '已下单');
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<App />));
  await click(workflowTab('已下单'));
  assert.ok(get<HTMLInputElement>(`[aria-label="选择${first.instructionNo}"]`));
  assert.equal([...host.querySelectorAll('button')].some(item => item.textContent === '取消下单'), false);
  assert.equal(readListState().logs.length, 1, 'only ordering is logged; ordered records cannot be cancelled');
  assert.equal(sourceState().orders.length, 1, 'reloading must not duplicate the release');
  await click(workflowTab('待确认'));
  const pendingCheckboxes = [...host.querySelectorAll<HTMLInputElement>('main[aria-label="指令列表"] tbody input[type="checkbox"]')];
  const pickedNumbers = pendingCheckboxes.slice(0, 2).map(input => input.getAttribute('aria-label')!.slice(2));
  await click(pendingCheckboxes[0]);
  await click(pendingCheckboxes[1]);
  await click(button('批量驳回'));
  const rejectionDialog = get<HTMLElement>('[role="dialog"]', dom.window.document);
  await setValue(get<HTMLTextAreaElement>('#rejection-reason', rejectionDialog), '申请资料不完整，请补充后重新申请');
  await click(button('确认驳回', rejectionDialog));
  const rejected = readListState().rows.filter(row => pickedNumbers.includes(row.instructionNo));
  assert.equal(rejected.length, 2);
  assert.ok(rejected.every(row => row.tab === '驳回' && row.status === '已驳回'));
  assert.ok(rejected.every(row => row.rejectionReason === '申请资料不完整，请补充后重新申请'));
  assert.ok(readListState().rows.some(row => row.tab === '待确认'), 'unselected rows remain pending');
  assert.ok(readListState().logs.at(-1)?.action.includes('2'));
});

test('customer remarks and ordinary remarks are visible columns and customer remarks share a read-only detail row with shipment quantity', async () => {
  const target = { ...INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '待确认')!, customerRemark: '客户要求：请保持原箱包装\n轻拿轻放', remark: '仓库内部备注' };
  saveFixture([target]);
  await remount();
  assert.ok(headers().includes('客户备注'));
  assert.ok(headers().includes('备注'));
  assert.equal(cell(rowFor(target.instructionNo), '客户备注').textContent, target.customerRemark);
  assert.ok(cell(rowFor(target.instructionNo), '备注').textContent?.includes(target.remark));
  await click(get<HTMLButtonElement>(`[aria-label="查看指令 ${target.instructionNo}"]`));
  const section = get<HTMLElement>('[aria-label="运单信息"]', dialog());
  const sharedRow = get<HTMLDListElement>('dl', section);
  const fields = [...sharedRow.children];
  assert.equal(fields.length, 2, 'quantity and customer remark must occupy a dedicated shared row');
  assert.deepEqual(fields.map(item => get('dt', item).textContent), ['发货件数', '客户备注']);
  assert.equal(get('dd', fields[0]).textContent, String(target.packages));
  assert.equal(get('dd', fields[1]).textContent, target.customerRemark);
  assert.match(sharedRow.className, /grid-cols-2/);
  assert.equal(fields[1].querySelector('input, textarea, select, button, [contenteditable="true"]'), null, 'customer remarks must not expose editing controls');
  assert.ok([...dialog().querySelectorAll('dt')].some(item => item.textContent === '备注'));
  await click(button('关闭', dialog()));
  saveFixture([{ ...target, customerRemark: '' }]);
  await remount();
  await click(get<HTMLButtonElement>(`[aria-label="查看指令 ${target.instructionNo}"]`));
  const emptyRow = get<HTMLDListElement>('[aria-label="运单信息"] dl', dialog());
  assert.deepEqual([...emptyRow.querySelectorAll('dt')].map(item => item.textContent), ['发货件数', '客户备注']);
  assert.equal(get('dd', emptyRow.children[1]).textContent, '—', 'empty customer notes remain visible as a placeholder');
});

test('ordinary remark editing saves once with a log, preserves customer remarks and workflow, and survives remount', async (t) => {
  const target = { ...INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '待确认')!, customerRemark: '只读客户要求', remark: '原备注' };
  saveFixture([target]);
  await remount();
  const originalSet = dom.window.Storage.prototype.setItem;
  let writes = 0;
  t.mock.method(dom.window.Storage.prototype, 'setItem', function (this: Storage, key: string, value: string) {
    if (key === INSTRUCTION_LIST_STORAGE_KEY) writes += 1;
    originalSet.call(this, key, value);
  });
  await click(get<HTMLButtonElement>(`[aria-label="编辑备注 ${target.instructionNo}"]`));
  assert.equal(get('#instruction-list-dialog-title', dialog()).textContent, '编辑备注');
  assert.equal(field('备注', dialog()).tagName, 'TEXTAREA');
  assert.equal(field('备注', dialog()).value, target.remark);
  assert.equal(dialog().querySelectorAll('textarea').length, 1, 'only the ordinary note is editable');
  assert.equal(writes, 0, 'opening an editor must not save');
  await setValue(field('备注', dialog()), '更新后的仓库备注\n核对标签后放行');
  await click(button('保存备注', dialog()));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  assert.equal(writes, 1, 'the note and its log must use one serialized save');
  const changed = stored().records[0];
  assert.equal(changed.remark, '更新后的仓库备注\n核对标签后放行');
  assert.deepEqual({ ...changed, remark: target.remark, updated: target.updated }, target);
  assert.equal(stored().logs.length, 1);
  assert.equal(stored().logs[0].action, '修改备注');
  assert.equal(stored().logs[0].before, target.remark);
  assert.equal(stored().logs[0].after, changed.remark);
  await remount();
  assert.ok(cell(rowFor(target.instructionNo), '备注').textContent?.includes(changed.remark));
  assert.equal(cell(rowFor(target.instructionNo), '客户备注').textContent, target.customerRemark);
  await click(get<HTMLButtonElement>(`[aria-label="查看指令 ${target.instructionNo}"]`));
  assert.ok(dialog().textContent?.includes(changed.remark));
  await click(button('查看日志', dialog()));
  assert.ok(dialog().textContent?.includes('修改备注'));
  assert.ok(dialog().textContent?.includes(target.remark));
  assert.ok(dialog().textContent?.includes(changed.remark));
});

test('failed ordinary remark saves keep the draft without false success and stale notes cannot overwrite a newer edit', async (t) => {
  const target = { ...INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '待确认')!, customerRemark: '客户备注保持不变', remark: '最初备注' };
  saveFixture([target]);
  await remount();
  const initialStorage = dom.window.localStorage.getItem(INSTRUCTION_LIST_STORAGE_KEY);
  const originalSet = dom.window.Storage.prototype.setItem;
  const mockedSet = t.mock.method(dom.window.Storage.prototype, 'setItem', function (this: Storage, key: string, value: string) {
    if (key === INSTRUCTION_LIST_STORAGE_KEY) throw new Error('QuotaExceededError');
    originalSet.call(this, key, value);
  });
  await click(get<HTMLButtonElement>(`[aria-label="编辑备注 ${target.instructionNo}"]`));
  await setValue(field('备注', dialog()), '尚未成功保存的备注');
  await click(button('保存备注', dialog()));
  assert.ok(get('[role="alert"]', dialog()).textContent);
  assert.equal(field('备注', dialog()).value, '尚未成功保存的备注');
  assert.equal(dom.window.localStorage.getItem(INSTRUCTION_LIST_STORAGE_KEY), initialStorage);
  assert.equal(dom.window.document.querySelector('[role="status"]'), null);
  await click(button('返回', dialog()));
  assert.ok(cell(rowFor(target.instructionNo), '备注').textContent?.includes(target.remark));
  mockedSet.mock.restore();

  await click(get<HTMLButtonElement>(`[aria-label="编辑备注 ${target.instructionNo}"]`));
  await setValue(field('备注', dialog()), '过期窗口中的修改');
  const newer = { records: [{ ...target, remark: '另一个窗口已经更新的备注', updated: '2026-10-20 12:45:00' }], logs: [] };
  dom.window.localStorage.setItem(INSTRUCTION_LIST_STORAGE_KEY, JSON.stringify(newer));
  await click(button('保存备注', dialog()));
  assert.ok(get('[role="alert"]', dialog()).textContent);
  assert.deepEqual(stored(), newer, 'a conflicting newer note must not be overwritten or generate a success log');
  assert.equal(dom.window.document.querySelector('[role="status"]'), null);
});

test('the matching waybill customer remark takes precedence including an empty source and remains unchanged by ordinary note editing', async () => {
  const target = { ...INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '待确认')!, customerRemark: '旧指令中的客户要求', remark: '' };
  saveFixture([target]);
  const source = [{ waybillNo: target.waybill, clientRemark: '运单中的最新客户要求' }, { waybillNo: `${target.waybill}-OTHER`, clientRemark: '不能错用其他运单备注' }];
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<React.StrictMode><InstructionListPage waybills={source} /></React.StrictMode>));
  assert.equal(cell(rowFor(target.instructionNo), '客户备注').textContent, source[0].clientRemark);
  await click(get<HTMLButtonElement>(`[aria-label="编辑备注 ${target.instructionNo}"]`));
  await setValue(field('备注', dialog()), '与客户要求独立的备注');
  await click(button('保存备注', dialog()));
  assert.equal(source[0].clientRemark, '运单中的最新客户要求');
  assert.equal(cell(rowFor(target.instructionNo), '客户备注').textContent, source[0].clientRemark);
  await act(async () => root.render(<React.StrictMode><InstructionListPage waybills={[{ waybillNo: target.waybill, clientRemark: '' }]} /></React.StrictMode>));
  assert.equal(cell(rowFor(target.instructionNo), '客户备注').textContent, '—', 'an explicitly empty source must not revive an old customer note');
  await click(get<HTMLButtonElement>(`[aria-label="查看指令 ${target.instructionNo}"]`));
  const customerCell = get('[aria-label="运单信息"] dl', dialog()).children[1];
  assert.equal(get('dd', customerCell).textContent, '—');
});

test('existing column preferences gain both remark fields once and later user choices remain respected', async () => {
  dom.window.localStorage.setItem(columnKey, JSON.stringify(['names', 'packages']));
  await remount();
  for (const label of ['指令名称', '发货件数', '客户备注', '备注']) assert.ok(headers().includes(label));
  assert.ok(!headers().includes('指令费用'), 'migration must preserve the existing choice of other hidden fields');
  await click(get<HTMLButtonElement>('[aria-label="指令列表设置"]'));
  await click(field('客户备注') as HTMLInputElement);
  await click(field('备注') as HTMLInputElement);
  assert.ok(!headers().includes('客户备注'));
  assert.ok(!headers().includes('备注'));
  await remount();
  assert.ok(!headers().includes('客户备注'), 'the one-time migration must not reverse an intentional hide on reload');
  assert.ok(!headers().includes('备注'));
  assert.ok(headers().includes('发货件数'));
});
