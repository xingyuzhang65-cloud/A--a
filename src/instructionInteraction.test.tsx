import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act } from 'react';
import type { Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import InstructionManagement from './components/InstructionManagement';
import { INITIAL_INSTRUCTIONS } from './instructionData';
import { loadInstructionCatalog } from './components/overseas/instructionManagementCatalog';

const storageKey = 'ans_instruction_management_v1';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:4205/A--a/', pretendToBeVisual: true });
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
let createRoot: typeof import('react-dom/client')['createRoot'];
let root: Root;
let host: HTMLDivElement;
let exportedBlob: Blob | null;

before(async () => {
  const values = {
    window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
    navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, SVGElement: dom.window.SVGElement,
    Element: dom.window.Element, Node: dom.window.Node, requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
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
  await act(async () => root.render(<React.StrictMode><InstructionManagement /></React.StrictMode>));
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
    text.querySelectorAll('input, select, textarea').forEach(control => control.remove());
    return text.textContent?.replace('*', '').trim() === label;
  });
  assert.ok(wrapper, `Missing label: ${label}`);
  return get('input, select, textarea', wrapper);
}

async function click(element: HTMLElement) {
  await act(async () => element.click());
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

async function submit(form: HTMLFormElement) {
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
}

function rows() { return [...host.querySelectorAll('tbody tr')]; }
function dialog() { return get<HTMLElement>('[role="dialog"]', dom.window.document); }
function storedData() { return JSON.parse(dom.window.localStorage.getItem(storageKey)!); }

test('query applies combined filters on submit, empty results disable export, reset restores all rows', async () => {
  const form = get<HTMLFormElement>('form');
  await setValue(field('费用代码', form), ' fy202609 ');
  await setValue(field('费用类型', form), '销毁费');
  assert.equal(rows().length, 20);
  await submit(form);
  assert.equal(rows().length, 2);
  assert.ok(rows().every(row => row.textContent?.includes('销毁费')));
  await setValue(field('状态', form), '停用');
  await submit(form);
  assert.ok(host.textContent?.includes('暂无符合条件的费用指令'));
  assert.equal(button('导出').disabled, true);
  await click(button('重置'));
  assert.equal(rows().length, 20);
  assert.equal(button('导出').disabled, false);
});

test('page selection is retained across pages and export contains only selected records', async (t) => {
  exportedBlob = null;
  t.mock.method(URL, 'createObjectURL', (blob: Blob) => { exportedBlob = blob; return 'blob:instruction-test'; });
  t.mock.method(URL, 'revokeObjectURL', () => {});
  t.mock.method(dom.window.HTMLAnchorElement.prototype, 'click', () => {});
  await setValue(get<HTMLSelectElement>('[aria-label="每页条数"]'), '10');
  assert.equal(rows().length, 10);
  await click(get<HTMLInputElement>('[aria-label="选择本页全部指令"]'));
  await click(get<HTMLButtonElement>('[aria-label="下一页"]'));
  assert.equal(rows().length, 10);
  assert.ok(!get<HTMLInputElement>('[aria-label="选择本页全部指令"]').checked);
  await click(get<HTMLInputElement>('tbody input[type="checkbox"]'));
  assert.ok(get<HTMLInputElement>('[aria-label="选择本页全部指令"]').indeterminate);
  await click(button('导出所选'));
  assert.ok(exportedBlob);
  const csv = await exportedBlob.text();
  assert.equal(csv.trim().split('\r\n').length, 12);
  assert.ok(csv.includes('FY20261010209'));
  assert.ok(csv.includes('FY20260820028'));
  assert.ok(!csv.includes('FY20260820027'));
  await click(get<HTMLButtonElement>('[aria-label="上一页"]'));
  assert.ok(get<HTMLInputElement>('[aria-label="选择本页全部指令"]').checked);
  await click(button('取消选择'));
  assert.ok(!get<HTMLInputElement>('[aria-label="选择本页全部指令"]').checked);
});

test('editing saves status and decimal amounts with one audit log and restores them on remount', async () => {
  const editButton = get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]');
  editButton.focus();
  await click(editButton);
  await setValue(field('费用名称', dialog()), '开箱服务');
  await click(button('取消', dialog()));
  assert.equal(dom.window.localStorage.getItem(storageKey), null);
  await click(editButton);
  await setValue(field('成本单价（元）', dialog()), '1.25');
  await setValue(field('状态', dialog()), '停用');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  assert.equal(storedData().instructions[0].cost, 1.25);
  assert.equal(storedData().instructions[0].status, '停用');
  assert.equal(storedData().logs.length, 1);
  assert.equal(storedData().logs[0].changes.length, 2);
  await click(get<HTMLButtonElement>('[aria-label="查看 开箱费（仅开箱） 日志"]'));
  assert.ok(dialog().textContent?.includes('成本单价（元）'));
  assert.ok(dialog().textContent?.includes('1.25'));
  assert.ok(dialog().textContent?.includes('停用'));
  await click(button('关闭', dialog()));
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<InstructionManagement />));
  assert.ok(rows()[0].textContent?.includes('1.25'));
  assert.ok(rows()[0].textContent?.includes('停用'));
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(storedData().logs.length, 1, 'unchanged submissions must not add audit logs');
});

