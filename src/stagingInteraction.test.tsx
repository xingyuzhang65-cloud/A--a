import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act } from 'react';
import type { Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import StagingManagement from './components/StagingManagement';
import { INITIAL_INSTRUCTIONS } from './instructionData';
import { INITIAL_STAGING_RECORDS } from './stagingData';

const storageKey = 'ans_staging_management_v1';
const columnKey = 'ans_staging_columns_v1';
const first = INITIAL_STAGING_RECORDS[0];
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
  await act(async () => root.render(<React.StrictMode><StagingManagement /></React.StrictMode>));
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
  const item = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(item => item.textContent?.startsWith(label));
  assert.ok(item, `Missing status tab: ${label}`);
  return item;
}

async function click(element: HTMLElement) { await act(async () => element.click()); }

async function setValue(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  const prototype = element.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype
    : element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
  await act(async () => {
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    element.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
}

async function submit(form: HTMLFormElement) {
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
}

async function remount() {
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<React.StrictMode><StagingManagement /></React.StrictMode>));
}

function rows() { return [...host.querySelectorAll('tbody tr')]; }
function dialog() { return get<HTMLElement>('[role="dialog"]', dom.window.document); }
function stored() { return JSON.parse(dom.window.localStorage.getItem(storageKey)!); }
function summary() { return get('[aria-label="已选库存汇总"]').textContent || ''; }
function selectRow(index: number) { return get<HTMLInputElement>('input[type="checkbox"]', rows()[index]); }
function openFirstOrder() { return click(get<HTMLButtonElement>(`[aria-label="下单 ${first.palletLabel}"]`)); }

test('search applies combined criteria on submit and state tabs reflect the filtered inventory', async () => {
  assert.equal(rows().length, 13);
  assert.equal(tab('暂存').textContent, '暂存13');
  assert.equal(tab('指令处理完成').textContent, '指令处理完成，待出库3');
  assert.equal(tab('已出库').textContent, '已出库2');
  await setValue(field('关键字'), ' test0280745 ');
  await setValue(field('客户名称'), 'TTTX');
  assert.equal(rows().length, 13, 'draft criteria must not immediately filter inventory');
  await submit(get<HTMLFormElement>('form'));
  assert.equal(rows().length, 2);
  assert.ok(rows().every(row => row.textContent?.includes('TEST0280745')));
  assert.equal(tab('暂存').textContent, '暂存2');
  assert.equal(tab('已出库').textContent, '已出库0');
  await click(tab('已出库'));
  assert.ok(host.textContent?.includes('暂无符合条件的库存记录'));
  assert.equal(button('导出').disabled, true);
  await click(tab('暂存'));
  await click(button('重置'));
  assert.equal(rows().length, 13);
  await setValue(field('客户名称'), 'FA102');
  await submit(get<HTMLFormElement>('form'));
  assert.equal(rows().length, 1);
  await click(tab('指令处理完成'));
  assert.equal(rows().length, 1);
  assert.ok(rows()[0].textContent?.includes('LAX9'));
});

test('selection totals count shared containers once and retain checked rows across pages', async () => {
  await click(selectRow(0));
  await click(selectRow(1));
  assert.ok(summary().includes('总托盘数：2'));
  assert.ok(summary().includes('总箱数：4'));
  assert.ok(summary().includes('总柜数：1'));
  assert.ok(summary().includes('总重量：160 kg'));
  assert.ok(summary().includes('总体积：0.144 m³'));
  await setValue(get<HTMLSelectElement>('[aria-label="暂存每页条数"]'), '10');
  assert.equal(rows().length, 10);
  await click(get<HTMLInputElement>('[aria-label="选择本页全部暂存记录"]'));
  assert.ok(summary().includes('总托盘数：10'));
  await click(get<HTMLButtonElement>('[aria-label="暂存下一页"]'));
  assert.equal(rows().length, 3);
  assert.equal(get<HTMLInputElement>('[aria-label="选择本页全部暂存记录"]').checked, false);
  await click(selectRow(0));
  assert.equal(get<HTMLInputElement>('[aria-label="选择本页全部暂存记录"]').indeterminate, true);
  assert.ok(summary().includes('总托盘数：11'));
  assert.ok(summary().includes('总箱数：31'));
  assert.ok(summary().includes('总柜数：6'));
  await click(get<HTMLButtonElement>('[aria-label="暂存上一页"]'));
  assert.equal(get<HTMLInputElement>('[aria-label="选择本页全部暂存记录"]').checked, true);
  await click(button('取消选择'));
  assert.ok(summary().includes('总托盘数：0'));
  assert.equal(get<HTMLInputElement>('[aria-label="选择本页全部暂存记录"]').checked, false);
  await click(selectRow(0));
  await click(tab('指令处理完成'));
  assert.ok(summary().includes('总托盘数：0'), 'status changes must clear hidden selections');
});

