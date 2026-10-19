import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, FileSearch, History, MapPin, Package, RotateCcw, Search, Settings, X } from 'lucide-react';
import { EMPTY_STAGING_FILTERS, INITIAL_STAGING_RECORDS, exportStagingCsv, filterStagingRecords, summarizeStagingRecords, type StagingFilters, type StagingLog, type StagingRecord, type StagingStatus } from '../stagingData';
import { INITIAL_INSTRUCTIONS, type Instruction } from '../instructionData';

const STORAGE_KEY = 'ans_staging_management_v1';
const COLUMN_KEY = 'ans_staging_columns_v1';
const currencyNames: Record<string, string> = { USD: '美元', CNY: '人民币', EUR: '欧元', GBP: '英镑' };
const columns = [
  { key: 'clientName', label: '客户名称', width: 100, sortable: true },
  { key: 'containerNo', label: '柜号', width: 130 },
  { key: 'systemContainerNo', label: '系统柜号', width: 175 },
  { key: 'inboundNo', label: '入仓号', width: 160 },
  { key: 'intercepted', label: '是否拦截', width: 90 },
  { key: 'transferMode', label: '转运方式', width: 90 },
  { key: 'destination', label: '目的地', width: 150 },
  { key: 'deliveryMethod', label: '派送方式', width: 130 },
  { key: 'palletLabel', label: '托盘标签', width: 280 },
  { key: 'inboundTime', label: '入库时间', width: 168, sortable: true },
  { key: 'weight', label: '重量（kg）', width: 110, numeric: true, sortable: true },
  { key: 'volume', label: '体积（m³）', width: 110, numeric: true, sortable: true },
  { key: 'boxCount', label: '总箱数', width: 90, numeric: true, sortable: true },
  { key: 'pendingBoxes', label: '待审核箱数', width: 110, numeric: true, sortable: true },
  { key: 'unshippedBoxes', label: '未发货箱数', width: 110, numeric: true, sortable: true },
  { key: 'shippedBoxes', label: '已发货箱数', width: 110, numeric: true, sortable: true },
  { key: 'location', label: '库位', width: 120, hidden: true },
] satisfies { key: keyof StagingRecord; label: string; width: number; numeric?: boolean; sortable?: boolean; hidden?: boolean }[];
type ColumnKey = typeof columns[number]['key'];
const defaultColumns = columns.filter(column => !('hidden' in column && column.hidden)).map(column => column.key);
const statusTabs: { status: StagingStatus; label: string }[] = [
  { status: '暂存', label: '暂存' }, { status: '待出库', label: '指令处理完成，待出库' }, { status: '已出库', label: '已出库' },
];
const inputClass = 'w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-[#5c67f2] focus:ring-2 focus:ring-[#5c67f2]/10 transition-all';
const secondaryButton = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
const primaryButton = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-[#5c67f2] text-white hover:bg-[#4a55e0] shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

interface StagingOrder {
  id: string; recordId: string; instructionId: string; instructionName: string; quantity: number;
  unit: string; price: number; currency: string; remark: string; createdAt: string;
}
interface StagingData { records: StagingRecord[]; logs: StagingLog[]; orders: StagingOrder[] }
type Modal = { kind: 'location' } | { kind: 'order'; record: StagingRecord } | { kind: 'logs'; record: StagingRecord } | null;

function loadData(): StagingData {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.records) && saved.records.every((row: StagingRecord) => row &&
      ['id', 'clientName', 'containerNo', 'systemContainerNo', 'inboundNo', 'transferMode', 'destination', 'deliveryMethod', 'palletLabel', 'inboundTime', 'location'].every(key => typeof row[key as keyof StagingRecord] === 'string') &&
      ['weight', 'volume', 'boxCount', 'pendingBoxes', 'unshippedBoxes', 'shippedBoxes'].every(key => typeof row[key as keyof StagingRecord] === 'number' && Number.isFinite(row[key as keyof StagingRecord]) && Number(row[key as keyof StagingRecord]) >= 0) &&
      typeof row.intercepted === 'boolean' && ['暂存', '待出库', '已出库'].includes(row.status))) {
      const logs = Array.isArray(saved.logs) ? saved.logs.filter((log: StagingLog) => log && ['id', 'recordId', 'timestamp', 'operator', 'action', 'detail'].every(key => typeof log[key as keyof StagingLog] === 'string')) : [];
      const orders = Array.isArray(saved.orders) ? saved.orders.filter((order: StagingOrder) => order && typeof order.id === 'string' && typeof order.recordId === 'string') : [];
      return { records: saved.records, logs, orders };
    }
  } catch { /* Recover to example data if no readable local state exists. */ }
  return { records: INITIAL_STAGING_RECORDS, logs: [], orders: [] };
}

