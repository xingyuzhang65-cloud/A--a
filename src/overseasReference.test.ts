import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { INITIAL_INSTRUCTIONS } from './instructionData';
import { createInitialOverseasInventory, createReleaseDraft, getInventoryFeeCatalog, persistOverseasInventory, submitInventoryRelease } from './components/overseas/overseasStorageInventoryData';
import { LIST_STATE_KEY, loadListRows, persistListRows, readListState } from './components/overseas/instructionListState';
import { getInstructionOperations } from './components/overseas/instructionOperationDisplay';

const entries = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) } });
beforeEach(() => entries.clear());

test('legacy confirmation returns to pending and pushed orders are renamed without losing data', () => {
  localStorage.setItem(LIST_STATE_KEY, JSON.stringify({ rows: [
    { id: 'old-confirmed', instructionNo: 'CI1', waybill: 'WB1', names: ['拍照'], tab: '已确认' },
    { id: 'old-pushed', instructionNo: 'CI2', waybill: 'WB2', names: ['换标'], tab: '已推送海外仓' },
  ], logs: [{ at: '2026-10-21', ids: ['old-pushed'], action: '原记录' }] }));
  const migrated = readListState();
  assert.deepEqual(migrated.rows.map(row => row.tab), ['待确认', '已下单']);
  assert.deepEqual(migrated.rows.map(row => row.instructionNo), ['CI1', 'CI2']);
  assert.equal(migrated.logs.length, 1);
});

test('latest inventory uses instruction management prices, currencies and enabled states', () => {
  const [first, second] = INITIAL_INSTRUCTIONS;
  localStorage.setItem('ans_instruction_management_v1', JSON.stringify({ instructions: [{ ...first, price: 12.5, currency: 'EUR' }, { ...second, status: '停用' }] }));
  const catalog = getInventoryFeeCatalog();
  assert.equal(catalog.find(row => row.code === first.code)?.unitPrice, 12.5);
  assert.equal(catalog.find(row => row.code === first.code)?.currency, '欧元');
  assert.equal(catalog.some(row => row.code === second.code), false);
});

test('shared fee catalog retains business and PDA settings without deriving them from fee type', () => {
  const first = INITIAL_INSTRUCTIONS[0];
  localStorage.setItem('ans_instruction_management_v1', JSON.stringify({ instructions: [
    { ...first, businessAttribute: '纯费用', requiresPda: false, price: 3.5 },
  ] }));
  let fee = getInventoryFeeCatalog().find(row => row.code === first.code)!;
  assert.equal(fee.businessAttribute, '纯费用'); assert.equal(fee.requiresPda, false); assert.equal(fee.unitPrice, 3.5);
  localStorage.setItem('ans_instruction_management_v1', JSON.stringify({ instructions: [
    { ...first, businessAttribute: '操作指令', requiresPda: false },
  ] }));
  fee = getInventoryFeeCatalog().find(row => row.code === first.code)!;
  assert.equal(fee.businessAttribute, '操作指令'); assert.equal(fee.requiresPda, false);
});

test('latest release orders appear once with itemized operations and retain workflow changes after reload', () => {
  const inventory = createInitialOverseasInventory();
  const source = inventory.records.find(row => row.status === '暂存' && row.cargoBoxes.some(box => box.status === '待处理'))!;
  const box = source.cargoBoxes.find(box => box.status === '待处理')!;
  const draft = { ...createReleaseDraft([source]), kind: '自提' as const, boxIds: [box.id], boxCount: 1,
    instructions: [{ ...getInventoryFeeCatalog()[0], unitPrice: 2.5, quantity: 3, exchangeRate: 7.1 }] };
  const next = submitInventoryRelease(inventory, [source.id], draft);
  persistOverseasInventory(next);
  const first = loadListRows([]);
  assert.equal(first.length, 1);
  assert.equal(first[0].packages, '1');
  assert.equal(first[0].instructionType, '自提');
  assert.equal(Number(first[0].fee), 53.25);
  assert.equal(getInstructionOperations(first[0]).length, 1);
  assert.match(getInstructionOperations(first[0])[0].description, /7.5 USD/);
  persistListRows([{ ...first[0], tab: '已下单' }], { at: '2026-10-21', ids: [first[0].id], action: '下单' });
  assert.equal(loadListRows([]).length, 1);
  assert.equal(loadListRows([])[0].tab, '已下单');
  assert.equal(readListState().logs.length, 1);
  assert.throws(() => submitInventoryRelease(next, [source.id], draft), /占用|出库/);
});
