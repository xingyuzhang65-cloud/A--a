import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EMPTY_INSTRUCTION_LIST_FILTERS, INITIAL_INSTRUCTION_LIST_RECORDS, INSTRUCTION_LIST_STORAGE_KEY, INSTRUCTION_LIST_TABS,
  displayInstructionStatus, exportInstructionListCsv, filterInstructionList, getInstructionFailureReason,
  loadInstructionListState, persistInstructionListState, transitionInstructionList,
} from './instructionListData';
import { INITIAL_STAGING_RECORDS } from './stagingData';

function memoryStorage() {
  const values = new Map<string, string>();
  const writes: { key: string; value: string }[] = [];
  return {
    values, writes,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); writes.push({ key, value }); },
  };
}

test('instruction list fixtures include the reference states and an explicit pickup example', () => {
  assert.equal(INSTRUCTION_LIST_TABS.length, 8);
  assert.equal(INITIAL_INSTRUCTION_LIST_RECORDS.length, 38);
  assert.equal(new Set(INITIAL_INSTRUCTION_LIST_RECORDS.map(row => row.id)).size, 38);
  for (const tab of INSTRUCTION_LIST_TABS.filter(tab => tab !== '全部')) assert.ok(INITIAL_INSTRUCTION_LIST_RECORDS.some(row => row.tab === tab), tab);
  const pickup = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.instructionType === '自提')!;
  assert.ok(pickup.expectedPickupTime && pickup.pickupContact && pickup.pickupPhone);
  assert.ok(pickup.names.some(name => name.includes('示例')));
  assert.ok(INITIAL_INSTRUCTION_LIST_RECORDS.filter(row => ['不放货', '拦截', '销毁'].includes(row.instructionType)).every(row => row.shipment === '-' && row.reference === '-' && row.warehouse === '-'));
});

test('batch identifier terms use case-insensitive OR while different filters combine with AND', () => {
  const base = INITIAL_INSTRUCTION_LIST_RECORDS[0];
  const rows = [
    { ...base, id: 'A', instructionNo: 'CI-A', waybill: 'WB-A', shipment: 'FBA-A', reference: 'REF-A', customer: '客户甲' },
    { ...base, id: 'B', instructionNo: 'CI-B', waybill: 'WB-B', shipment: 'FBA-B', reference: 'REF-B', customer: '客户乙' },
    { ...base, id: 'C', instructionNo: 'CI-C', waybill: 'WB-C', shipment: 'FBA-C', reference: 'REF-C', customer: '客户甲' },
  ];
  const result = filterInstructionList(rows, { ...EMPTY_INSTRUCTION_LIST_FILTERS, instructionNo: ' ci-a，CI-b;\nCI-c ', waybill: 'wb-a wb-c', shipment: 'fba-a;FBA-B', reference: 'ref-a', customer: '甲' });
  assert.deepEqual(result.map(row => row.id), ['A']);
  assert.equal(filterInstructionList(rows, { ...EMPTY_INSTRUCTION_LIST_FILTERS, instructionNo: ' \n，; ' }).length, 3);
  assert.equal(filterInstructionList(rows, { ...EMPTY_INSTRUCTION_LIST_FILTERS, orderType: '沃尔玛' }).length, 0);
});

test('inbound date range uses overseas warehouse arrival, includes both days and excludes missing arrival', () => {
  const base = INITIAL_INSTRUCTION_LIST_RECORDS[0];
  const rows = [
    { ...base, id: 'before', created: '2026-09-10 09:00:00', overseasTime: '2026-09-09 23:59:59' },
    { ...base, id: 'start', created: '2026-01-01 09:00:00', overseasTime: '2026-09-10 00:00:00' },
    { ...base, id: 'end', overseasTime: '2026-09-10 23:59:59' },
    { ...base, id: 'after', overseasTime: '2026-09-11 00:00:00' },
    { ...base, id: 'not-arrived', overseasTime: '-' },
  ];
  assert.deepEqual(filterInstructionList(rows, { ...EMPTY_INSTRUCTION_LIST_FILTERS, dateFrom: '2026-09-10', dateTo: '2026-09-10' }).map(row => row.id), ['start', 'end']);
});

test('intercept results preserve success/failure/pending semantics and reveal failure reasons only when applicable', () => {
  const base = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.instructionType === '拦截' && row.processingResult === '拦截失败')!;
  assert.equal(displayInstructionStatus(base), '拦截失败');
  assert.ok(getInstructionFailureReason(base));
  assert.equal(displayInstructionStatus({ ...base, processingResult: '拦截成功' }), '拦截成功');
  assert.equal(getInstructionFailureReason({ ...base, processingResult: '拦截成功' }), '');
  assert.equal(displayInstructionStatus({ ...base, tab: '处理中', processingResult: '' }), '待海外仓回传');
  assert.equal(getInstructionFailureReason({ ...base, tab: '处理中' }), '');
  assert.equal(displayInstructionStatus({ ...base, tab: '取消', status: '已取消' }), '已取消');
  assert.equal(displayInstructionStatus({ ...base, instructionType: '放货' }), '已完成');
});