function loadColumns(): ColumnKey[] {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_KEY) || 'null');
    if (Array.isArray(saved)) {
      const valid = columns.filter(column => saved.includes(column.key)).map(column => column.key);
      if (valid.length) return valid;
    }
  } catch { /* Show the default inventory fields. */ }
  return defaultColumns;
}

function loadInstructions(): Instruction[] {
  try {
    const saved = JSON.parse(localStorage.getItem('ans_instruction_management_v1') || 'null');
    if (Array.isArray(saved?.instructions)) return saved.instructions.filter((row: Instruction) => row && row.status === '启用' &&
      typeof row.id === 'string' && typeof row.name === 'string' && typeof row.code === 'string' && typeof row.unit === 'string' &&
      typeof row.currency === 'string' && Number.isFinite(row.price) && row.price >= 0);
  } catch { /* Use the initial fee instructions when no saved settings exist. */ }
  return INITIAL_INSTRUCTIONS.filter(row => row.status === '启用');
}

export default function StagingManagement() {
  const [data, setData] = useState<StagingData>(loadData);
  const [filters, setFilters] = useState<StagingFilters>(EMPTY_STAGING_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<StagingFilters>(EMPTY_STAGING_FILTERS);
  const [expanded, setExpanded] = useState(false);
  const [activeStatus, setActiveStatus] = useState<StagingStatus>('暂存');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jumpPage, setJumpPage] = useState('1');
  const [sort, setSort] = useState<{ key: keyof StagingRecord; ascending: boolean } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(loadColumns);
  const [popover, setPopover] = useState<'columns' | 'export' | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [location, setLocation] = useState('');
  const [availableInstructions, setAvailableInstructions] = useState<Instruction[]>([]);
  const [instructionId, setInstructionId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const allRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clients = useMemo(() => [...new Set([...INITIAL_STAGING_RECORDS, ...data.records].map(row => row.clientName))], [data.records]);
  const transferModes = useMemo(() => [...new Set([...INITIAL_STAGING_RECORDS, ...data.records].map(row => row.transferMode))], [data.records]);
  const deliveryMethods = useMemo(() => [...new Set([...INITIAL_STAGING_RECORDS, ...data.records].map(row => row.deliveryMethod))], [data.records]);
  const filtered = useMemo(() => filterStagingRecords(data.records, appliedFilters), [data.records, appliedFilters]);
  const tabRows = useMemo(() => filtered.filter(row => row.status === activeStatus).sort((a, b) => {
    if (!sort) return 0;
    const left = a[sort.key]; const right = b[sort.key];
    const compared = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'zh-CN', { numeric: true });
    return sort.ascending ? compared : -compared;
  }), [filtered, activeStatus, sort]);
  const pageCount = Math.max(1, Math.ceil(tabRows.length / pageSize));
  const pageRows = tabRows.slice((page - 1) * pageSize, page * pageSize);
  const selected = tabRows.filter(row => selectedIds.includes(row.id));
  const totals = summarizeStagingRecords(selected);
  const allSelected = pageRows.length > 0 && pageRows.every(row => selectedIds.includes(row.id));
  const someSelected = pageRows.some(row => selectedIds.includes(row.id));
  const activeColumns = columns.filter(column => visibleColumns.includes(column.key));
  const instruction = availableInstructions.find(item => item.id === instructionId);
  const modalLogs = modal?.kind === 'logs' ? data.logs.filter(log => log.recordId === modal.record.id).slice().reverse() : [];
  const updateFilter = (key: keyof StagingFilters, value: string) => setFilters(previous => ({ ...previous, [key]: value }));

  useEffect(() => { if (allRef.current) allRef.current.indeterminate = someSelected && !allSelected; }, [someSelected, allSelected]);
  useEffect(() => { setPage(current => Math.min(current, pageCount)); }, [pageCount]);
  useEffect(() => { setJumpPage(String(page)); if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [page, pageSize, activeStatus, appliedFilters]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!popover) return;
    const onClick = (event: MouseEvent) => { if (!popoverRef.current?.contains(event.target as Node)) setPopover(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setPopover(null); };
    document.addEventListener('mousedown', onClick); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [popover]);
  const modalKey = modal ? modal.kind === 'location' ? 'location' : `${modal.kind}-${modal.record.id}` : '';
  useEffect(() => {
    if (!modalKey) return;
    const returnFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    (dialog?.querySelector<HTMLElement>('input, select, button'))?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from<HTMLElement>(dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select, textarea, a[href]'));
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); returnFocus?.focus(); };
  }, [modalKey]);

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    if (filters.inboundFrom && filters.inboundTo && filters.inboundFrom > filters.inboundTo) { setNotice('入库开始日期不能晚于结束日期'); return; }
    setAppliedFilters({ ...filters }); setPage(1); setSelectedIds([]);
  }
  function resetSearch() { setFilters(EMPTY_STAGING_FILTERS); setAppliedFilters(EMPTY_STAGING_FILTERS); setPage(1); setSelectedIds([]); }
  function changeStatus(status: StagingStatus) { setActiveStatus(status); setPage(1); setSelectedIds([]); setPopover(null); }
  function saveData(next: StagingData): boolean {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { setError('本地存储不可用或空间不足，请检查浏览器设置后重试。'); return false; }
    setData(next); return true;
  }
  function newLog(recordId: string, action: string, detail: string): StagingLog {
    return { id: crypto.randomUUID(), recordId, timestamp: new Date().toISOString(), operator: '天朗', action, detail };
  }
  function openOrder(record: StagingRecord) {
    const instructions = loadInstructions();
    setAvailableInstructions(instructions); setInstructionId(instructions[0]?.id || '');
    setQuantity('1'); setRemark(''); setError(''); setModal({ kind: 'order', record });
  }
  function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    if (modal?.kind !== 'order' || !instruction) { setError('请选择可用的费用指令'); return; }
    const count = Number(quantity);
    if (!Number.isFinite(count) || count <= 0) { setError('指令数量必须大于 0'); return; }
    const order: StagingOrder = { id: crypto.randomUUID(), recordId: modal.record.id, instructionId: instruction.id, instructionName: instruction.name,
      quantity: count, unit: instruction.unit, price: instruction.price, currency: instruction.currency, remark: remark.trim(), createdAt: new Date().toISOString() };
    const detail = `费用指令：${instruction.name}（${instruction.code}）；数量：${count} ${instruction.unit}；计费单价：${instruction.price.toFixed(2)} ${instruction.currency}${order.remark ? `；备注：${order.remark}` : ''}`;
    if (saveData({ ...data, orders: [...data.orders, order], logs: [...data.logs, newLog(modal.record.id, '创建指令', detail)] })) {
      setModal(null); setNotice('指令已创建，详情已记录到操作日志');
    }
  }
  function changeLocation(event: React.FormEvent) {
    event.preventDefault();
    const nextLocation = location.trim();
    if (!nextLocation) { setError('请输入新库位'); return; }
    const changes = selected.filter(row => row.status !== '已出库' && row.location !== nextLocation);
    if (!changes.length) { setModal(null); setNotice('所选托盘已在该库位，无需更换'); return; }
    const ids = new Set(changes.map(row => row.id));
    const updated = { ...data, records: data.records.map(row => ids.has(row.id) ? { ...row, location: nextLocation } : row),
      logs: [...data.logs, ...changes.map(row => newLog(row.id, '更换库位', `${row.location || '未分配'} → ${nextLocation}`))] };
    if (saveData(updated)) { setModal(null); setNotice(`已为 ${changes.length} 个托盘更换库位`); }
  }
  function downloadRows(onlySelected: boolean) {
    const records = onlySelected ? selected : tabRows;
    if (!records.length) return;
    const url = URL.createObjectURL(new Blob([exportStagingCsv(records)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `暂存管理_${activeStatus}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPopover(null); setNotice(`已导出${onlySelected ? '所选' : '当前结果'} ${records.length} 条库存记录`);
  }
  function persistColumns(next: ColumnKey[]) { setVisibleColumns(next); try { localStorage.setItem(COLUMN_KEY, JSON.stringify(next)); } catch { /* Current-visit settings remain usable. */ } }
  function toggleColumn(key: ColumnKey) {
    if (visibleColumns.length === 1 && visibleColumns.includes(key)) return;
    persistColumns(visibleColumns.includes(key) ? visibleColumns.filter(column => column !== key) : [...visibleColumns, key]);
  }
  function renderCell(row: StagingRecord, key: ColumnKey) {
    if (key === 'intercepted') return row.intercepted ? <span className="inline-flex items-center gap-1 rounded bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 text-[11px] font-medium"><span className="w-1 h-1 rounded-full bg-rose-400" />拦截</span> : <span className="text-slate-400">未拦截</span>;
    if (key === 'weight') return row.weight.toLocaleString('zh-CN', { maximumFractionDigits: 3 });
    if (key === 'volume') return row.volume.toLocaleString('zh-CN', { minimumFractionDigits: 3, maximumFractionDigits: 6 });
    return <div className={`truncate ${['containerNo', 'systemContainerNo', 'inboundNo', 'palletLabel'].includes(key) ? 'font-mono text-[11px]' : ''}`} title={String(row[key])}>{row[key] === '' ? '—' : row[key]}</div>;
  }

  return <div className="h-full min-h-0 flex flex-col gap-5">
    <div className="flex items-center gap-3 shrink-0"><div className="w-10 h-10 rounded-lg bg-[#5c67f2]/10 text-[#5c67f2] flex items-center justify-center"><Package className="w-5 h-5" /></div><div><div className="flex gap-2 items-center"><h1 className="text-base font-bold text-slate-800">暂存管理</h1><span className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 bg-white text-slate-400">示例数据</span></div><p className="text-xs text-slate-400 mt-0.5">海外中转单 / 暂存库存与作业指令</p></div></div>

    <form onSubmit={applySearch} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm shrink-0 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">关键字<input value={filters.keyword} onChange={event => updateFilter('keyword', event.target.value)} placeholder="柜号 / 入仓号 / 托盘标签，单个精准搜索" className={inputClass} /></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">客户名称<select value={filters.clientName} onChange={event => updateFilter('clientName', event.target.value)} className={inputClass}><option value="">全部客户</option>{clients.map(client => <option key={client}>{client}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">入仓号<input value={filters.inboundNos} onChange={event => updateFilter('inboundNos', event.target.value)} placeholder="支持批量，多个入仓号用分号分隔" className={inputClass} /></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">转运方式<select value={filters.transferMode} onChange={event => updateFilter('transferMode', event.target.value)} className={inputClass}><option value="">全部方式</option>{transferModes.map(mode => <option key={mode}>{mode}</option>)}</select></label>
      </div>
      {expanded && <div id="staging-advanced-filters" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">柜号<input value={filters.containerNo} onChange={event => updateFilter('containerNo', event.target.value)} placeholder="请输入柜号" className={inputClass} /></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">系统柜号<input value={filters.systemContainerNo} onChange={event => updateFilter('systemContainerNo', event.target.value)} placeholder="请输入系统柜号" className={inputClass} /></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">目的地<input value={filters.destination} onChange={event => updateFilter('destination', event.target.value)} placeholder="仓库代码 / 地址" className={inputClass} /></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">派送方式<select value={filters.deliveryMethod} onChange={event => updateFilter('deliveryMethod', event.target.value)} className={inputClass}><option value="">全部派送方式</option>{deliveryMethods.map(method => <option key={method}>{method}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">拦截状态<select value={filters.intercepted} onChange={event => updateFilter('intercepted', event.target.value)} className={inputClass}><option value="">全部状态</option><option value="true">拦截</option><option value="false">未拦截</option></select></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">入库开始日期<input type="date" value={filters.inboundFrom} onChange={event => updateFilter('inboundFrom', event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1.5">入库结束日期<input type="date" value={filters.inboundTo} onChange={event => updateFilter('inboundTo', event.target.value)} className={inputClass} /></label>
      </div>}
      <div className="flex gap-2 items-center"><button type="submit" className={primaryButton}><Search className="w-3.5 h-3.5" />搜索</button><button type="button" className={secondaryButton} onClick={resetSearch}><RotateCcw className="w-3.5 h-3.5" />重置</button><button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="staging-advanced-filters" className={secondaryButton}>{expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}{expanded ? '收起' : '展开'}</button></div>
    </form>

    <section aria-label="暂存库存列表" className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[220px] flex-1 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-5 border-b border-slate-200 shrink-0 flex-wrap">
        <div role="tablist" aria-label="库存状态" className="flex gap-5 min-h-14 overflow-x-auto">
          {statusTabs.map(tab => <button key={tab.status} type="button" role="tab" aria-selected={activeStatus === tab.status} onClick={() => changeStatus(tab.status)} className={`text-xs font-semibold whitespace-nowrap py-4 border-b-2 transition-colors cursor-pointer ${activeStatus === tab.status ? 'border-[#5c67f2] text-[#5c67f2]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{tab.label}<span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${activeStatus === tab.status ? 'bg-indigo-50' : 'bg-slate-100'}`}>{filtered.filter(row => row.status === tab.status).length}</span></button>)}
        </div>
        <div className="relative flex items-center gap-2 py-3" ref={popoverRef}>
          <button type="button" className={secondaryButton} disabled={!selected.length || activeStatus === '已出库'} onClick={() => { setLocation(''); setError(''); setModal({ kind: 'location' }); setPopover(null); }}><MapPin className="w-3.5 h-3.5" />更换库位</button>
          <button type="button" className={primaryButton} disabled={!tabRows.length} aria-expanded={popover === 'export'} onClick={() => setPopover(popover === 'export' ? null : 'export')}><Download className="w-3.5 h-3.5" />导出<ChevronDown className="w-3 h-3" /></button>
          <button type="button" aria-label="暂存列设置" aria-expanded={popover === 'columns'} className={secondaryButton} onClick={() => setPopover(popover === 'columns' ? null : 'columns')}><Settings className="w-3.5 h-3.5" /><span>列设置</span></button>
          {popover === 'export' && <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-1.5"><button type="button" onClick={() => downloadRows(false)} className="w-full text-left text-xs text-slate-600 px-3 py-2.5 hover:bg-slate-50 rounded cursor-pointer">导出当前结果（{tabRows.length}）</button><button type="button" disabled={!selected.length} onClick={() => downloadRows(true)} className="w-full text-left text-xs text-slate-600 px-3 py-2.5 hover:bg-slate-50 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">导出所选（{selected.length}）</button></div>}
          {popover === 'columns' && <div className="absolute top-full right-0 mt-1 w-56 max-h-[60vh] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-3"><div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100"><span className="text-xs font-bold text-slate-700">显示列</span><button type="button" className="text-[11px] text-[#5c67f2] hover:underline cursor-pointer" onClick={() => persistColumns(defaultColumns)}>恢复默认</button></div>{columns.map(column => <label key={column.key} className="flex items-center gap-2 p-2 text-xs text-slate-600 hover:bg-slate-50 rounded cursor-pointer"><input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={visibleColumns.length === 1 && visibleColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="w-3.5 h-3.5 accent-[#5c67f2]" />{column.label}</label>)}</div>}
        </div>
      </div>
      <div aria-label="已选库存汇总" className="px-5 py-3 flex gap-x-6 gap-y-2 items-center flex-wrap bg-slate-50/70 border-b border-slate-100 text-xs text-slate-500 shrink-0"><span className="font-semibold text-slate-600">已选择内容</span>{[{ label: '总托盘数', value: totals.pallets, unit: '' }, { label: '总箱数', value: totals.boxes, unit: '' }, { label: '总柜数', value: totals.containers, unit: '' }, { label: '总重量', value: totals.weight.toLocaleString('zh-CN', { maximumFractionDigits: 3 }), unit: ' kg' }, { label: '总体积', value: totals.volume.toLocaleString('zh-CN', { minimumFractionDigits: 3, maximumFractionDigits: 6 }), unit: ' m³' }].map(item => <span key={item.label}>{item.label}：<strong className="font-semibold text-[#5c67f2] tabular-nums">{item.value}</strong><span className="text-slate-400">{item.unit}</span></span>)}{selected.length > 0 && <button type="button" onClick={() => setSelectedIds([])} className="text-[#5c67f2] ml-auto hover:underline cursor-pointer">取消选择</button>}</div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse text-xs text-left text-slate-600" style={{ minWidth: activeColumns.reduce((sum, column) => sum + column.width, 204) }}>
          <thead className="sticky top-0 bg-slate-50 z-10 text-slate-500 border-b border-slate-200"><tr><th scope="col" className="w-10 px-2 py-3.5 text-center">#</th><th className="w-12 px-4 py-3.5 border-r border-slate-100"><input ref={allRef} aria-label="选择本页全部暂存记录" type="checkbox" checked={allSelected} disabled={!pageRows.length} onChange={() => setSelectedIds(ids => allSelected ? ids.filter(id => !pageRows.some(row => row.id === id)) : [...new Set([...ids, ...pageRows.map(row => row.id)])])} className="w-3.5 h-3.5 accent-[#5c67f2] cursor-pointer" /></th>
            {activeColumns.map(column => <th key={column.key} scope="col" style={{ width: column.width }} aria-sort={sort?.key === column.key ? sort.ascending ? 'ascending' : 'descending' : undefined} className={`px-3 py-3.5 whitespace-nowrap border-r border-slate-100 ${'numeric' in column && column.numeric ? 'text-right' : ''}`}>{'sortable' in column && column.sortable ? <button type="button" onClick={() => { setSort(current => ({ key: column.key, ascending: current?.key === column.key ? !current.ascending : true })); setPage(1); }} className="inline-flex items-center gap-1 hover:text-[#5c67f2] cursor-pointer">{column.label}{sort?.key === column.key ? sort.ascending ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 text-slate-300" />}</button> : column.label}</th>)}
            <th scope="col" className="w-[116px] sticky right-0 bg-slate-50 border-l border-slate-200 px-3 py-3.5 text-center">操作</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{pageRows.map((row, index) => <tr key={row.id} className={`group ${selectedIds.includes(row.id) ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}><td className="px-2 py-4 text-center text-slate-400 tabular-nums">{(page - 1) * pageSize + index + 1}</td><td className="px-4 py-4 border-r border-slate-100"><input type="checkbox" aria-label={`选择托盘 ${row.palletLabel}`} checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(ids => ids.includes(row.id) ? ids.filter(id => id !== row.id) : [...ids, row.id])} className="w-3.5 h-3.5 accent-[#5c67f2] cursor-pointer" /></td>{activeColumns.map(column => <td key={column.key} className={`px-3 py-4 border-r border-slate-100 ${'numeric' in column && column.numeric ? 'text-right tabular-nums' : ''}`}>{renderCell(row, column.key)}</td>)}<td className={`px-3 py-4 sticky right-0 border-l border-slate-100 ${selectedIds.includes(row.id) ? 'bg-indigo-50' : 'bg-white group-hover:bg-slate-50'}`}><div className="flex items-center justify-center gap-3 whitespace-nowrap"><button type="button" aria-label={`下单 ${row.palletLabel}`} disabled={row.status === '已出库'} onClick={() => openOrder(row)} className="text-[#5c67f2] hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed cursor-pointer">{row.status === '已出库' ? '已出库' : '下单'}</button><button type="button" aria-label={`查看托盘日志 ${row.palletLabel}`} onClick={() => { setError(''); setModal({ kind: 'logs', record: row }); }} className="inline-flex gap-1 items-center text-slate-500 hover:text-[#5c67f2] hover:underline cursor-pointer"><History className="w-3 h-3" />日志</button></div></td></tr>)}
            {!pageRows.length && <tr><td colSpan={activeColumns.length + 3} className="text-center py-16"><FileSearch className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500 font-medium">暂无符合条件的库存记录</p><p className="text-xs text-slate-400 mt-1.5">请切换库存状态或调整搜索条件</p><button type="button" onClick={resetSearch} className="text-xs text-[#5c67f2] mt-4 hover:underline cursor-pointer">重置筛选</button></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 border-t border-slate-200 text-xs text-slate-500 shrink-0"><span>共 <strong className="font-semibold text-slate-700">{tabRows.length}</strong> 条{tabRows.length > 0 && <span className="text-slate-400 ml-3">显示 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, tabRows.length)} 条</span>}</span><div className="flex items-center gap-2"><select aria-label="暂存每页条数" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="px-2 py-1.5 border border-slate-200 bg-white rounded focus:outline-none focus:border-[#5c67f2]">{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} 条/页</option>)}</select><button type="button" aria-label="暂存上一页" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><ChevronLeft className="w-4 h-4" /></button><span className="bg-[#5c67f2]/10 text-[#5c67f2] rounded px-2.5 py-1.5 font-semibold">{page}</span><span className="text-slate-400">/ {pageCount}</span><button type="button" aria-label="暂存下一页" disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><ChevronRight className="w-4 h-4" /></button><form className="flex items-center gap-2 ml-2" onSubmit={event => { event.preventDefault(); const next = Number(jumpPage); if (Number.isInteger(next) && next >= 1 && next <= pageCount) setPage(next); else setJumpPage(String(page)); }}><label htmlFor="staging-page">前往</label><input id="staging-page" type="number" min="1" max={pageCount} value={jumpPage} onChange={event => setJumpPage(event.target.value)} className="w-12 px-1.5 py-1.5 border border-slate-200 rounded text-center focus:outline-none focus:border-[#5c67f2]" /><span>页</span><button type="submit" className="text-[#5c67f2] hover:underline cursor-pointer">确定</button></form></div></div>
    </section>

    {notice && createPortal(<div role="status" className="fixed z-60 top-28 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-lg rounded-lg flex items-center gap-2 px-4 py-3 text-xs text-slate-700"><Check className="w-4 h-4 text-[#5c67f2]" />{notice}<button type="button" aria-label="关闭暂存提示" onClick={() => setNotice('')} className="ml-3 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button></div>, document.body)}
    {modal && createPortal(<div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm p-5 flex items-center justify-center"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="staging-dialog-title" className={`w-full ${modal.kind === 'logs' ? 'max-w-2xl' : 'max-w-xl'} max-h-[90vh] flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xl`}>
      <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200 rounded-t-xl shrink-0"><h2 id="staging-dialog-title" className="font-bold text-sm text-slate-800 flex items-center gap-2"><span className="text-[#5c67f2]">{modal.kind === 'location' ? <MapPin className="w-4 h-4" /> : modal.kind === 'logs' ? <History className="w-4 h-4" /> : <Package className="w-4 h-4" />}</span>{modal.kind === 'location' ? '更换库位' : modal.kind === 'logs' ? '操作日志' : '创建作业指令'}</h2><button type="button" aria-label="关闭暂存弹窗" onClick={() => setModal(null)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button></div>
      {modal.kind === 'logs' ? <><div className="px-6 py-4 border-b border-slate-100"><p className="text-xs font-semibold text-slate-700">{modal.record.clientName} · {modal.record.containerNo}</p><p className="font-mono text-[11px] text-slate-400 mt-1.5 break-all">{modal.record.palletLabel}</p></div><div className="overflow-y-auto p-6 min-h-0 flex-1">{modalLogs.length ? <div className="space-y-4">{modalLogs.map(log => <div key={log.id} className="border border-slate-200 rounded-lg overflow-hidden"><div className="bg-slate-50 flex flex-wrap justify-between gap-2 px-4 py-2.5 text-xs"><strong className="text-slate-700 font-semibold">{log.action}<span className="font-normal text-slate-400 ml-2">{log.operator}</span></strong><time dateTime={log.timestamp} className="text-slate-400">{new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}</time></div><p className="px-4 py-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{log.detail}</p></div>)}</div> : <div className="text-center py-12"><History className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500 font-medium">暂无操作日志</p><p className="text-xs text-slate-400 mt-2">创建指令或更换库位后，将在此记录操作</p></div>}</div><div className="px-6 py-4 border-t border-slate-200 flex justify-end shrink-0"><button type="button" onClick={() => setModal(null)} className={secondaryButton}>关闭</button></div></> :
      <form onSubmit={modal.kind === 'location' ? changeLocation : submitOrder} className="flex flex-col min-h-0"><div className="p-6 overflow-y-auto min-h-0 space-y-5">{modal.kind === 'location' ? <><div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500">已选择 <strong className="text-[#5c67f2]">{selected.length}</strong> 个托盘，当前库位：<span className="text-slate-700">{[...new Set(selected.map(row => row.location || '未分配'))].join('、')}</span></div><label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">新库位 <span className="sr-only">必填</span><input required maxLength={50} placeholder="请输入新库位，例如 A-01-03" value={location} onChange={event => setLocation(event.target.value)} className={inputClass} /></label></> : <><div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-2"><div className="flex justify-between gap-3"><strong className="font-semibold text-slate-700">{modal.record.clientName}</strong><span className="text-slate-500">当前库位：{modal.record.location || '未分配'}</span></div><p className="font-mono text-[11px] text-slate-400 break-all">{modal.record.palletLabel}</p>{modal.record.intercepted && <p className="text-rose-500">该托盘已拦截，请确认作业要求后提交指令。</p>}</div>{availableInstructions.length ? <><label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">费用指令<select required value={instructionId} onChange={event => setInstructionId(event.target.value)} className={inputClass}>{availableInstructions.map(item => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select></label><div className="grid grid-cols-2 gap-4"><label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">指令数量<input type="number" required min="0.01" step="0.01" value={quantity} onChange={event => setQuantity(event.target.value)} className={inputClass} /></label><div className="text-xs text-slate-500"><p className="font-semibold mb-1.5">计费单位 / 单价</p><div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded">{instruction?.unit} / {instruction?.price.toFixed(2)} {instruction ? currencyNames[instruction.currency] || instruction.currency : ''}</div></div></div><label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">作业备注<textarea maxLength={500} rows={3} value={remark} onChange={event => setRemark(event.target.value)} placeholder="请输入作业要求或注意事项" className={`${inputClass} resize-y`} /></label></> : <div className="p-4 border border-amber-100 bg-amber-50 rounded-lg text-xs text-amber-700 leading-relaxed">暂无启用的费用指令，请先到<a href="#instruction-management" className="text-[#5c67f2] underline mx-1">指令管理</a>启用费用项目。</div>}</>}{error && <p role="alert" className="p-3 text-xs text-rose-600 bg-rose-50 rounded">{error}</p>}</div><div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0"><button type="button" onClick={() => setModal(null)} className={secondaryButton}>取消</button><button type="submit" disabled={modal.kind === 'order' && !availableInstructions.length} className={primaryButton}><Check className="w-3.5 h-3.5" />{modal.kind === 'location' ? '确认更换' : '提交指令'}</button></div></form>}
    </div></div>, document.body)}
  </div>;
}
