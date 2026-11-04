import assert from 'node:assert/strict';
import { test,before,beforeEach,afterEach,after } from 'node:test';
import React,{act} from 'react';
import { JSDOM } from 'jsdom';
import type {Root} from 'react-dom/client';
import FinancePage from './FinancePage';
import { loadFinanceRecords, FINANCE_KEY } from './financeData';
import { INSTRUCTION_DETAIL_STORAGE_KEY } from '../overseas/instructionDetailStore';
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost:4205/A--a/'}),originals=new Map<string,PropertyDescriptor|undefined>();
let createRoot:typeof import('react-dom/client')['createRoot'],root:Root,host:HTMLDivElement;
before(async()=>{for(const [k,v] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,Node:dom.window.Node,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true})){originals.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});}({createRoot}=await import('react-dom/client'));});
beforeEach(async()=>{localStorage.clear();host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(<FinancePage/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
after(()=>{dom.window.close();for(const [k,v] of originals){if(v)Object.defineProperty(globalThis,k,v);else Reflect.deleteProperty(globalThis,k);}});
const btn=(text:string,scope:ParentNode=document)=>{const button=[...scope.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===text);assert.ok(button,`button ${text}`);return button;};
const click=async(el:HTMLElement)=>{await act(async()=>el.click());};
const input=async(label:string,value:string)=>{const el=document.querySelector<HTMLInputElement|HTMLTextAreaElement>(`[aria-label="${label}"]`);assert.ok(el,label);await act(async()=>{const prototype=el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value')!.set!.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});};
const submit=async()=>{const form=document.querySelector('.fin-modal form')!;assert.ok(form);await act(async()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));};
test('batch rejection enforces a reason, persists only selected instructions, and survives reload',async()=>{
  const checks=host.querySelectorAll<HTMLInputElement>('tbody input[type=checkbox]');await click(checks[0]);await click(checks[1]);
  await click(btn('批量驳回'));await click(btn('确认驳回'));assert.match(document.querySelector('[role=alert]')!.textContent!,/请填写/);assert.equal(localStorage.getItem(FINANCE_KEY),null);
  await input('审批意见','数量有误，请核实');await click(btn('确认驳回'));
  const data=JSON.parse(localStorage.getItem(FINANCE_KEY)!);assert.equal(Object.keys(data).length,2);assert.ok(Object.values(data).every((v:any)=>v.status==='已驳回'&&v.logs[0].note==='数量有误，请核实'));
  await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<FinancePage/>));
  const tab=[...host.querySelectorAll<HTMLElement>('[role=tab]')].find(el=>el.textContent?.startsWith('已驳回'))!;await click(tab);assert.equal(host.querySelectorAll('tbody tr').length,Math.min(10,loadFinanceRecords().filter(r=>r.status==='已驳回').length));
});
test('adding an extra fee updates the source total and resets an approved bill for review',async()=>{
  const first=loadFinanceRecords().find(r=>r.status==='待审批')!;await click(btn('审批'));await click(btn('审批通过',document.querySelector('.fin-drawer')!));await click(btn('确认通过'));
  assert.equal(loadFinanceRecords().find(r=>r.row.instructionNo===first.row.instructionNo)!.status,'已通过');
  await click(btn('追加费用'));await input('费用名称','额外开箱费');await input('费用单价','10.5');await input('费用数量','2');await input('费用备注','客户要求额外开箱核对');await submit();
  const updated=loadFinanceRecords().find(r=>r.row.instructionNo===first.row.instructionNo)!;assert.equal(updated.total,first.total!+21);assert.equal(updated.status,'待审批');assert.ok(localStorage.getItem(INSTRUCTION_DETAIL_STORAGE_KEY));assert.ok(updated.fees.some(f=>f.id.startsWith('finance-extra:')));
  assert.match(document.querySelector('.fin-drawer')!.textContent!,/本单费用已变更/);
});
test('fee ledger uses the shared fees and approval tabs stay simple',async()=>{
  const labels=[...host.querySelectorAll<HTMLElement>('[role=tab]')].map(el=>el.textContent?.replace(/\d+/g,''));
  assert.deepEqual(labels,['待审批','已通过','已驳回','全部']);
  assert.ok([...host.querySelectorAll('th')].some(el=>el.textContent==='客户全称'));
  await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<FinancePage mode="fees"/>));assert.ok(host.querySelector('.fee-ledger'));assert.match(host.textContent!,/原币金额/);
});

test('approval controls appear only in pending view, including details opened from all',async()=>{
  const switchTab=async(name:string)=>click([...host.querySelectorAll<HTMLElement>('[role=tab]')].find(el=>el.textContent?.startsWith(name))!);
  for(const name of ['已通过','已驳回','全部']){
    await switchTab(name);assert.equal(host.querySelectorAll('.fin-toolbar button').length,1);
    assert.equal([...host.querySelectorAll('button')].some(b=>['审批通过','批量通过','批量驳回','审批'].includes(b.textContent?.trim()||'')),false);
    const detail=[...host.querySelectorAll<HTMLButtonElement>('tbody button')].find(b=>b.textContent==='详情')!;assert.ok(detail);await click(detail);
    const drawer=document.querySelector('.fin-drawer')!;
    for(const title of ['审批通过','通过并审批下一单','驳回'])assert.equal([...drawer.querySelectorAll('button')].some(b=>b.textContent?.trim()===title),false);
    assert.ok(btn('追加费用',drawer));await click(btn('关闭',drawer));
  }
  await switchTab('待审批');assert.ok(btn('审批通过',host));assert.ok(btn('批量驳回',host));
});

test('detail contains list-backed business fields without pallet, shipment or unrelated shipment attributes',async()=>{
  await click(btn('审批'));const drawer=document.querySelector('.fin-drawer')!;
  assert.deepEqual([...drawer.querySelectorAll('dt')].map(el=>el.textContent),['客户简称','客户全称','下单类型','指令名称','目的地','仓库代码']);
  for(const text of ['托盘标签','Shipment ID','Reference ID','件数 / 重量 / 方数','业务员','跟单员','客户备注','内部备注','更新时间'])assert.ok(!drawer.textContent?.includes(text),text);
  assert.ok(btn('追加费用',drawer));
});

test('additional fees can be edited and deleted with totals preserved after reload',async()=>{
  const sample=loadFinanceRecords().find(r=>r.status==='待审批')!;await click(btn('审批'));await click(btn('追加费用'));
  await input('费用名称','临时加急费用');await input('费用单价','15');await input('费用数量','2');await submit();
  let updated=loadFinanceRecords().find(r=>r.row.instructionNo===sample.row.instructionNo)!;assert.equal(updated.total,sample.total!+30);
  let row=[...document.querySelectorAll('.fin-drawer tbody tr')].find(row=>row.textContent?.includes('临时加急费用'))!;await click(btn('编辑',row));await input('费用单价','20');await submit();
  updated=loadFinanceRecords().find(r=>r.row.instructionNo===sample.row.instructionNo)!;assert.equal(updated.total,sample.total!+40);
  await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<FinancePage/>));await click(btn('审批'));
  row=[...document.querySelectorAll('.fin-drawer tbody tr')].find(row=>row.textContent?.includes('临时加急费用'))!;assert.ok(row);await click(btn('删除',row));await click(btn('确认删除'));
  updated=loadFinanceRecords().find(r=>r.row.instructionNo===sample.row.instructionNo)!;assert.equal(updated.total,sample.total);assert.ok(!updated.fees.some(f=>f.name==='临时加急费用'));
});