test('confirmation changes phase without claiming warehouse completion; cancellation and logs affect only pending selections', () => {
  const pending = { ...INITIAL_INSTRUCTION_LIST_RECORDS[1], id: 'pending', status: '待处理' };
  const complete = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => row.tab === '已完成')!;
  const state = { records: [pending, complete], logs: [] };
  const original = JSON.stringify(state);
  const confirmed = transitionInstructionList(state, [pending.id, complete.id], 'confirm', '2026-10-19T01:02:03.000Z', '测试操作员');
  assert.equal(confirmed.records[0].tab, '已确认');
  assert.equal(confirmed.records[0].status, '待处理');
  assert.equal(confirmed.records[1], complete);
  assert.equal(confirmed.logs.length, 1);
  assert.equal(confirmed.logs[0].operator, '测试操作员');
  assert.equal(new Date(confirmed.logs[0].timestamp).getTime(), Date.parse('2026-10-19T01:02:03.000Z'));
  assert.equal(JSON.stringify(state), original);
  assert.equal(transitionInstructionList(confirmed, [pending.id], 'confirm'), confirmed);
  const cancelled = transitionInstructionList(state, [pending.id], 'cancel');
  assert.equal(cancelled.records[0].tab, '取消');
  assert.equal(cancelled.records[0].status, '已取消');
  assert.equal(cancelled.logs.length, 1);
});

test('staging orders merge idempotently with original currency, precise totals, actual creation logs and persistent cancellations', () => {
  const storage = memoryStorage();
  const source = INITIAL_STAGING_RECORDS[0];
  const first = { id: 'source-A', recordId: source.id, instructionId: 'fee-A', instructionName: '拦截费', quantity: 0.1, unit: '箱', price: 0.2, currency: 'USD', remark: '保留原币', createdAt: '2026-10-19T01:00:00.000Z' };
  const staging = { records: [source], orders: [first, first], logs: [{ recordId: source.id, action: '创建指令', detail: '费用指令：拦截费', timestamp: first.createdAt, operator: '来源操作员' }] };
  storage.values.set('ans_staging_management_v1', JSON.stringify(staging));
  const state = loadInstructionListState(storage);
  const row = state.records.find(item => item.sourceOrderId === first.id)!;
  assert.equal(state.records.filter(item => item.sourceOrderId === first.id).length, 1);
  assert.equal(row.fee, 0.02);
  assert.equal(row.currency, 'USD');
  assert.equal(row.instructionType, '作业', 'fee names must not be guessed as release/intercept business instructions');
  assert.equal(row.waybill, source.inboundNo);
  assert.equal(row.palletLabel, source.palletLabel);
  assert.equal(row.warehouse, '', 'a storage location is not a warehouse code');
  assert.equal(state.logs.filter(log => log.recordId === row.id).length, 1);
  assert.equal(state.logs.find(log => log.recordId === row.id)!.operator, '来源操作员');
  const cancelled = transitionInstructionList(state, [row.id], 'cancel');
  persistInstructionListState(cancelled, storage);
  assert.equal(storage.writes.length, 1);
  staging.orders.push({ ...first, id: 'source-B', currency: 'CNY', quantity: 2, price: 1.25 });
  storage.values.set('ans_staging_management_v1', JSON.stringify(staging));
  const merged = loadInstructionListState(storage);
  assert.equal(merged.records.find(item => item.sourceOrderId === first.id)!.tab, '取消');
  assert.equal(merged.records.filter(item => item.sourceOrderId === first.id).length, 1);
  assert.equal(merged.records.find(item => item.sourceOrderId === 'source-B')!.fee, 2.5);
  assert.equal(merged.logs.filter(log => log.id === `staging-created-${first.id}`).length, 1);
  assert.equal(loadInstructionListState(storage).records.length, merged.records.length);
});

test('empty saved state stays empty; invalid storage recovers and failed writes propagate atomically', () => {
  const storage = memoryStorage();
  persistInstructionListState({ records: [], logs: [] }, storage);
  assert.deepEqual(loadInstructionListState(storage), { records: [], logs: [] });
  storage.values.set(INSTRUCTION_LIST_STORAGE_KEY, '{invalid json');
  const recovered = loadInstructionListState(storage);
  assert.equal(recovered.records.length, INITIAL_INSTRUCTION_LIST_RECORDS.length);
  assert.throws(() => persistInstructionListState(recovered, { setItem: () => { throw new Error('QuotaExceededError'); } }), /QuotaExceededError/);
  assert.equal(storage.writes.length, 1);
  assert.throws(() => persistInstructionListState({ records: [recovered.records[0], recovered.records[0]], logs: [] }, storage), /无效/);
  assert.equal(storage.writes.length, 1);
});

test('CSV includes all business fields, original currency, readable results, escaping and text formula protection', () => {
  const base = INITIAL_INSTRUCTION_LIST_RECORDS.find(row => getInstructionFailureReason(row))!;
  const row = { ...base, names: [' =1+1', '第二个指令'], remark: '多行,"备注"\n下一行', currency: 'USD', fee: 0.02, failureReason: '承运商已提货' };
  const csv = exportInstructionListCsv([row]);
  assert.ok(csv.startsWith('\uFEFF'));
  for (const text of ['Shipment ID', 'Reference ID', '指令费用', '币种', '预计提货时间', '提货联系人', '失败原因', '入仓时间（海外仓）']) assert.ok(csv.includes(text));
  assert.ok(csv.includes('"USD"'));
  assert.ok(csv.includes('"0.02"'));
  assert.ok(csv.includes('"拦截失败"'));
  assert.ok(csv.includes('"\' =1+1 / 第二个指令"'));
  assert.ok(csv.includes('"多行,""备注""\n下一行"'));
  assert.ok(csv.endsWith('\r\n'));
});