test('zero box quantities remain visible and small volumes retain their precision in rows and totals', async () => {
  dom.window.localStorage.setItem(storageKey, JSON.stringify({
    records: [{ ...first, volume: 0.000001, pendingBoxes: 2, unshippedBoxes: 0, shippedBoxes: 0 }], logs: [], orders: [],
  }));
  await remount();
  const headers = [...host.querySelectorAll('thead th')];
  const cell = (label: string) => rows()[0].querySelectorAll('td')[headers.findIndex(header => header.textContent === label)];
  assert.equal(cell('未发货箱数').textContent, '0');
  assert.equal(cell('已发货箱数').textContent, '0');
  assert.equal(cell('体积（m³）').textContent, '0.000001');
  await click(selectRow(0));
  assert.ok(summary().includes('总体积：0.000001 m³'));
});

test('moving selected pallets saves records and one log per change atomically and survives remount', async (t) => {
  const originalSet = dom.window.Storage.prototype.setItem;
  let writes = 0;
  t.mock.method(dom.window.Storage.prototype, 'setItem', function (this: Storage, key: string, value: string) {
    if (key === storageKey) writes += 1;
    originalSet.call(this, key, value);
  });
  await click(selectRow(0));
  await click(selectRow(1));
  await click(button('更换库位'));
  await setValue(field('新库位', dialog()), ' C-02-08 ');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  assert.equal(writes, 1, 'records and logs must be committed together');
  assert.equal(stored().records[0].location, 'C-02-08');
  assert.equal(stored().records[1].location, 'C-02-08');
  assert.equal(stored().records[2].location, INITIAL_STAGING_RECORDS[2].location);
  assert.equal(stored().logs.length, 2);
  assert.equal(new Set(stored().logs.map((log: { recordId: string }) => log.recordId)).size, 2);
  await click(button('更换库位'));
  await setValue(field('新库位', dialog()), 'C-02-08');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(writes, 1, 'moving to an unchanged location must not append duplicate logs');
  await remount();
  await click(get<HTMLButtonElement>(`[aria-label="查看托盘日志 ${first.palletLabel}"]`));
  assert.ok(dialog().textContent?.includes('更换库位'));
  assert.ok(dialog().textContent?.includes(`${first.location} → C-02-08`));
});

test('failed location storage writes leave the dialog open and do not update records or logs', async (t) => {
  t.mock.method(dom.window.Storage.prototype, 'setItem', () => { throw new Error('QuotaExceededError'); });
  await click(selectRow(0));
  await click(button('更换库位'));
  await setValue(field('新库位', dialog()), 'FAILED-01');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.ok(get('[role="alert"]', dialog()).textContent?.includes('本地存储不可用或空间不足'));
  assert.equal(dom.window.localStorage.getItem(storageKey), null);
  await click(button('取消', dialog()));
  await click(button('更换库位'));
  assert.ok(dialog().textContent?.includes(first.location));
  assert.ok(!dialog().textContent?.includes('FAILED-01'));
  await click(button('取消', dialog()));
  await click(get<HTMLButtonElement>(`[aria-label="查看托盘日志 ${first.palletLabel}"]`));
  assert.ok(dialog().textContent?.includes('暂无操作日志'));
});

test('orders use enabled fee instructions with saved prices and persist the order and audit log', async (t) => {
  const instructions = INITIAL_INSTRUCTIONS.map((item, index) => ({ ...item, price: index === 0 ? 2.5 : item.price, status: index === 0 ? '启用' : '停用' }));
  dom.window.localStorage.setItem('ans_instruction_management_v1', JSON.stringify({ instructions, logs: [] }));
  const originalSet = dom.window.Storage.prototype.setItem;
  let writes = 0;
  t.mock.method(dom.window.Storage.prototype, 'setItem', function (this: Storage, key: string, value: string) {
    if (key === storageKey) writes += 1;
    originalSet.call(this, key, value);
  });
  await openFirstOrder();
  const select = field('费用指令', dialog()) as HTMLSelectElement;
  assert.equal(select.options.length, 1);
  assert.equal(select.value, INITIAL_INSTRUCTIONS[0].id);
  assert.ok(dialog().textContent?.includes('2.50 美元'));
  await setValue(field('指令数量', dialog()), '3.5');
  await setValue(field('作业备注', dialog()), ' 检查包装后重新封箱 ');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(writes, 1);
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  assert.equal(stored().orders.length, 1);
  assert.equal(stored().orders[0].recordId, first.id);
  assert.equal(stored().orders[0].instructionId, INITIAL_INSTRUCTIONS[0].id);
  assert.equal(stored().orders[0].price, 2.5);
  assert.equal(stored().orders[0].quantity, 3.5);
  assert.equal(stored().orders[0].remark, '检查包装后重新封箱');
  assert.equal(stored().logs.length, 1);
  assert.equal(stored().logs[0].action, '创建指令');
  await remount();
  await click(get<HTMLButtonElement>(`[aria-label="查看托盘日志 ${first.palletLabel}"]`));
  assert.ok(dialog().textContent?.includes('2.50 USD'));
  assert.ok(dialog().textContent?.includes('3.5 箱'));
  assert.ok(dialog().textContent?.includes('检查包装后重新封箱'));
  await click(button('关闭', dialog()));
  await openFirstOrder();
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(stored().orders.length, 2, 'remount must preserve the previous order when appending');
  assert.equal(stored().logs.length, 2);
});

