import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InstructionManagement from './components/InstructionManagement';
import { INITIAL_INSTRUCTIONS, createInstructionChanges, exportInstructionsCsv, filterInstructions } from './instructionData';

test('instruction filters combine trimmed case-insensitive codes and exact types/statuses', () => {
  const rows = INITIAL_INSTRUCTIONS.map((row, index) => index === 3 ? { ...row, status: '停用' as const } : row);
  assert.deepEqual(filterInstructions(rows, { code: ' fy202609 ', type: '销毁费', status: '停用' }).map(row => row.code), ['FY20260904067']);
  assert.equal(filterInstructions(rows, { code: '', type: '销毁', status: '' }).length, 0);
  assert.equal(filterInstructions(rows, { code: '', type: '全部', status: '全部' }).length, 20);
});

test('CSV preserves multiline quotes and neutralizes formula-shaped user text', () => {
  const row = { ...INITIAL_INSTRUCTIONS[0], name: ' =HYPERLINK("https://example.com")', description: '第一行,"引号"\n第二行', unit: '\t=1+1' };
  const csv = exportInstructionsCsv([row]);
  assert.ok(csv.startsWith('\uFEFF"费用ID","费用代码"'));
  assert.ok(csv.includes('"\' =HYPERLINK(""https://example.com"")"'));
  assert.ok(csv.includes('"\'\t=1+1"'));
  assert.ok(csv.includes('"第一行,""引号""\n第二行"'));
  assert.ok(csv.includes('"美元"'));
  assert.ok(csv.endsWith('\r\n'));
});

test('change logs contain only changed fields with readable labels and values', () => {
  const before = INITIAL_INSTRUCTIONS[0];
  assert.deepEqual(createInstructionChanges(before, { ...before }), []);
  assert.deepEqual(createInstructionChanges(before, { ...before, cost: 1.2, currency: 'CNY', status: '停用' }), [
    { field: '成本单价（元）', before: '0.8', after: '1.2' },
    { field: '币种', before: '美元', after: '人民币' },
    { field: '状态', before: '启用', after: '停用' },
  ]);
});

test('instruction page renders required fields and restores saved data or recovers invalid storage', () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let stored: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => key === 'ans_instruction_management_v1' ? stored : null },
  });
  try {
    const render = () => renderToStaticMarkup(React.createElement(InstructionManagement));
    const initial = render();
    for (const label of ['指令管理', '费用代码', '费用名称', '费用类型', '计费单位', '计费单价（元）', '成本单价（元）', '币种', '状态', '描述', '列设置']) {
      assert.ok(initial.includes(label), label);
    }
    assert.equal((initial.match(/aria-label="编辑 /g) || []).length, 20);
    stored = JSON.stringify({ instructions: [{ ...INITIAL_INSTRUCTIONS[0], name: '已持久化的指令', status: '停用' }], logs: [] });
    const saved = render();
    assert.ok(saved.includes('已持久化的指令'));
    assert.ok(saved.includes('停用'));
    assert.equal((saved.match(/aria-label="编辑 /g) || []).length, 1);
    stored = '{bad json';
    assert.equal((render().match(/aria-label="编辑 /g) || []).length, 20);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
  }
});
