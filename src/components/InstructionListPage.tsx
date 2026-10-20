import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, Download, FileSearch, History, ImageIcon, RotateCcw, Search, Settings, X, XCircle } from 'lucide-react';
import {
  EMPTY_INSTRUCTION_LIST_FILTERS, INSTRUCTION_LIST_TABS, displayInstructionStatus, exportInstructionListCsv,
  filterInstructionList, getInstructionFailureReason, loadInstructionListState, persistInstructionListState,
  transitionInstructionList, type InstructionListFilters, type InstructionListLog, type InstructionListRecord, type InstructionListTab,
} from '../instructionListData';

const COLUMN_KEY = 'ans_instruction_list_columns_v1';
const columns = [
  { key: 'names', label: '指令名称', width: 180 },
  { key: 'created', label: '创建时间', width: 168 },
  { key: 'updated', label: '修改时间', width: 168 },
  { key: 'shipment', label: 'Shipment ID', width: 160 },
  { key: 'reference', label: 'Reference ID', width: 160 },
  { key: 'status', label: '指令处理状态', width: 160 },
  { key: 'failureReason', label: '失败原因', width: 260 },
  { key: 'photo', label: '指令操作图片', width: 150 },
  { key: 'customer', label: '客户简称', width: 130 },
  { key: 'warehouse', label: '仓库代码', width: 120 },
  { key: 'zip', label: '邮编', width: 120 },
  { key: 'orderType', label: '下单类型', width: 105 },
  { key: 'instructionType', label: '指令单类型', width: 110 },
  { key: 'expectedPickupTime', label: '预计提货时间', width: 168 },
  { key: 'interceptReason', label: '拦截原因', width: 240 },
  { key: 'destination', label: '目的地', width: 150 },
  { key: 'salesman', label: '业务员', width: 110 },
  { key: 'merchandiser', label: '跟单员', width: 110 },
  { key: 'fee', label: '指令费用', width: 130 },
  { key: 'packages', label: '发货件数', width: 100 },
  { key: 'weight', label: '重量（kg）', width: 110 },
  { key: 'volume', label: '方数（m³）', width: 120 },
  { key: 'arrived', label: '是否到达海外仓', width: 135 },
  { key: 'overseasTime', label: '入仓时间（海外仓）', width: 175 },
  { key: 'palletLabel', label: '关联托盘', width: 280, hidden: true },
] satisfies { key: keyof InstructionListRecord; label: string; width: number; hidden?: boolean }[];
type ColumnKey = typeof columns[number]['key'];
const defaults = columns.filter(column => !('hidden' in column && column.hidden)).map(column => column.key);
const inputClass = 'w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-[#5c67f2] focus:ring-2 focus:ring-[#5c67f2]/10 transition-all';
const secondaryButton = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
const primaryButton = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-[#5c67f2] text-white hover:bg-[#4a55e0] shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
type Modal = { kind: 'detail'; id: string } | { kind: 'logs'; ids: string[] } | { kind: 'transition'; action: 'approve' | 'confirm' | 'cancel'; ids: string[] } | null;

function loadColumns(): ColumnKey[] {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_KEY) || 'null');
    if (Array.isArray(saved)) {
      const valid = columns.filter(column => saved.includes(column.key)).map(column => column.key);
      if (valid.length) return valid;
    }
  } catch { /* Use the complete reference fields by default. */ }
  return defaults;
}

