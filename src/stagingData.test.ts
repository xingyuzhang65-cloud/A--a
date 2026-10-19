import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { EMPTY_STAGING_FILTERS, INITIAL_STAGING_RECORDS, exportStagingCsv, filterStagingRecords, summarizeStagingRecords } from './stagingData';

test('staging samples preserve box totals and include all three workflow states', () => {
  assert.equal(INITIAL_STAGING_RECORDS.length, 18);
  assert.equal(new Set(INITIAL_STAGING_RECORDS.map(row => row.id)).size, 18);
  assert.equal(new Set(INITIAL_STAGING_RECORDS.map(row => row.palletLabel)).size, 18);
  assert.deepEqual(['暂存', '待出库', '已出库'].map(status => INITIAL_STAGING_RECORDS.filter(row => row.status === status).length), [13, 3, 2]);
  for (const row of INITIAL_STAGING_RECORDS) {
    assert.equal(row.pendingBoxes + row.unshippedBoxes + row.shippedBoxes, row.boxCount, row.id);
    assert.ok([row.pendingBoxes, row.unshippedBoxes, row.shippedBoxes].every(value => Number.isInteger(value) && value >= 0), row.id);
  }
});

test('staging keyword matches a whole field, trims input and ignores case', () => {
  const find = (keyword: string) => filterStagingRecords(INITIAL_STAGING_RECORDS, { ...EMPTY_STAGING_FILTERS, keyword }).map(row => row.id);
  assert.deepEqual(find(' test0280745 '), ['STG-001', 'STG-002']);
  assert.deepEqual(find('TEST0280745-260912'), ['STG-001', 'STG-002']);
  assert.deepEqual(find('test0280745-260912-ussz202609050004-abe4-4-4'), ['STG-001']);
  assert.deepEqual(find('TEST028074'), []);
  assert.deepEqual(find('FA102'), ['STG-004', 'STG-015', 'STG-018']);
});

test('staging filters combine exact selects and partial expanded search', () => {
  const filters = { ...EMPTY_STAGING_FILTERS, clientName: 'tttx', destination: 'boulder', transferMode: '拆转', deliveryMethod: 'Storage', intercepted: 'false', containerNo: '0750', systemContainerNo: '-260912' };
  assert.deepEqual(filterStagingRecords(INITIAL_STAGING_RECORDS, filters).map(row => row.id), ['STG-008']);
  assert.equal(filterStagingRecords(INITIAL_STAGING_RECORDS, { ...filters, intercepted: 'true' }).length, 0);
  assert.equal(filterStagingRecords(INITIAL_STAGING_RECORDS, { ...filters, deliveryMethod: 'Truck' }).length, 0);
  assert.equal(filterStagingRecords(INITIAL_STAGING_RECORDS, { ...EMPTY_STAGING_FILTERS, clientName: '全部', transferMode: '全部', deliveryMethod: '全部', intercepted: '全部' }).length, 18);
});

test('batch inbound numbers accept mixed separators and use exact OR matching', () => {
  const inboundNos = ' ussz202609050004；USSZ202609070007,无此入仓号，USSZ202609070010;\n001\r\nUSSZ202609050004 ';
  const result = filterStagingRecords(INITIAL_STAGING_RECORDS, { ...EMPTY_STAGING_FILTERS, inboundNos });
  assert.deepEqual(result.map(row => row.id), ['STG-001', 'STG-002', 'STG-004', 'STG-008', 'STG-011', 'STG-012']);
  assert.equal(filterStagingRecords(INITIAL_STAGING_RECORDS, { ...EMPTY_STAGING_FILTERS, inboundNos: 'USSZ20260905' }).length, 0);
  assert.equal(filterStagingRecords(INITIAL_STAGING_RECORDS, { ...EMPTY_STAGING_FILTERS, inboundNos: '，;\n ' }).length, 18);
});

test('inbound dates include both boundary days and respect other filters', () => {
  const rows = ['2026-09-09 23:59:59', '2026-09-10 00:00:00', '2026-09-10 23:59:59', '2026-09-11 00:00:00'].map((inboundTime, index) => ({ ...INITIAL_STAGING_RECORDS[0], id: String(index), inboundTime }));
  assert.deepEqual(filterStagingRecords(rows, { ...EMPTY_STAGING_FILTERS, inboundFrom: '2026-09-10', inboundTo: '2026-09-10' }).map(row => row.id), ['1', '2']);
  assert.deepEqual(filterStagingRecords(rows, { ...EMPTY_STAGING_FILTERS, inboundTo: '2026-09-09' }).map(row => row.id), ['0']);
  assert.equal(filterStagingRecords(rows, { ...EMPTY_STAGING_FILTERS, inboundFrom: '2026-09-10', inboundTo: '2026-09-10', clientName: 'FA102' }).length, 0);
});

test('staging summary deduplicates pallet and system container identity and avoids decimal noise', () => {
  const records = [
    { ...INITIAL_STAGING_RECORDS[0], palletLabel: 'P1', systemContainerNo: 'C1', weight: 0.1, volume: 0.000001, boxCount: 2 },
    { ...INITIAL_STAGING_RECORDS[0], palletLabel: 'P1', systemContainerNo: 'C2', weight: 0.2, volume: 0.000002, boxCount: 3 },
    { ...INITIAL_STAGING_RECORDS[0], palletLabel: 'P2', systemContainerNo: 'C2', weight: 10.005, volume: 0.072, boxCount: 1 },
  ];
  assert.deepEqual(summarizeStagingRecords(records), { pallets: 2, boxes: 6, containers: 2, weight: 10.305, volume: 0.072003 });
  assert.deepEqual(summarizeStagingRecords([]), { pallets: 0, boxes: 0, containers: 0, weight: 0, volume: 0 });
});

test('staging CSV includes all business fields, readable values, proper escaping and formula protection', () => {
  const row = { ...INITIAL_STAGING_RECORDS[0], clientName: ' =HYPERLINK("https://example.com")', destination: '第一行,"地址"\n第二行', location: '\t=1+1', status: '待出库' as const };
  const csv = exportStagingCsv([row, { ...INITIAL_STAGING_RECORDS[0], intercepted: false }]);
  assert.ok(csv.startsWith('\uFEFF"记录ID","客户名称","柜号","系统柜号","入仓号"'));
  for (const label of ['是否拦截', '转运方式', '目的地', '派送方式', '托盘标签', '入库时间', '重量（kg）', '体积（m³）', '总箱数', '待审核箱数', '未发货箱数', '已发货箱数', '库位', '状态']) assert.ok(csv.includes(`"${label}"`), label);
  assert.ok(csv.includes('"\' =HYPERLINK(""https://example.com"")"'));
  assert.ok(csv.includes('"\'\t=1+1"'));
  assert.ok(csv.includes('"第一行,""地址""\n第二行"'));
  assert.ok(csv.includes('"拦截"'));
  assert.ok(csv.includes('"未拦截"'));
  assert.ok(csv.includes('"待出库"'));
  assert.ok(csv.includes('"80","0.072","2","2","0","0"'));
  assert.ok(csv.endsWith('\r\n'));
  assert.equal(exportStagingCsv([]).split('\r\n').length, 2);
});