test('changing the last record of a fee type keeps that type available for restoring the record', async () => {
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  await setValue(field('费用类型', dialog()), '拍照费');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.ok([...get<HTMLSelectElement>('form select').options].some(option => option.value === '开箱费'));
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  const type = field('费用类型', dialog()) as HTMLSelectElement;
  assert.ok([...type.options].some(option => option.value === '开箱费'));
  await setValue(type, '开箱费');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(storedData().instructions[0].type, '开箱费');
});

test('column choices persist and the last remaining column cannot be hidden', async () => {
  await click(get<HTMLButtonElement>('[aria-label="列设置"]'));
  let options = [...host.querySelectorAll<HTMLInputElement>('label input[type="checkbox"]')];
  for (const option of options.slice(1)) await click(option);
  assert.equal(host.querySelectorAll('thead th').length, 3);
  assert.equal(options[0].disabled, true);
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<InstructionManagement />));
  assert.equal(host.querySelectorAll('thead th').length, 3);
  await click(get<HTMLButtonElement>('[aria-label="列设置"]'));
  await click(button('恢复默认'));
  assert.equal(host.querySelectorAll('thead th').length, 13);
});

test('failed storage writes keep the edit open and do not change rows or logs', async (t) => {
  t.mock.method(dom.window.Storage.prototype, 'setItem', () => { throw new Error('QuotaExceededError'); });
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  await setValue(field('计费单价（元）', dialog()), '8.8');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.ok(get('[role="alert"]', dialog()).textContent?.includes('本地存储空间不足'));
  assert.equal(dom.window.localStorage.getItem(storageKey), null);
  await click(button('取消', dialog()));
  assert.ok(!rows()[0].textContent?.includes('8.80'));
});

test('Escape closes dialogs and restores keyboard focus to the originating row action', async () => {
  const edit = get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]');
  edit.focus();
  await click(edit);
  assert.ok(dialog().contains(dom.window.document.activeElement));
  await act(async () => dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  assert.equal(dom.window.document.activeElement, edit);
});

test('business settings link the PDA radios, cancel safely and save readable changes that survive reload', async () => {
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  assert.ok(get<HTMLInputElement>('[aria-label="操作指令"]', dialog()).checked);
  assert.ok(get<HTMLInputElement>('[aria-label="需要PDA操作"]', dialog()).checked);
  await click(get<HTMLInputElement>('[aria-label="纯费用"]', dialog()));
  assert.ok(get<HTMLInputElement>('[aria-label="不需要PDA操作"]', dialog()).checked);
  assert.ok(get<HTMLInputElement>('[aria-label="需要PDA操作"]', dialog()).disabled);
  await click(button('取消', dialog()));
  assert.equal(localStorage.getItem(storageKey), null);
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  await click(get<HTMLInputElement>('[aria-label="纯费用"]', dialog()));
  await submit(get<HTMLFormElement>('form', dialog()));
  const saved = storedData();
  assert.equal(saved.instructions[0].businessAttribute, '纯费用');
  assert.equal(saved.instructions[0].requiresPda, false);
  assert.equal(saved.instructions[0].type, INITIAL_INSTRUCTIONS[0].type);
  assert.deepEqual(saved.logs[0].changes, [
    { field: '业务属性', before: '操作指令', after: '纯费用' },
    { field: '是否需要PDA操作', before: '需要', after: '不需要' },
  ]);
  assert.match(rows()[0].textContent!, /纯费用不需要/);
  assert.equal(loadInstructionCatalog()[0].requiresPda, false);
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(<InstructionManagement />));
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  assert.ok(get<HTMLInputElement>('[aria-label="纯费用"]', dialog()).checked);
  assert.ok(get<HTMLInputElement>('[aria-label="不需要PDA操作"]', dialog()).checked);
  await click(get<HTMLInputElement>('[aria-label="操作指令"]', dialog()));
  assert.equal(get<HTMLInputElement>('[aria-label="需要PDA操作"]', dialog()).disabled, false);
  assert.ok(get<HTMLInputElement>('[aria-label="需要PDA操作"]', dialog()).checked);
  await click(get<HTMLInputElement>('[aria-label="不需要PDA操作"]', dialog()));
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(storedData().instructions[0].businessAttribute, '操作指令');
  assert.equal(storedData().instructions[0].requiresPda, false);
});

