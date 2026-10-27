import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ClipboardList, Download, Edit3, FileSearch, History, RotateCcw, Search, Settings, X } from 'lucide-react';
import {
  INITIAL_INSTRUCTIONS, createInstructionChanges, exportInstructionsCsv, filterInstructions, normalizeInstructionBusiness,
  type Instruction, type InstructionFilters, type InstructionLog,
} from '../instructionData';

const STORAGE_KEY = 'ans_instruction_management_v1';
const COLUMN_KEY = 'ans_instruction_columns_v1';
const COLUMN_SCHEMA_KEY = 'ans_instruction_columns_business_v1';
const columns = [
  { key: 'code', label: '费用代码', width: 'w-[168px]' },
  { key: 'name', label: '费用名称', width: 'w-[200px]' },
  { key: 'type', label: '费用类型', width: 'w-[138px]' },
  { key: 'businessAttribute', label: '业务属性', width: 'w-[120px]' },
  { key: 'requiresPda', label: '是否需要PDA操作', width: 'w-[160px]' },
  { key: 'unit', label: '计费单位', width: 'w-[110px]' },
  { key: 'price', label: '计费单价（元）', width: 'w-[140px]' },
  { key: 'cost', label: '成本单价（元）', width: 'w-[140px]' },
  { key: 'currency', label: '币种', width: 'w-[90px]' },
  { key: 'status', label: '状态', width: 'w-[92px]' },
  { key: 'description', label: '描述', width: 'w-[260px]' },
] as const;
type ColumnKey = typeof columns[number]['key'];
const allColumns = columns.map(column => column.key);
const emptyFilters: InstructionFilters = { code: '', type: '', status: '', businessAttribute: '', requiresPda: '' };
const currencyNames: Record<string, string> = { USD: '美元', CNY: '人民币', EUR: '欧元', GBP: '英镑' };
const inputClass = 'w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-[#5c67f2] focus:ring-2 focus:ring-[#5c67f2]/10 transition-all';
const secondaryButton = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
const primaryButton = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-[#5c67f2] text-white hover:bg-[#4a55e0] shadow-sm transition-colors cursor-pointer';

function loadData(): { instructions: Instruction[]; logs: InstructionLog[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.instructions) && saved.instructions.length && saved.instructions.every((row: Instruction) =>
      row && typeof row.id === 'string' && typeof row.code === 'string' && typeof row.name === 'string' &&
      typeof row.type === 'string' && typeof row.unit === 'string' && typeof row.currency === 'string' &&
      typeof row.description === 'string' && Number.isFinite(row.price) && Number.isFinite(row.cost) &&
      ['启用', '停用'].includes(row.status))) {
      const logs = Array.isArray(saved.logs) ? saved.logs.filter((log: InstructionLog) =>
        log && typeof log.id === 'string' && typeof log.instructionId === 'string' &&
        typeof log.timestamp === 'string' && typeof log.operator === 'string' && Array.isArray(log.changes) &&
        log.changes.every(change => change && typeof change.field === 'string' && typeof change.before === 'string' && typeof change.after === 'string')) : [];
      return { instructions: saved.instructions.map(normalizeInstructionBusiness), logs };
    }
  } catch { /* Use the initial list if no readable local data is available. */ }
  return { instructions: INITIAL_INSTRUCTIONS, logs: [] };
}

function loadColumns(): ColumnKey[] {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_KEY) || 'null');
    if (Array.isArray(saved)) {
      const valid = allColumns.filter(key => saved.includes(key));
      if (valid.length) return localStorage.getItem(COLUMN_SCHEMA_KEY) === '1' ? valid
        : allColumns.filter(key => valid.includes(key) || key === 'businessAttribute' || key === 'requiresPda');
    }
  } catch { /* Show all columns by default. */ }
  return allColumns;
}