export default function InstructionListPage() {
  const [data, setData] = useState(() => loadInstructionListState());
  const [draft, setDraft] = useState<InstructionListFilters>(EMPTY_INSTRUCTION_LIST_FILTERS);
  const [applied, setApplied] = useState<InstructionListFilters>(EMPTY_INSTRUCTION_LIST_FILTERS);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<InstructionListTab>('待确认');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jumpPage, setJumpPage] = useState('1');
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(loadColumns);
  const [showColumns, setShowColumns] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const allRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => filterInstructionList(data.records, applied), [data.records, applied]);
  const visible = useMemo(() => filterInstructionList(filtered, EMPTY_INSTRUCTION_LIST_FILTERS, tab), [filtered, tab]);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageRows = visible.slice((page - 1) * pageSize, page * pageSize);
  const selected = visible.filter(row => selectedIds.includes(row.id));
  const canTransition = selected.length > 0 && selected.every(row => row.tab === '待确认');
  const allSelected = pageRows.length > 0 && pageRows.every(row => selectedIds.includes(row.id));
  const someSelected = pageRows.some(row => selectedIds.includes(row.id));
  const activeColumns = columns.filter(column => visibleColumns.includes(column.key) && (column.key !== 'failureReason' || tab === '已完成' || tab === '全部' || visibleColumns.length === 1));
  const detail = modal?.kind === 'detail' ? data.records.find(row => row.id === modal.id) : null;
  const logs = modal?.kind === 'logs' ? data.logs.filter(log => !modal.ids.length || modal.ids.includes(log.recordId)).slice().reverse() : [];
  const options = (key: 'salesman' | 'orderType' | 'instructionType') => [...new Set(data.records.map(row => row[key]).filter(value => value && value !== '-'))];
  const setFilter = (key: keyof InstructionListFilters, value: string) => setDraft(current => ({ ...current, [key]: value }));

  useEffect(() => { if (allRef.current) allRef.current.indeterminate = someSelected && !allSelected; }, [someSelected, allSelected]);
  useEffect(() => { setPage(current => Math.min(current, pageCount)); }, [pageCount]);
  useEffect(() => { setJumpPage(String(page)); if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [page, pageSize, tab, applied]);
  useEffect(() => {
    const refresh = () => setData(loadInstructionListState());
    window.addEventListener('storage', refresh); window.addEventListener('focus', refresh); window.addEventListener('ans:staging-updated', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); window.removeEventListener('ans:staging-updated', refresh); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!showColumns) return;
    const outside = (event: MouseEvent) => { if (!settingsRef.current?.contains(event.target as Node)) setShowColumns(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowColumns(false); };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [showColumns]);
  const modalKey = modal ? modal.kind === 'detail' ? `detail-${modal.id}` : modal.kind : '';
  useEffect(() => {
    if (!modalKey) return;
    const returnFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from<HTMLElement>(dialog.querySelectorAll('button:not([disabled]), input, select, textarea, a[href]'));
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); returnFocus?.focus(); };
  }, [modalKey]);

  function query(event: React.FormEvent) {
    event.preventDefault();
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) { setNotice('入仓开始日期不能晚于结束日期'); return; }
    setApplied({ ...draft }); setSelectedIds([]); setPage(1);
  }
  function reset() { setDraft(EMPTY_INSTRUCTION_LIST_FILTERS); setApplied(EMPTY_INSTRUCTION_LIST_FILTERS); setSelectedIds([]); setPage(1); }
  function changeTab(next: InstructionListTab) { setTab(next); setPage(1); setSelectedIds([]); }
  function saveColumns(next: ColumnKey[]) { setVisibleColumns(next); try { localStorage.setItem(COLUMN_KEY, JSON.stringify(next)); } catch { /* Still apply settings for this visit. */ } }
  function toggleColumn(key: ColumnKey) {
    if (visibleColumns.length === 1 && visibleColumns.includes(key)) return;
    saveColumns(visibleColumns.includes(key) ? visibleColumns.filter(column => column !== key) : [...visibleColumns, key]);
  }
  function exportRows() {
    const rows = selected.length ? selected : visible;
    if (!rows.length) return;
    const url = URL.createObjectURL(new Blob([exportInstructionListCsv(rows)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `指令列表_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`已导出${selected.length ? '所选' : '当前结果'} ${rows.length} 条指令`);
  }
  function confirmTransition(event: React.FormEvent) {
    event.preventDefault();
    if (modal?.kind !== 'transition') return;
    const latest = loadInstructionListState();
    const targets = latest.records.filter(row => modal.ids.includes(row.id));
    if (targets.length !== modal.ids.length || targets.some(row => row.tab !== '待确认')) { setError('所选指令状态已变更，请关闭弹窗并刷新列表后重试。'); setData(latest); return; }
    const next = transitionInstructionList(latest, modal.ids, modal.action);
    try { persistInstructionListState(next); }
    catch { setError('本地存储不可用或空间不足，请检查浏览器设置后重试。'); return; }
    setData(next); setSelectedIds([]); setModal(null); setError('');
    setNotice(`已${modal.action === 'approve' ? '审批通过' : modal.action === 'confirm' ? '确认' : '取消'} ${targets.length} 条指令`);
  }
  function openLogs(ids: string[]) { setError(''); setModal({ kind: 'logs', ids }); }
  function renderCell(row: InstructionListRecord, key: ColumnKey) {
    if (key === 'names') return <div className="space-y-1 py-0.5 font-medium text-slate-700">{row.names.map((name, index) => <div key={`${name}-${index}`} className="truncate" title={name}>{name}</div>)}</div>;
    if (key === 'status') {
      const text = displayInstructionStatus(row);
      const color = text === '拦截失败' || row.status === '已驳回' ? 'bg-rose-50 text-rose-600 border-rose-100' : text === '拦截成功' || row.status === '已处理' && text !== '待海外仓回传' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : text === '待海外仓回传' || row.status === '已取消' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-100';
      return <div><span className={`inline-block px-2 py-0.5 rounded border text-[11px] whitespace-nowrap ${color}`}>{text}</span>{row.processingResult && row.processingResult !== text && <p className="mt-1 text-[10px] text-slate-400">处理结果：{row.processingResult}</p>}</div>;
    }
    if (key === 'failureReason') return <p className="text-xs text-rose-500 whitespace-pre-wrap break-words leading-relaxed">{getInstructionFailureReason(row) || '—'}</p>;
    if (key === 'photo') return row.photo ? <div className="flex items-center gap-2 p-2 border border-slate-200 rounded bg-slate-50"><ImageIcon className="w-4 h-4 shrink-0 text-slate-400" /><span className="truncate text-[11px] text-slate-500" title={row.photo}>{row.photo}</span></div> : <span className="text-slate-400">暂无图片</span>;
    if (key === 'fee') return <div className="text-right tabular-nums whitespace-nowrap">{row.fee.toFixed(2)} <span className="text-[10px] text-slate-400">{row.currency}</span></div>;
    if (key === 'weight' || key === 'volume' || key === 'packages') return <span className="block text-right tabular-nums">{row[key].toLocaleString('zh-CN', { maximumFractionDigits: key === 'volume' ? 6 : 3 })}</span>;
    return <div className={`truncate ${['shipment', 'reference', 'created', 'updated', 'overseasTime'].includes(key) ? 'font-mono text-[11px]' : ''}`} title={String(row[key])}>{row[key] === '' ? '—' : String(row[key])}</div>;
  }
  function renderLog(log: InstructionListLog) {
    return <div key={log.id} className="border border-slate-200 rounded-lg overflow-hidden"><div className="bg-slate-50 px-4 py-2.5 flex justify-between flex-wrap gap-2 text-xs"><strong className="font-semibold text-slate-700">{log.action}<span className="ml-2 font-normal text-slate-400">{log.operator}</span></strong><time className="text-slate-400" dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}</time></div><div className="p-4 text-xs space-y-2"><p className="font-mono text-slate-400">{log.instructionNo}</p><p className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{log.detail}</p>{(log.before || log.after) && <p className="text-slate-400">{log.before || '—'} <span className="mx-2">→</span><span className="text-[#5c67f2]">{log.after || '—'}</span></p>}</div></div>;
  }

  return <div className="h-full min-h-0 flex flex-col gap-5">
    <div className="flex items-center gap-3 shrink-0"><div className="w-10 h-10 rounded-lg bg-[#5c67f2]/10 text-[#5c67f2] flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div><div><h1 className="text-base font-bold text-slate-800">指令列表</h1><p className="text-xs text-slate-400 mt-0.5">海外中转单 / 指令查询与确认</p></div><span className="ml-1 px-1.5 py-0.5 text-[10px] text-slate-400 rounded border border-slate-200 bg-white">本地数据</span></div>

    <form onSubmit={query} className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm shrink-0 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {([{ key: 'instructionNo', label: '指令单号' }, { key: 'waybill', label: '运单号' }, { key: 'shipment', label: 'Shipment ID' }, { key: 'reference', label: 'Reference ID' }] as const).map(field => <label key={field.key} className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">{field.label}<input value={draft[field.key]} onChange={event => setFilter(field.key, event.target.value)} placeholder="支持批量，使用空格或逗号分隔" className={inputClass} /></label>)}
      </div>
      {expanded && <div id="instruction-list-filters" className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">客户简称<input value={draft.customer} onChange={event => setFilter('customer', event.target.value)} placeholder="请输入客户简称" className={inputClass} /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">业务员<select value={draft.salesman} onChange={event => setFilter('salesman', event.target.value)} className={inputClass}><option value="">全部业务员</option>{options('salesman').map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">跟单代表<input value={draft.merchandiser} onChange={event => setFilter('merchandiser', event.target.value)} placeholder="请输入跟单代表" className={inputClass} /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">仓库代码<input value={draft.warehouse} onChange={event => setFilter('warehouse', event.target.value)} placeholder="请输入仓库代码" className={inputClass} /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">下单类型<select value={draft.orderType} onChange={event => setFilter('orderType', event.target.value)} className={inputClass}><option value="">全部下单类型</option>{options('orderType').map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">指令单类型<select value={draft.instructionType} onChange={event => setFilter('instructionType', event.target.value)} className={inputClass}><option value="">全部指令类型</option>{options('instructionType').map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">是否到达海外仓<select value={draft.arrived} onChange={event => setFilter('arrived', event.target.value)} className={inputClass}><option value="">全部</option><option>是</option><option>否</option></select></label>
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500"><span>入仓时间</span><div className="grid grid-cols-2 gap-2"><input aria-label="入仓开始日期" type="date" value={draft.dateFrom} onChange={event => setFilter('dateFrom', event.target.value)} className={inputClass} /><input aria-label="入仓结束日期" type="date" value={draft.dateTo} onChange={event => setFilter('dateTo', event.target.value)} className={inputClass} /></div></div>
      </div>}
      <div className="flex gap-2"><button type="submit" className={primaryButton}><Search className="w-3.5 h-3.5" />查询</button><button type="button" onClick={reset} className={secondaryButton}><RotateCcw className="w-3.5 h-3.5" />重置</button><button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="instruction-list-filters" className={secondaryButton}>{expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}{expanded ? '收起' : '展开'}</button></div>
    </form>

    <section aria-label="指令列表明细" className="bg-white border border-slate-200 rounded-lg shadow-sm flex-1 min-h-[240px] flex flex-col">
      <div role="tablist" aria-label="指令状态" className="flex items-center gap-5 px-5 border-b border-slate-200 overflow-x-auto shrink-0 min-h-14">{INSTRUCTION_LIST_TABS.map(key => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => changeTab(key)} className={`py-4 border-b-2 text-xs font-semibold whitespace-nowrap cursor-pointer ${tab === key ? 'text-[#5c67f2] border-[#5c67f2]' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>{key}<span className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] ${tab === key ? 'bg-indigo-50' : 'bg-slate-100'}`}>{key === '全部' ? filtered.length : filtered.filter(row => row.tab === key).length}</span></button>)}</div>
      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between gap-3 flex-wrap shrink-0">
        <div className="flex gap-2 items-center flex-wrap">
          {tab === '待确认' && <button type="button" disabled={!canTransition} onClick={() => { setError(''); setModal({ kind: 'transition', action: 'approve', ids: selected.map(row => row.id) }); }} className={primaryButton} title={selected.length ? '审批所选待确认指令' : '请先勾选需要审批的指令'}><CheckCircle className="w-3.5 h-3.5" />批量审批</button>}
          <button type="button" onClick={() => { setError(''); setModal({ kind: 'transition', action: 'cancel', ids: selected.map(row => row.id) }); }} disabled={!canTransition} className={secondaryButton} title="取消所选待确认指令"><XCircle className="w-3.5 h-3.5" />取消下单</button>
          <button type="button" disabled={!canTransition} onClick={() => { setError(''); setModal({ kind: 'transition', action: 'confirm', ids: selected.map(row => row.id) }); }} className={secondaryButton}><CheckCircle className="w-3.5 h-3.5" />已确认</button>
          <button type="button" onClick={exportRows} disabled={!visible.length} className={secondaryButton}><Download className="w-3.5 h-3.5" />{selected.length ? '导出所选' : '导出'}</button>
          <button type="button" onClick={() => openLogs(selected.map(row => row.id))} className={secondaryButton}><History className="w-3.5 h-3.5" />查看日志</button>
        </div>
        <div className="flex gap-3 items-center"><span className="text-xs text-slate-400">已选 <strong className="font-semibold text-[#5c67f2]">{selected.length}</strong> 条{selected.length > 0 && <button type="button" onClick={() => setSelectedIds([])} className="ml-2 text-[#5c67f2] hover:underline cursor-pointer">取消选择</button>}</span><div className="relative" ref={settingsRef}><button type="button" aria-label="指令列表设置" aria-expanded={showColumns} onClick={() => setShowColumns(!showColumns)} className={secondaryButton}><Settings className="w-3.5 h-3.5" />列设置</button>{showColumns && <div className="absolute right-0 top-full mt-2 w-60 max-h-[60vh] overflow-y-auto p-3 border border-slate-200 rounded-lg bg-white shadow-xl z-40"><div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100"><strong className="text-xs text-slate-700">显示列</strong><button type="button" onClick={() => saveColumns(defaults)} className="text-[11px] text-[#5c67f2] hover:underline cursor-pointer">恢复默认</button></div>{columns.map(column => <label key={column.key} className="flex items-center gap-2 px-1 py-2 text-xs text-slate-600 rounded hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={visibleColumns.length === 1 && visibleColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="w-3.5 h-3.5 accent-[#5c67f2]" />{column.label}</label>)}</div>}</div></div>
      </div>
      <div ref={scrollRef} className="overflow-auto flex-1 min-h-0">
        <table className="w-full text-xs text-left table-fixed border-collapse text-slate-600" style={{ minWidth: activeColumns.reduce((sum, column) => sum + column.width, 438) }}>
          <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-slate-500"><tr><th className="w-12 px-4 py-3.5 sticky left-0 z-30 bg-slate-50 border-r border-slate-100"><input ref={allRef} type="checkbox" aria-label="选择本页全部指令单" checked={allSelected} disabled={!pageRows.length} onChange={() => setSelectedIds(ids => allSelected ? ids.filter(id => !pageRows.some(row => row.id === id)) : [...new Set([...ids, ...pageRows.map(row => row.id)])])} className="w-3.5 h-3.5 accent-[#5c67f2] cursor-pointer" /></th><th scope="col" className="w-[180px] sticky left-12 z-30 px-3 py-3.5 bg-slate-50 border-r border-slate-100">运单号</th><th scope="col" className="w-[210px] sticky left-[228px] z-30 px-3 py-3.5 bg-slate-50 border-r border-slate-200 shadow-[3px_0_5px_-4px_#64748b]">指令单号</th>{activeColumns.map(column => <th key={column.key} scope="col" style={{ width: column.width }} className="px-3 py-3.5 border-r border-slate-100 whitespace-nowrap">{column.label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{pageRows.map(row => {
            const checked = selectedIds.includes(row.id); const failed = !!getInstructionFailureReason(row) || displayInstructionStatus(row) === '拦截失败';
            const bg = failed ? checked ? 'bg-rose-100' : 'bg-rose-50' : checked ? 'bg-indigo-50' : 'bg-white group-hover:bg-slate-50';
            return <tr key={row.id} className={`group ${failed ? checked ? 'bg-rose-100' : 'bg-rose-50' : checked ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}><td className={`px-4 py-4 sticky left-0 z-10 border-r border-slate-100 ${bg}`}><input type="checkbox" aria-label={`选择指令单 ${row.instructionNo}`} checked={checked} onChange={() => setSelectedIds(ids => ids.includes(row.id) ? ids.filter(id => id !== row.id) : [...ids, row.id])} className="w-3.5 h-3.5 accent-[#5c67f2] cursor-pointer" /></td><td className={`sticky left-12 z-10 px-3 py-4 font-mono text-[11px] border-r border-slate-100 ${bg}`}><span className="block truncate" title={row.waybill}>{row.waybill}</span></td><td className={`sticky left-[228px] z-10 px-3 py-4 border-r border-slate-200 shadow-[3px_0_5px_-4px_#64748b] ${bg}`}><button type="button" aria-label={`查看指令 ${row.instructionNo}`} onClick={() => { setError(''); setModal({ kind: 'detail', id: row.id }); }} className="max-w-full truncate font-mono text-[11px] text-[#5c67f2] hover:underline cursor-pointer">{row.instructionNo}</button></td>{activeColumns.map(column => <td key={column.key} className="px-3 py-4 border-r border-slate-100">{renderCell(row, column.key)}</td>)}</tr>;
          })}{!pageRows.length && <tr><td colSpan={activeColumns.length + 3} className="text-center py-16"><FileSearch className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm font-medium text-slate-500">暂无符合条件的指令数据</p><p className="text-xs text-slate-400 mt-1.5">请调整筛选条件或切换状态页签</p><button type="button" onClick={reset} className="text-xs text-[#5c67f2] mt-4 hover:underline cursor-pointer">重置筛选</button></td></tr>}</tbody>
        </table>
      </div>
      <div className="px-5 py-3.5 border-t border-slate-200 flex justify-between items-center flex-wrap gap-3 text-xs text-slate-500 shrink-0"><span>共 <strong className="font-semibold text-slate-700">{visible.length}</strong> 条{visible.length > 0 && <span className="ml-3 text-slate-400">显示 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visible.length)} 条</span>}</span><div className="flex items-center gap-2"><select aria-label="指令列表每页条数" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="px-2 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:border-[#5c67f2]">{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} 条/页</option>)}</select><button type="button" aria-label="指令列表上一页" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><ChevronLeft className="w-4 h-4" /></button><span className="rounded px-2.5 py-1.5 text-[#5c67f2] bg-[#5c67f2]/10 font-semibold">{page}</span><span className="text-slate-400">/ {pageCount}</span><button type="button" aria-label="指令列表下一页" disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><ChevronRight className="w-4 h-4" /></button><form className="flex items-center gap-2 ml-2" onSubmit={event => { event.preventDefault(); const next = Number(jumpPage); if (Number.isInteger(next) && next >= 1 && next <= pageCount) setPage(next); else setJumpPage(String(page)); }}><label htmlFor="instruction-list-page">前往</label><input id="instruction-list-page" type="number" min="1" max={pageCount} value={jumpPage} onChange={event => setJumpPage(event.target.value)} className="w-12 px-1.5 py-1.5 border border-slate-200 rounded text-center focus:outline-none focus:border-[#5c67f2]" /><span>页</span><button type="submit" className="text-[#5c67f2] hover:underline cursor-pointer">确定</button></form></div></div>
    </section>

    {notice && createPortal(<div role="status" className="fixed top-28 left-1/2 -translate-x-1/2 z-60 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs text-slate-700 flex items-center gap-2"><Check className="w-4 h-4 text-[#5c67f2]" />{notice}<button type="button" aria-label="关闭指令列表提示" onClick={() => setNotice('')} className="ml-3 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button></div>, document.body)}
    {modal && createPortal(<div className={`fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm ${modal.kind === 'detail' ? 'flex justify-end' : 'flex items-center justify-center p-5'}`}>
      <aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="instruction-list-dialog-title" className={`bg-white border border-slate-200 shadow-2xl flex flex-col ${modal.kind === 'detail' ? 'h-full w-[560px] max-w-full' : 'w-full max-w-2xl max-h-[90vh] rounded-xl'}`}>
        <div className={`px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 ${modal.kind === 'detail' ? '' : 'rounded-t-xl'}`}><h2 id="instruction-list-dialog-title" className="text-sm font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#5c67f2]" />{modal.kind === 'detail' ? detail?.instructionType === '自提' ? '自提指令详情' : '指令详情' : modal.kind === 'logs' ? '操作日志' : modal.action === 'approve' ? '批量审批' : modal.action === 'confirm' ? '确认指令' : '取消下单'}</h2><button type="button" aria-label="关闭指令列表弹窗" onClick={() => setModal(null)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"><X className="w-4 h-4" /></button></div>
        {modal.kind === 'detail' && detail ? <><div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-5"><div className="p-4 bg-indigo-50/60 rounded-lg border border-indigo-100"><p className="font-mono text-xs font-semibold text-[#5c67f2] break-all">{detail.instructionNo}</p><div className="mt-3">{renderCell(detail, 'status')}</div></div><dl className="grid grid-cols-2 gap-x-5 gap-y-4">{[
          ['运单号', detail.waybill], ['指令名称', detail.names.join(' / ')], ['状态页签', detail.tab], ['指令单类型', detail.instructionType], ['创建时间', detail.created], ['修改时间', detail.updated], ['客户简称', detail.customer], ['仓库代码', detail.warehouse], ['Shipment ID', detail.shipment], ['Reference ID', detail.reference], ['预计提货时间', detail.expectedPickupTime], ['提货联系人', detail.pickupContact], ['联系电话', detail.pickupPhone], ['目的地', detail.destination], ['指令费用', `${detail.fee.toFixed(2)} ${detail.currency}`], ['发货件数', String(detail.packages)], ['重量（kg）', String(detail.weight)], ['方数（m³）', String(detail.volume)], ['是否到达海外仓', detail.arrived], ['入仓时间（海外仓）', detail.overseasTime], ['拦截原因', detail.interceptReason], ['失败原因', getInstructionFailureReason(detail)], ['关联托盘', detail.palletLabel], ['作业备注', detail.remark],
        ].filter(([label, value]) => value || !['预计提货时间', '提货联系人', '联系电话', '关联托盘', '作业备注', '拦截原因', '失败原因'].includes(label)).map(([label, value]) => <div key={label} className="border-b border-slate-100 pb-3"><dt className="text-xs text-slate-400 mb-1.5">{label}</dt><dd className="text-xs text-slate-700 break-words leading-relaxed whitespace-pre-wrap">{value || '—'}</dd></div>)}</dl></div><div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0"><button type="button" onClick={() => openLogs([detail.id])} className={secondaryButton}><History className="w-3.5 h-3.5" />查看日志</button><button type="button" onClick={() => setModal(null)} className={secondaryButton}>关闭</button></div></> : modal.kind === 'logs' ? <><div className="p-6 overflow-y-auto min-h-0 flex-1">{logs.length ? <div className="space-y-4">{logs.map(renderLog)}</div> : <div className="text-center py-12"><History className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm font-medium text-slate-500">暂无操作日志</p><p className="text-xs text-slate-400 mt-2">审批、确认或取消指令后，将在此记录变更</p></div>}</div><div className="px-6 py-4 border-t border-slate-200 flex justify-end shrink-0"><button type="button" onClick={() => setModal(null)} className={secondaryButton}>关闭</button></div></> : modal.kind === 'transition' ? <form onSubmit={confirmTransition} className="flex flex-col min-h-0">
          <div className="p-6 overflow-y-auto min-h-0 space-y-4">
            <p className="text-sm text-slate-700">{modal.action === 'approve' ? '审批通过所选指令？通过后可在“已确认”页签查看。' : modal.action === 'confirm' ? '确认所选指令？确认后可在“已确认”页签查看。' : '取消所选指令？取消后可在“取消”页签查看。'}</p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-500">共 <strong className="text-[#5c67f2]">{modal.ids.length}</strong> 条待确认指令</div>
            <ul className="max-h-48 overflow-y-auto space-y-2 font-mono text-[11px] text-slate-500">{data.records.filter(row => modal.ids.includes(row.id)).map(row => <li key={row.id}>{row.instructionNo}</li>)}</ul>
            {error && <p role="alert" className="text-xs p-3 rounded bg-rose-50 text-rose-600">{error}</p>}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={() => setModal(null)} className={secondaryButton}>返回</button>
            <button type="submit" className={primaryButton}>{modal.action === 'approve' ? '审批通过' : modal.action === 'confirm' ? '确认所选指令' : '确认取消下单'}</button>
          </div>
        </form> : null}
      </aside>
    </div>, document.body)}
  </div>;
}