test('business and PDA filters combine with fee type, preserve explicit no-PDA operations and reset together', async () => {
  const instructions = INITIAL_INSTRUCTIONS.map((row, index) => index === 0 ? { ...row, businessAttribute: '纯费用', requiresPda: false }
    : index === 1 ? { ...row, requiresPda: false } : row);
  localStorage.setItem(storageKey, JSON.stringify({ instructions, logs: [] }));
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(<InstructionManagement />));
  const form = get<HTMLFormElement>('form');
  await setValue(field('业务属性', form), '操作指令');
  await setValue(field('是否需要PDA操作', form), 'false');
  assert.equal(rows().length, 20);
  await submit(form);
  assert.equal(rows().length, 1); assert.match(rows()[0].textContent!, /重新包装费-多个产品/);
  await setValue(field('业务属性', form), '纯费用'); await setValue(field('费用类型', form), '开箱费'); await submit(form);
  assert.equal(rows().length, 1); assert.match(rows()[0].textContent!, /开箱费（仅开箱）/);
  await setValue(field('是否需要PDA操作', form), 'true'); await submit(form);
  assert.match(host.textContent!, /暂无符合条件/);
  await click(button('重置')); assert.equal(rows().length, 20);
  assert.equal(field('业务属性', form).value, ''); assert.equal(field('是否需要PDA操作', form).value, '');
});

test('legacy fee data and column choices gain the new settings once without losing values or later visibility choices', async () => {
  const { businessAttribute, requiresPda, ...legacy } = { ...INITIAL_INSTRUCTIONS[0], price: 12.5, cost: 8.25, description: '保留历史配置' };
  localStorage.setItem(storageKey, JSON.stringify({ instructions: [legacy], logs: [] }));
  localStorage.setItem('ans_instruction_columns_v1', JSON.stringify(['code', 'description']));
  localStorage.removeItem('ans_instruction_columns_business_v1');
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(<InstructionManagement />));
  assert.deepEqual([...host.querySelectorAll('thead th')].map(th => th.textContent), ['', '费用代码', '业务属性', '是否需要PDA操作', '描述', '操作']);
  assert.match(rows()[0].textContent!, /操作指令需要保留历史配置/);
  await click(get<HTMLButtonElement>('[aria-label="编辑 开箱费（仅开箱）"]'));
  assert.equal(field('计费单价（元）', dialog()).value, '12.5');
  assert.equal(field('成本单价（元）', dialog()).value, '8.25');
  await submit(get<HTMLFormElement>('form', dialog()));
  assert.equal(storedData().logs.length, 0, 'migration alone must not create a user edit');
  await click(get<HTMLButtonElement>('[aria-label="列设置"]'));
  const option = [...host.querySelectorAll('label')].find(label => label.textContent?.trim() === '业务属性')!;
  await click(get<HTMLInputElement>('input', option));
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(<InstructionManagement />));
  assert.equal([...host.querySelectorAll('thead th')].some(th => th.textContent === '业务属性'), false);
  assert.ok([...host.querySelectorAll('thead th')].some(th => th.textContent === '是否需要PDA操作'));
});

test('the overseas menu and direct link open instruction management and closing its tab returns to waybills', async () => {
  const { default: App } = await import('./App');
  await act(async () => root.render(<App />));
  await click(button('海外中转单'));
  await click(button('费用管理'));
  assert.ok(get('h1').textContent?.includes('费用管理'));
  assert.equal(dom.window.location.hash, '#instruction-management');
  await click(get<HTMLButtonElement>('[aria-label="关闭费用管理页签"]'));
  assert.equal(dom.window.location.hash, '');
  assert.equal(host.querySelector('h1'), null);
  await act(async () => root.unmount());
  dom.window.history.replaceState(null, '', '/A--a/#instruction-management');
  root = createRoot(host);
  await act(async () => root.render(<App />));
  assert.ok(get('h1').textContent?.includes('费用管理'));
  assert.equal(rows().length, 20);
  assert.ok(button('费用管理', get('#ans-sidebar')));
});