export default function InstructionManagement() {
  const [data, setData] = useState(loadData);
  const [filters, setFilters] = useState<InstructionFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<InstructionFilters>(emptyFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jumpPage, setJumpPage] = useState('1');
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(loadColumns);
  const [showColumns, setShowColumns] = useState(false);
  const [draft, setDraft] = useState<Instruction | null>(null);
  const [logTarget, setLogTarget] = useState<Instruction | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selectAllRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const types = useMemo(() => [...new Set([...INITIAL_INSTRUCTIONS, ...data.instructions].map(row => row.type))], [data.instructions]);
  const filtered = useMemo(() => filterInstructions(data.instructions, appliedFilters), [data.instructions, appliedFilters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedRows = filtered.filter(row => selectedIds.includes(row.id));
  const allPageSelected = pageRows.length > 0 && pageRows.every(row => selectedIds.includes(row.id));
  const somePageSelected = pageRows.some(row => selectedIds.includes(row.id));
  const activeColumns = columns.filter(column => visibleColumns.includes(column.key));
  const targetLogs = logTarget ? data.logs.filter(log => log.instructionId === logTarget.id).slice().reverse() : [];

  useEffect(() => {
    try {
      if (localStorage.getItem(COLUMN_SCHEMA_KEY) !== '1') {
        localStorage.setItem(COLUMN_KEY, JSON.stringify(visibleColumns));
        localStorage.setItem(COLUMN_SCHEMA_KEY, '1');
      }
    } catch { /* Keep the migrated columns visible for this visit. */ }
  }, []);

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);

  useEffect(() => {
    setPage(current => Math.min(current, pageCount));
  }, [pageCount]);

  useEffect(() => {
    setJumpPage(String(page));
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
  }, [page, pageSize, appliedFilters]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!showColumns) return;
    const onPointer = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setShowColumns(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowColumns(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showColumns]);

  const modalId = draft?.id || logTarget?.id;
  useEffect(() => {
    if (!modalId) return;
    const previousFocus = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    const firstInput = dialog?.querySelector<HTMLElement>('input:not([readonly]), button');
    firstInput?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDraft(null); setLogTarget(null); }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from<HTMLElement>(dialog.querySelectorAll('button:not([disabled]), input:not([readonly]):not([disabled]), select:not([disabled]), textarea, [tabindex="0"]'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, [modalId]);

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters({ ...filters, code: filters.code.trim() });
    setPage(1);
    setSelectedIds([]);
  };

  const resetSearch = () => {
    setFilters(emptyFilters); setAppliedFilters(emptyFilters); setPage(1); setSelectedIds([]);
  };

  const toggleColumn = (key: ColumnKey) => {
    if (visibleColumns.length === 1 && visibleColumns.includes(key)) return;
    const next = visibleColumns.includes(key) ? visibleColumns.filter(item => item !== key) : [...visibleColumns, key];
    setVisibleColumns(next);
    try { localStorage.setItem(COLUMN_KEY, JSON.stringify(next)); } catch { /* Column visibility still works for this visit. */ }
  };

  const exportRows = () => {
    const rows = selectedRows.length ? selectedRows : filtered;
    const url = URL.createObjectURL(new Blob([exportInstructionsCsv(rows)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `费用管理_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`已导出${selectedRows.length ? '所选' : '筛选结果'} ${rows.length} 条费用指令`);
  };

  const saveInstruction = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const next = normalizeInstructionBusiness<Instruction>({ ...draft, name: draft.name.trim(), unit: draft.unit.trim(), description: draft.description.trim() });
    if (!next.name || !next.unit || !next.type || !Number.isFinite(next.price) || !Number.isFinite(next.cost) || next.price < 0 || next.cost < 0) {
      setError('请完整填写费用名称、类型和计费单位，单价必须为大于或等于 0 的数字。'); return;
    }
    const original = data.instructions.find(row => row.id === next.id);
    if (!original) return;
    const changes = createInstructionChanges(original, next);
    if (!changes.length) { setDraft(null); setNotice('未修改费用指令'); return; }
    const updated = {
      instructions: data.instructions.map(row => row.id === next.id ? next : row),
      logs: [...data.logs, {
        id: crypto.randomUUID(), instructionId: next.id, timestamp: new Date().toISOString(), operator: '天朗', changes,
      }],
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); }
    catch { setError('本地存储空间不足或不可用，请检查浏览器设置后重试。'); return; }
    setData(updated); setDraft(null); setError(''); setNotice('费用指令已保存，操作日志已记录');
    setSelectedIds(ids => ids.filter(id => filterInstructions(updated.instructions, appliedFilters).some(row => row.id === id)));
  };

  const goToPage = (event: React.FormEvent) => {
    event.preventDefault();
    const target = Number(jumpPage);
    if (Number.isInteger(target) && target >= 1 && target <= pageCount) setPage(target);
    else setJumpPage(String(page));
  };

  return (
    <div className="h-full flex flex-col gap-5 min-h-0">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5c67f2]/10 text-[#5c67f2] flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div>
          <div><h1 className="text-base font-bold text-slate-800">费用管理</h1><p className="text-xs text-slate-400 mt-0.5">海外中转单 / 费用配置</p></div>
        </div>
      </div>

      <form onSubmit={applySearch} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-end gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">费用代码
            <input className={inputClass} placeholder="请输入费用代码" value={filters.code} onChange={event => setFilters({ ...filters, code: event.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">费用类型
            <select className={inputClass} value={filters.type} onChange={event => setFilters({ ...filters, type: event.target.value })}>
              <option value="">全部类型</option>{types.map(type => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">状态
            <select className={inputClass} value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}>
              <option value="">全部状态</option><option>启用</option><option>停用</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">业务属性
            <select className={inputClass} value={filters.businessAttribute} onChange={event => setFilters({ ...filters, businessAttribute: event.target.value as InstructionFilters['businessAttribute'] })}>
              <option value="">全部业务属性</option><option>操作指令</option><option>纯费用</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">是否需要PDA操作
            <select className={inputClass} value={filters.requiresPda} onChange={event => setFilters({ ...filters, requiresPda: event.target.value as InstructionFilters['requiresPda'] })}>
              <option value="">全部</option><option value="true">需要</option><option value="false">不需要</option>
            </select>
          </label>
          <div className="flex gap-2"><button type="submit" className={primaryButton}><Search className="w-3.5 h-3.5" />查询</button><button type="button" onClick={resetSearch} className={secondaryButton}><RotateCcw className="w-3.5 h-3.5" />重置</button></div>
        </div>
      </form>

      <section aria-label="费用指令列表" className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 min-h-0 flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2.5 text-xs"><span className="font-bold text-slate-700">费用项目</span><span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[#5c67f2] font-semibold">{filtered.length}</span>{selectedRows.length > 0 && <span className="text-slate-400 ml-2">已选择 <span className="text-[#5c67f2] font-semibold">{selectedRows.length}</span> 项<button type="button" onClick={() => setSelectedIds([])} className="ml-2 text-[#5c67f2] hover:underline cursor-pointer">取消选择</button></span>}</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportRows} disabled={!filtered.length} className={`${primaryButton} disabled:opacity-40 disabled:cursor-not-allowed`}><Download className="w-3.5 h-3.5" />{selectedRows.length ? '导出所选' : '导出'}</button>
            <div className="relative" ref={settingsRef}>
              <button type="button" aria-label="列设置" aria-expanded={showColumns} onClick={() => setShowColumns(!showColumns)} className={secondaryButton}><Settings className="w-3.5 h-3.5" /><span>列设置</span></button>
              {showColumns && <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg border border-slate-200 shadow-xl z-30 p-3">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100"><span className="text-xs font-bold text-slate-700">显示列</span><button type="button" onClick={() => { setVisibleColumns(allColumns); try { localStorage.setItem(COLUMN_KEY, JSON.stringify(allColumns)); } catch {} }} className="text-[11px] text-[#5c67f2] hover:underline cursor-pointer">恢复默认</button></div>
                {columns.map(column => <label key={column.key} className="flex items-center gap-2 px-1 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded cursor-pointer"><input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={visibleColumns.length === 1 && visibleColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="accent-[#5c67f2] w-3.5 h-3.5" />{column.label}</label>)}
              </div>}
            </div>
          </div>
        </div>
        <div ref={tableScrollRef} className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-xs text-left border-collapse table-fixed" style={{ minWidth: Math.max(700, activeColumns.reduce((sum, col) => sum + parseInt(col.width.match(/\d+/)?.[0] || '120', 10), 170)) }}>
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3.5 border-r border-slate-100"><input ref={selectAllRef} type="checkbox" aria-label="选择本页全部指令" checked={allPageSelected} disabled={!pageRows.length} onChange={() => setSelectedIds(ids => allPageSelected ? ids.filter(id => !pageRows.some(row => row.id === id)) : [...new Set([...ids, ...pageRows.map(row => row.id)])])} className="w-3.5 h-3.5 accent-[#5c67f2] cursor-pointer" /></th>
                {activeColumns.map(column => <th key={column.key} scope="col" className={`${column.width} px-4 py-3.5 whitespace-nowrap border-r border-slate-100 ${column.key === 'price' || column.key === 'cost' ? 'text-right' : ''}`}>{column.label}</th>)}
                <th scope="col" className="w-[122px] px-4 py-3.5 sticky right-0 bg-slate-50 border-l border-slate-200 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(row => <tr key={row.id} className={`group transition-colors ${selectedIds.includes(row.id) ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}>
                <td className="px-4 py-3.5 border-r border-slate-100"><input type="checkbox" aria-label={`选择 ${row.name}`} checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(ids => ids.includes(row.id) ? ids.filter(id => id !== row.id) : [...ids, row.id])} className="w-3.5 h-3.5 accent-[#5c67f2] cursor-pointer" /></td>
                {activeColumns.map(column => <td key={column.key} className={`px-4 py-3.5 border-r border-slate-100 ${column.key === 'price' || column.key === 'cost' ? 'text-right tabular-nums text-slate-600' : 'text-slate-600'}`}>
                  {column.key === 'status' ? <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${row.status === '启用' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-slate-500 bg-slate-100 border border-slate-200'}`}><span className={`w-1.5 h-1.5 rounded-full ${row.status === '启用' ? 'bg-emerald-500' : 'bg-slate-400'}`} />{row.status}</span>
                    : column.key === 'price' || column.key === 'cost' ? row[column.key].toFixed(2)
                    : column.key === 'currency' ? currencyNames[row.currency] || row.currency
                    : column.key === 'businessAttribute' ? <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${row.businessAttribute === '操作指令' ? 'bg-indigo-50 text-[#5c67f2]' : 'bg-slate-100 text-slate-600'}`}>{row.businessAttribute}</span>
                    : column.key === 'requiresPda' ? <span className={row.requiresPda ? 'text-[#5c67f2]' : 'text-slate-500'}>{row.requiresPda ? '需要' : '不需要'}</span>
                    : <div title={String(row[column.key])} className={`truncate ${column.key === 'code' ? 'font-mono text-[11px] text-slate-500' : column.key === 'name' ? 'font-medium text-slate-700' : ''}`}>{row[column.key] || '—'}</div>}
                </td>)}
                <td className={`px-3 py-3.5 sticky right-0 border-l border-slate-100 ${selectedIds.includes(row.id) ? 'bg-indigo-50' : 'bg-white group-hover:bg-slate-50'}`}><div className="flex items-center justify-center gap-3 whitespace-nowrap"><button type="button" aria-label={`编辑 ${row.name}`} onClick={() => { setError(''); setDraft({ ...row }); }} className="inline-flex gap-1 items-center text-[#5c67f2] hover:text-[#4a55e0] hover:underline cursor-pointer"><Edit3 className="w-3 h-3" />编辑</button><button type="button" aria-label={`查看 ${row.name} 日志`} onClick={() => setLogTarget(row)} className="inline-flex gap-1 items-center text-slate-500 hover:text-[#5c67f2] hover:underline cursor-pointer"><History className="w-3 h-3" />日志</button></div></td>
              </tr>)}
              {!pageRows.length && <tr><td colSpan={activeColumns.length + 2} className="py-20 text-center"><FileSearch className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm font-medium text-slate-500">暂无符合条件的费用指令</p><p className="text-xs text-slate-400 mt-1.5">请调整筛选条件后重新查询</p><button type="button" onClick={resetSearch} className="text-xs text-[#5c67f2] mt-4 hover:underline cursor-pointer">重置筛选</button></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <span>共 <span className="font-semibold text-slate-700">{filtered.length}</span> 条{filtered.length > 0 && <span className="text-slate-400 ml-3">显示 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} 条</span>}</span>
          <div className="flex items-center gap-2">
            <select aria-label="每页条数" className="bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#5c67f2]" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} 条/页</option>)}</select>
            <button type="button" aria-label="上一页" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-2.5 py-1.5 rounded bg-[#5c67f2]/10 text-[#5c67f2] font-semibold">{page}</span><span className="text-slate-400">/ {pageCount}</span>
            <button type="button" aria-label="下一页" disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            <form onSubmit={goToPage} className="flex gap-2 items-center ml-2"><label htmlFor="instruction-page">前往</label><input id="instruction-page" type="number" min="1" max={pageCount} value={jumpPage} onChange={event => setJumpPage(event.target.value)} className="w-12 px-1.5 py-1.5 text-center border border-slate-200 rounded focus:outline-none focus:border-[#5c67f2]" /><span>页</span><button type="submit" className="text-[#5c67f2] hover:underline cursor-pointer">确定</button></form>
          </div>
        </div>
      </section>

      {notice && <div role="status" className="fixed top-28 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-4 py-3 bg-white border border-emerald-100 rounded-lg shadow-lg text-xs text-slate-700"><Check className="w-4 h-4 text-emerald-500" />{notice}<button type="button" aria-label="关闭提示" onClick={() => setNotice('')} className="ml-3 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button></div>}

      {(draft || logTarget) && <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-5">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="instruction-dialog-title" className={`bg-white rounded-xl border border-slate-200 shadow-2xl w-full ${draft ? 'max-w-2xl' : 'max-w-3xl'} max-h-[90vh] flex flex-col`}>
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-slate-50 rounded-t-xl shrink-0"><div className="flex items-center gap-2 text-slate-800"><span className="text-[#5c67f2]">{draft ? <Edit3 className="w-4 h-4" /> : <History className="w-4 h-4" />}</span><h2 id="instruction-dialog-title" className="text-sm font-bold">{draft ? '编辑费用配置' : '操作日志'}</h2></div><button type="button" aria-label="关闭弹窗" onClick={() => { setDraft(null); setLogTarget(null); }} className="p-1.5 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button></div>
          {draft ? <form onSubmit={saveInstruction} className="min-h-0 flex flex-col">
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>费用代码</span><input readOnly value={draft.code} className={`${inputClass} bg-slate-100 text-slate-400 font-mono cursor-default`} /></label>
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>费用名称 <span className="text-rose-400">*</span></span><input required maxLength={80} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} className={inputClass} /></label>
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>费用类型 <span className="text-rose-400">*</span></span><select required value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })} className={inputClass}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>计费单位 <span className="text-rose-400">*</span></span><input required maxLength={30} value={draft.unit} onChange={event => setDraft({ ...draft, unit: event.target.value })} className={inputClass} /></label>
                <fieldset className="col-span-2 min-w-0">
                  <legend className="mb-2 text-xs font-semibold text-slate-500">业务属性 <span className="text-rose-400">*</span></legend>
                  <div className="flex flex-wrap gap-6">{(['操作指令', '纯费用'] as const).map(value => <label key={value} className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer"><input type="radio" name="fee-business-attribute" aria-label={value} checked={draft.businessAttribute === value} onChange={() => setDraft({ ...draft, businessAttribute: value, requiresPda: value === '操作指令' })} className="accent-[#5c67f2]" />{value}</label>)}</div>
                </fieldset>
                <fieldset className="col-span-2 min-w-0" aria-describedby="fee-pda-description">
                  <legend className="mb-2 text-xs font-semibold text-slate-500">是否需要PDA操作 <span className="text-rose-400">*</span></legend>
                  <div className="flex flex-wrap gap-6">{([true, false] as const).map(value => <label key={String(value)} className={`inline-flex items-center gap-2 text-xs ${draft.businessAttribute === '纯费用' ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 cursor-pointer'}`}><input type="radio" name="fee-requires-pda" aria-label={value ? '需要PDA操作' : '不需要PDA操作'} checked={draft.requiresPda === value} disabled={draft.businessAttribute === '纯费用'} onChange={() => setDraft({ ...draft, requiresPda: value })} className="accent-[#5c67f2] disabled:cursor-not-allowed" />{value ? '需要' : '不需要'}</label>)}</div>
                  <p id="fee-pda-description" className="mt-2 text-xs leading-relaxed text-slate-400">{draft.businessAttribute === '纯费用' ? '纯费用仅用于计费，不需要PDA操作。' : draft.requiresPda ? '操作指令需要PDA操作，作为仓库待处理任务的配置依据。' : '操作指令不需要PDA操作，可通过系统记录处理结果。'}</p>
                </fieldset>
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>计费单价（元） <span className="text-rose-400">*</span></span><input type="number" required min="0" step="0.01" value={Number.isNaN(draft.price) ? '' : draft.price} onChange={event => setDraft({ ...draft, price: event.target.valueAsNumber })} className={inputClass} /></label>
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>成本单价（元） <span className="text-rose-400">*</span></span><input type="number" required min="0" step="0.01" value={Number.isNaN(draft.cost) ? '' : draft.cost} onChange={event => setDraft({ ...draft, cost: event.target.valueAsNumber })} className={inputClass} /></label>
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>币种</span><select value={draft.currency} onChange={event => setDraft({ ...draft, currency: event.target.value })} className={inputClass}>{Object.entries(currencyNames).map(([code, name]) => <option key={code} value={code}>{name}（{code}）</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-500 space-y-1.5"><span>状态</span><select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as Instruction['status'] })} className={inputClass}><option>启用</option><option>停用</option></select></label>
              </div>
              <label className="block text-xs font-semibold text-slate-500 space-y-1.5"><span>描述</span><textarea value={draft.description} maxLength={500} rows={3} placeholder="请输入费用说明" onChange={event => setDraft({ ...draft, description: event.target.value })} className={`${inputClass} resize-y`} /></label>
              {error && <p role="alert" className="text-xs text-rose-600 bg-rose-50 rounded p-3">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0"><button type="button" onClick={() => setDraft(null)} className={secondaryButton}>取消</button><button type="submit" className={primaryButton}><Check className="w-3.5 h-3.5" />保存</button></div>
          </form> : logTarget && <>
            <div className="px-6 py-4 border-b border-slate-100"><p className="text-sm font-semibold text-slate-700">{logTarget.name}</p><p className="text-xs font-mono text-slate-400 mt-1">{logTarget.code}</p></div>
            <div className="p-6 overflow-y-auto min-h-[240px]">
              {targetLogs.length ? <div className="space-y-5">{targetLogs.map(log => <div key={log.id} className="border border-slate-200 rounded-lg overflow-hidden"><div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-600">{log.operator} <span className="text-slate-400 font-normal ml-1">编辑了费用指令</span></span><time dateTime={log.timestamp} className="text-slate-400 tabular-nums">{new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}</time></div><div className="px-4 divide-y divide-slate-100">{log.changes.map(change => <div key={change.field} className="py-3 grid grid-cols-[100px_1fr_16px_1fr] items-start gap-3 text-xs"><span className="text-slate-500">{change.field}</span><span className="text-slate-400 break-words whitespace-pre-wrap">{change.before || '—'}</span><ChevronRight className="w-3.5 h-3.5 text-slate-300" /><span className="text-[#5c67f2] break-words whitespace-pre-wrap">{change.after || '—'}</span></div>)}</div></div>)}</div> : <div className="text-center py-10"><History className="w-10 h-10 mx-auto text-slate-300 mb-3" /><p className="text-sm text-slate-500 font-medium">暂无操作日志</p><p className="text-xs text-slate-400 mt-2">费用指令保存修改后，将在此记录变更内容</p></div>}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end"><button type="button" onClick={() => setLogTarget(null)} className={secondaryButton}>关闭</button></div>
          </>}
        </div>
      </div>}
    </div>
  );
}