test('unavailable fee instructions disable ordering and failed writes preserve the unsaved order', async (t) => {
  dom.window.localStorage.setItem('ans_instruction_management_v1', JSON.stringify({ instructions: INITIAL_INSTRUCTIONS.map(item => ({ ...item, status: '停用' })), logs: [] }));
  await openFirstOrder();
  assert.equal(button('提交指令', dialog()).disabled, true);
  assert.equal(get<HTMLAnchorElement>('a', dialog()).hash, '#instruction-management');
  await click(button('取消', dialog()));
  dom.window.localStorage.removeItem('ans_instruction_management_v1');
  await openFirstOrder();
  await setValue(field('指令数量', dialog()), '0');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.ok(get('[role="alert"]', dialog()).textContent?.includes('必须大于 0'));
  assert.equal(dom.window.localStorage.getItem(storageKey), null);
  await setValue(field('指令数量', dialog()), '2');
  await setValue(field('作业备注', dialog()), '待保存的要求');
  t.mock.method(dom.window.Storage.prototype, 'setItem', () => { throw new Error('QuotaExceededError'); });
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.ok(get('[role="alert"]', dialog()).textContent?.includes('本地存储不可用或空间不足'));
  assert.equal(field('作业备注', dialog()).value, '待保存的要求');
  assert.equal(dom.window.localStorage.getItem(storageKey), null);
});

test('dispatched inventory disables order creation and location changes while preserving readable logs', async () => {
  await click(tab('已出库'));
  assert.equal(rows().length, 2);
  const orderButtons = [...host.querySelectorAll<HTMLButtonElement>('tbody button[aria-label^="下单 "]')];
  assert.equal(orderButtons.length, 2);
  assert.ok(orderButtons.every(item => item.disabled));
  await click(selectRow(0));
  assert.equal(button('更换库位').disabled, true);
  await click(orderButtons[0]);
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  await click(get<HTMLButtonElement>('tbody button[aria-label^="查看托盘日志 "]'));
  assert.ok(dialog().textContent?.includes('暂无操作日志'));
});

test('column choices can show locations and persist on remount without hiding the final column', async () => {
  assert.ok(![...host.querySelectorAll('thead th')].some(item => item.textContent === '库位'));
  await click(get<HTMLButtonElement>('[aria-label="暂存列设置"]'));
  await click(field('库位') as HTMLInputElement);
  assert.ok([...host.querySelectorAll('thead th')].some(item => item.textContent === '库位'));
  assert.ok(rows()[0].textContent?.includes(first.location));
  assert.ok(JSON.parse(dom.window.localStorage.getItem(columnKey)!).includes('location'));
  await remount();
  assert.ok([...host.querySelectorAll('thead th')].some(item => item.textContent === '库位'));
  await click(get<HTMLButtonElement>('[aria-label="暂存列设置"]'));
  const options = [...host.querySelectorAll<HTMLInputElement>('label input[type="checkbox"]')];
  for (const option of options.slice(1)) if (option.checked) await click(option);
  assert.equal(host.querySelectorAll('thead th').length, 4);
  assert.equal(options[0].disabled, true);
  await click(button('恢复默认'));
  assert.equal(host.querySelectorAll('thead th').length, 19);
  assert.ok(![...host.querySelectorAll('thead th')].some(item => item.textContent === '库位'));
});

test('the overseas menu hides transit history and supports staging deep links, close tabs, and hash changes', async () => {
  const { default: App } = await import('./App');
  await act(async () => root.render(<App />));
  await click(button('海外中转单'));
  const sidebar = get('#ans-sidebar');
  assert.ok(!sidebar.textContent?.includes('中转记录'));
  const items = [...sidebar.querySelectorAll<HTMLButtonElement>('button')];
  assert.equal(items.findIndex(item => item.textContent === '暂存管理'), items.findIndex(item => item.textContent === '指令管理') + 1);
  await click(button('暂存管理', sidebar));
  assert.equal(get('h1').textContent, '暂存管理');
  assert.equal(dom.window.location.hash, '#staging-management');
  await click(get<HTMLButtonElement>('[aria-label="关闭暂存管理页签"]'));
  assert.equal(dom.window.location.hash, '');
  assert.equal(host.querySelector('h1'), null);
  await act(async () => root.unmount());
  dom.window.history.replaceState(null, '', '/A--a/#staging-management');
  root = createRoot(host);
  await act(async () => root.render(<App />));
  assert.equal(get('h1').textContent, '暂存管理');
  assert.equal(rows().length, 13);
  assert.ok(button('暂存管理', get('#ans-sidebar')), 'overseas group must initially expand for a deep link');
  dom.window.history.replaceState(null, '', '/A--a/#instruction-management');
  await act(async () => dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')));
  assert.equal(get('h1').textContent, '指令管理');
  dom.window.history.replaceState(null, '', '/A--a/#staging-management');
  await act(async () => dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')));
  assert.equal(get('h1').textContent, '暂存管理');
  dom.window.history.replaceState(null, '', '/A--a/');
  await act(async () => dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange')));
  assert.equal(host.querySelector('h1'), null);
});
