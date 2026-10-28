import assert from 'node:assert/strict';
import { before, beforeEach, afterEach, after, test } from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import type { Root } from 'react-dom/client';
import InstructionList from './components/overseas/InstructionListPage';
import { LIST_STATE_KEY } from './components/overseas/instructionListState';

const dom = new JSDOM('<html><body></body></html>', { url: 'http://localhost/A--a/' });
const originals = new Map<string, PropertyDescriptor | undefined>();
let createRoot: typeof import('react-dom/client')['createRoot'];
let host: HTMLDivElement;
let root: Root;
let failWrites = false;
const storage = { getItem: (key: string) => dom.window.localStorage.getItem(key), setItem: (key: string, value: string) => {
  if (failWrites && key === LIST_STATE_KEY) throw new Error('disk full');
  dom.window.localStorage.setItem(key, value);
} };
before(async () => {
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
    navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element,
    Node: dom.window.Node, localStorage: storage, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  ({ createRoot } = await import('react-dom/client'));
});
beforeEach(async () => {
  failWrites = false; dom.window.localStorage.clear();
  host = dom.window.document.createElement('div'); document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<InstructionList />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
after(() => {
  dom.window.close();
  for (const [key, value] of originals) {
    if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key);
  }
});
const btn = (text: string) => {
  const found = [...document.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent?.trim() === text);
  assert.ok(found, text); return found;
};
const click = async (el: HTMLElement) => { await act(async () => el.click()); };
const setReason = async (value: string) => {
  const input = document.querySelector<HTMLTextAreaElement>('#rejection-reason')!;
  assert.ok(input);
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
};
const saved = () => JSON.parse(dom.window.localStorage.getItem(LIST_STATE_KEY) || 'null');
const selectRows = async (count: number) => {
  const checks = [...host.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]')];
  for (const check of checks.slice(0, count)) await click(check);
};
test('rejection requires a reason, persists it only to selected records and shows its exclusive column after reload', async () => {
  assert.equal(host.textContent?.includes('驳回原因'), false);
  await click(btn('批量驳回'));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  await selectRows(2); await click(btn('批量驳回'));
  assert.ok(document.querySelector('[role="dialog"]'));
  await setReason('   '); await click(btn('确认驳回'));
  assert.match(document.querySelector('[role="alert"]')!.textContent!, /请填写/);
  assert.equal(saved(), null);
  await setReason('  货件资料不完整\n请补充标签  '); await click(btn('确认驳回'));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  const state = saved();
  const changed = state.rows.filter((r: any) => r.rejectionReason);
  assert.equal(changed.length, 2);
  assert.ok(changed.every((r: any) => r.tab === '驳回' && r.status === '已驳回' && r.rejectionReason === '货件资料不完整\n请补充标签'));
  assert.ok(state.rows.some((r: any) => r.tab === '待确认' && !r.rejectionReason));
  assert.equal(state.logs.at(-1).rejectionReason, changed[0].rejectionReason);
  assert.equal(state.logs.at(-1).ids.length, 2);
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(<InstructionList />));
  await click(btn(`驳回(${state.rows.filter((r: any) => r.tab === '驳回').length})`));
  assert.ok([...host.querySelectorAll('th')].some(th => th.textContent === '驳回原因'));
  assert.equal([...host.querySelectorAll('td')].filter(td => td.textContent === '货件资料不完整\n请补充标签').length, 2);
  await click(btn(`全部(${state.rows.length})`));
  assert.equal([...host.querySelectorAll('th')].some(th => th.textContent === '驳回原因'), false);
});
test('cancelling rejection leaves workflow unchanged and a failed save keeps the reason and selection for retry', async () => {
  await selectRows(1); await click(btn('批量驳回')); await setReason('取消前的草稿'); await click(btn('取消'));
  assert.equal(saved(), null);
  assert.ok(host.querySelector<HTMLInputElement>('tbody input[type="checkbox"]')!.checked);
  await click(btn('批量驳回')); await setReason('请修正预约日期'); failWrites = true;
  await click(btn('确认驳回'));
  assert.equal(saved(), null);
  assert.equal(document.querySelector<HTMLTextAreaElement>('textarea')!.value, '请修正预约日期');
  assert.match(document.querySelector('[role="alert"]')!.textContent!, /保存失败/);
  failWrites = false; await click(btn('确认驳回'));
  assert.equal(saved().rows.filter((r: any) => r.rejectionReason === '请修正预约日期').length, 1);
});
