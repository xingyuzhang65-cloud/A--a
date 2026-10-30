import { CalendarDays, ChevronDown, Download, RotateCcw, Search, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cancelTiantuIntercepts } from './tiantuInterceptClient';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { Waybill } from '../../types';
import { loadListRows, persistListRows } from './instructionListState';
import { instructionSeedRows, pickupRows } from './instructionListSource';
import InstructionDetailPage from './InstructionDetailPage';
import { getInstructionOperations } from './instructionOperationDisplay';
import { applyInstructionDetailOverrides } from './instructionDetailStore';
import { loadOverseasInventory } from './overseasStorageInventoryData';
import { getInstructionPalletLabel } from './instructionInventoryLinks';
import type { InstructionListRow as Row, InstructionListTab as Tab, InstructionStatus as Status } from './instructionListTypes';

type Filters = {
  instructionNo: string; waybill: string; palletLabel: string; shipment: string; reference: string; customer: string; salesman: string;
  merchandiser: string; warehouse: string; orderType: string; instructionType: string; dateFrom: string; dateTo: string;
};

const emptyFilters: Filters = { instructionNo: '', waybill: '', palletLabel: '', shipment: '', reference: '', customer: '', salesman: '', merchandiser: '', warehouse: '', orderType: '', instructionType: '', dateFrom: '', dateTo: '' };

// 计数直接由数据算出，避免写死的数字与列表实际条数不一致。
const tabKeys: Tab[] = ['待确认', '已下单', '处理中', '已完成', '驳回', '取消', '全部'];
const inputClass = 'h-8 min-w-0 flex-1 rounded border border-[#dfe5ee] bg-white px-2 text-xs text-slate-700 outline-none placeholder:text-slate-300 focus:border-[#5c67f2] focus:ring-1 focus:ring-[#5c67f2]';

const getProcessingResult = (row: Row) => row.status === '已处理' ? '已处理' : '';
const getRowBackground = (checked: boolean): string => checked ? 'bg-[#f0f0ff]' : 'bg-white';


function Filter({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex min-w-0 items-center gap-2"><span className="shrink-0 text-xs font-semibold text-slate-700">{label}</span><span className="relative flex min-w-0 flex-1">{children}</span></label>;
}
function Select({ value, onChange, placeholder, options }: { value: string; onChange: (value: string) => void; placeholder: string; options: string[] }) {
  return <><select className={`${inputClass} appearance-none pr-7`} value={value} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-slate-400" /></>;
}

function RejectionDialog({ count, error, onCancel, onConfirm }: { count: number; error: string; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector('textarea')?.focus();
    return () => { document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="rejection-title" className="w-full max-w-lg rounded-lg bg-white text-slate-700 shadow-xl" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
      if (event.key === 'Tab') {
        const fields = dialog.current?.querySelectorAll<HTMLElement>('textarea, button');
        if (!fields?.length) return;
        const first = fields[0], last = fields[fields.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 id="rejection-title" className="text-base font-semibold">批量驳回</h2><button type="button" aria-label="关闭批量驳回" onClick={onCancel} className="px-2 text-xl text-slate-400">×</button></header>
      <form noValidate onSubmit={event => { event.preventDefault(); onConfirm(reason); }}>
        <div className="space-y-3 px-5 py-4"><p className="text-sm text-slate-500">将驳回所选 {count} 条指令，以下原因将应用于每条指令。</p>
          <label className="block text-sm font-medium" htmlFor="rejection-reason"><span className="text-red-500">* </span>驳回原因</label>
          <textarea id="rejection-reason" required maxLength={500} rows={4} value={reason} onChange={event => setReason(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'rejection-error' : undefined} placeholder="请填写驳回原因" className="w-full resize-y rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5c67f2]" />
          <p className="text-right text-xs text-slate-400">{reason.length}/500</p>
          {error && <p id="rejection-error" role="alert" className="text-sm text-red-500">{error}</p>}
        </div>
        <footer className="flex justify-end gap-3 border-t border-slate-100 px-5 py-3"><button type="button" onClick={onCancel} className="rounded border border-slate-200 px-4 py-2 text-sm">取消</button><button type="submit" className="rounded bg-[#5c67f2] px-4 py-2 text-sm text-white">确认驳回</button></footer>
      </form>
    </section>
  </div>, document.body);
}

export default function InstructionListPage({ addToast, waybills = [] }: { addToast?: (text: string, type?: 'success' | 'info' | 'warning') => void; waybills?: Pick<Waybill, 'waybillNo' | 'clientRemark'>[] }) {
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [tab, setTab] = useState<Tab>('待确认');
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [rejectionIds, setRejectionIds] = useState<string[] | null>(null);
  const [rejectionError, setRejectionError] = useState('');
  const [data, setData] = useState(() => {
    const inventory = loadOverseasInventory().records;
    return loadListRows([...pickupRows(), ...instructionSeedRows]).map((row) => applyInstructionDetailOverrides({ ...row,
      customerNote: waybills.find(bill => bill.waybillNo === row.waybill)?.clientRemark || row.customerNote,
      palletLabel: getInstructionPalletLabel(row, inventory),
    }));
  });
  const [detailRowId, setDetailRowId] = useState<string | null>(null);
  const detailRow = data.find(row => row.id === detailRowId);
  const tabs = tabKeys.map((key) => ({ key, count: key === '全部' ? data.length : data.filter((row) => row.tab === key).length }));
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const visible = useMemo(() => data.filter((row) => {
    const includes = (source: string, filter: string) => !filter || source.toLowerCase().includes(filter.trim().toLowerCase());
    const inDate = (!applied.dateFrom || row.created.slice(0, 10) >= applied.dateFrom) && (!applied.dateTo || row.created.slice(0, 10) <= applied.dateTo);
    return (tab === '全部' || row.tab === tab) && includes(row.instructionNo, applied.instructionNo) && includes(row.waybill, applied.waybill) && includes(row.palletLabel || '', applied.palletLabel) && includes(row.shipment, applied.shipment) && includes(row.reference, applied.reference) && includes(row.customer, applied.customer) && includes(row.salesman, applied.salesman) && includes(row.merchandiser, applied.merchandiser) && includes(row.warehouse, applied.warehouse) && (!applied.orderType || row.orderType === applied.orderType) && (!applied.instructionType || row.instructionType === applied.instructionType) && inDate;
  }), [applied, data, tab]);
  const allSelected = visible.length > 0 && visible.every((row) => selected.includes(row.id));
  const applyQuery = () => { setApplied(draft); setSelected([]); addToast?.('已按筛选条件查询', 'success'); };
  const reset = () => { setDraft(emptyFilters); setApplied(emptyFilters); setSelected([]); addToast?.('筛选条件已重置', 'info'); };
  const toggleAll = () => setSelected((current) => allSelected ? current.filter((id) => !visible.some((row) => row.id === id)) : Array.from(new Set([...current, ...visible.map((row) => row.id)])));
  const openRejection = () => {
    const ids = visible.filter(row => row.tab === '待确认' && selected.includes(row.id)).map(row => row.id);
    if (!ids.length) { addToast?.('请先勾选需要处理的指令', 'warning'); return; }
    setRejectionError(''); setRejectionIds(ids);
  };
  const confirmRejection = (input: string) => {
    const reason = input.trim();
    if (!reason) { setRejectionError('请填写驳回原因'); return; }
    if (reason.length > 500) { setRejectionError('驳回原因不能超过500字'); return; }
    if (!rejectionIds?.length || tab !== '待确认' || rejectionIds.some(id => !data.some(row => row.id === id && row.tab === '待确认'))) {
      setRejectionError('所选指令状态已变更，请取消后重新选择'); return;
    }
    const updated = new Date().toLocaleString('sv-SE');
    const next = data.map(row => rejectionIds.includes(row.id) ? { ...row, tab: '驳回' as const, status: '已驳回' as const, updated, rejectionReason: reason } : row);
    try { persistListRows(next, { at: updated, ids: rejectionIds, action: `已驳回 ${rejectionIds.length} 条指令`, rejectionReason: reason }); }
    catch { setRejectionError('保存失败，请保留驳回原因后重试'); return; }
    setData(next); setSelected([]); setRejectionIds(null); setRejectionError('');
    addToast?.(`已驳回 ${rejectionIds.length} 条指令`, 'success');
  };
  const updateWorkflow = async (from: '待确认' | '已下单', target: '已下单' | '取消', message: string, status?: Status) => {
    if (tab !== from || workflowBusy) return;
    const picked = new Set<string>(visible.filter((row) => row.tab === from && selected.includes(row.id)).map((row) => row.id));
    if (!picked.size) { addToast?.('请先勾选需要处理的指令', 'warning'); return; }
    const updated = new Date().toLocaleString('sv-SE');
    const next = data.map((row) => picked.has(row.id) ? { ...row, tab: target, status: status || row.status, updated } : row);
    setWorkflowBusy(true);
    try {
      if (target === '取消') await cancelTiantuIntercepts(data.filter(row => picked.has(row.id) && row.instructionType === '拦截').map(row => ({waybillNo:row.waybill})), '客户取消下单');
      persistListRows(next, { at: updated, ids: [...picked], action: message.replace('{count}', String(picked.size)) });
    }
    catch (error) { addToast?.(error instanceof Error ? error.message : '保存失败，请保留当前选择后重试', 'warning'); return; }
    finally { setWorkflowBusy(false); }
    setData(next);
    addToast?.(message.replace('{count}', String(picked.size)), 'success'); setSelected([]);
  };
  const exportRows = () => {
    const picked = selected.length ? visible.filter((row) => selected.includes(row.id)) : visible;
    const csv = [['运单号', '指令单号', '托盘标签', '指令名称', '创建时间', '指令处理状态', '处理结果', '客户简称', '仓库代码', '运单类型', '下单类型', ...(tab === '驳回' ? ['驳回原因'] : [])].join(','), ...picked.map((row) => [row.waybill, row.instructionNo, row.palletLabel || '', row.names.join(' / '), row.created, row.status, getProcessingResult(row), row.customer, row.warehouse, row.orderType, row.instructionType, ...(tab === '驳回' ? [row.rejectionReason || '—'] : [])].map((value) => `"${value.replace(/"/g, '""')}"`).join(','))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = '指令列表.csv'; link.click(); addToast?.(`已导出 ${picked.length} 条指令`, 'success');
  };

  return <main aria-label="指令列表" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fafc] p-3 text-slate-700">
    <section className="shrink-0 rounded border border-[#e7ebf1] bg-white px-3 py-3 shadow-sm">
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 xl:grid-cols-4">
        <Filter label="指令单号"><input className={inputClass} value={draft.instructionNo} onChange={(event) => setFilter('instructionNo', event.target.value)} placeholder="支持批量搜索" /></Filter>
        <Filter label="运单号"><input className={inputClass} value={draft.waybill} onChange={(event) => setFilter('waybill', event.target.value)} placeholder="支持批量搜索" /></Filter>
        <Filter label="Shipment ID"><input className={inputClass} value={draft.shipment} onChange={(event) => setFilter('shipment', event.target.value)} placeholder="支持批量搜索" /></Filter>
        <Filter label="Reference ID"><input className={inputClass} value={draft.reference} onChange={(event) => setFilter('reference', event.target.value)} placeholder="支持批量搜索" /></Filter>
        {expanded && <>
          <Filter label="客户简称"><input className={inputClass} value={draft.customer} onChange={(event) => setFilter('customer', event.target.value)} placeholder="客户简称" /></Filter>
          <Filter label="业务员"><Select value={draft.salesman} onChange={(value) => setFilter('salesman', value)} placeholder="请选择" options={['公司', '管理员']} /></Filter>
          <Filter label="跟单代表"><input className={inputClass} value={draft.merchandiser} onChange={(event) => setFilter('merchandiser', event.target.value)} placeholder="跟单代表" /></Filter>
          <Filter label="仓库代码"><input className={inputClass} value={draft.warehouse} onChange={(event) => setFilter('warehouse', event.target.value)} placeholder="仓库代码" /></Filter>
          <Filter label="运单类型"><Select value={draft.orderType} onChange={(value) => setFilter('orderType', value)} placeholder="运单类型" options={['亚马逊', '沃尔玛']} /></Filter>
          <Filter label="下单类型"><Select value={draft.instructionType} onChange={(value) => setFilter('instructionType', value)} placeholder="下单类型" options={['放货', '不放货', '拦截', '销毁']} /></Filter>
          <Filter label="入仓时间"><span className="flex h-8 min-w-0 flex-1 items-center gap-1 rounded border border-[#dfe5ee] px-2"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-300" /><input aria-label="开始日期" className="min-w-0 flex-1 text-center text-xs outline-none placeholder:text-slate-300" value={draft.dateFrom} onChange={(event) => setFilter('dateFrom', event.target.value)} placeholder="开始日期" /><span className="text-slate-400">-</span><input aria-label="结束日期" className="min-w-0 flex-1 text-center text-xs outline-none placeholder:text-slate-300" value={draft.dateTo} onChange={(event) => setFilter('dateTo', event.target.value)} placeholder="结束日期" /></span></Filter>

        </>}
      </div>
      <div className="mt-3 flex items-center gap-3"><button type="button" onClick={applyQuery} className="inline-flex h-8 w-[138px] items-center justify-center gap-1.5 rounded bg-[#5c67f2] text-xs font-semibold text-white hover:bg-[#4a55e0]"><Search className="h-3.5 w-3.5" />查询</button><button type="button" onClick={reset} className="inline-flex h-8 w-[138px] items-center justify-center gap-1.5 rounded border border-[#dfe5ee] bg-white text-xs font-semibold text-slate-600"><RotateCcw className="h-3.5 w-3.5" />重置</button><button type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex h-8 w-[138px] items-center justify-center gap-1.5 rounded border border-[#dfe5ee] bg-white text-xs font-semibold text-slate-600"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />{expanded ? '收起' : '展开'}</button></div>
    </section>
    <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-[#e7ebf1] bg-white shadow-sm">
      <div className="flex shrink-0 items-end gap-6 border-b border-[#dfe5ee] px-3 pt-2">{tabs.map((item) => <button key={item.key} type="button" onClick={() => { setTab(item.key); setSelected([]); }} className={`relative h-8 whitespace-nowrap text-xs font-medium ${tab === item.key ? 'text-[#5c67f2]' : 'text-slate-600'}`}>{item.key}({item.count}){tab === item.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#5c67f2]" />}</button>)}</div>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#edf0f4] px-3"><div className="flex items-center gap-3">{tab === '待确认' && <><button type="button" onClick={() => updateWorkflow('待确认', '已下单', '已确认下单 {count} 条指令', '待处理')} className="h-7 rounded bg-[#5c67f2] px-4 text-xs font-semibold text-white">确认下单</button><button type="button" onClick={openRejection} className="h-7 rounded bg-[#5c67f2] px-4 text-xs font-semibold text-white">批量驳回</button></>}{tab === '已下单' && <button type="button" disabled={workflowBusy} onClick={() => updateWorkflow('已下单', '取消', '已取消下单 {count} 条指令', '已取消')} className="h-7 rounded border border-red-200 bg-white px-4 text-xs font-semibold text-red-500 hover:bg-red-50">{workflowBusy?'正在校验…':'取消下单'}</button>}<button type="button" onClick={exportRows} className="inline-flex h-7 items-center gap-1 rounded border border-[#dfe5ee] bg-white px-4 text-xs font-semibold text-slate-600"><Download className="h-3.5 w-3.5" />导出</button><button type="button" onClick={() => addToast?.('当前列表暂无新的操作日志', 'info')} className="h-7 rounded border border-[#dfe5ee] bg-white px-4 text-xs font-semibold text-slate-600">查看日志</button></div><button type="button" aria-label="列表设置" onClick={() => addToast?.('列表支持横向滚动查看全部字段', 'info')} className="flex h-7 w-7 items-center justify-center rounded bg-[#5c67f2] text-white"><Settings2 className="h-3.5 w-3.5" /></button></div>
      <div className="min-h-0 flex-1 overflow-auto"><table style={{ width: tab === '驳回' ? 3520 : 3240, minWidth: tab === '驳回' ? 3520 : 3240 }} className="table-fixed border-collapse text-[11px] text-slate-600"><thead className="sticky top-0 z-20 bg-[#f7f9fc]"><tr className="h-8"><th className="sticky left-0 z-30 w-10 border border-[#e5e9ef] bg-[#f7f9fc] text-center"><input aria-label="全选" type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 accent-[#5c67f2]" /></th><th className="sticky left-10 z-30 w-32 border border-[#e5e9ef] bg-[#f7f9fc] text-center">客户简称</th><th className="sticky left-[168px] z-30 w-40 border border-[#e5e9ef] bg-[#f7f9fc] text-center">运单号</th><th className="sticky left-[328px] z-30 w-64 border border-[#e5e9ef] bg-[#f7f9fc] text-center shadow-[5px_0_8px_-7px_rgba(15,23,42,0.55)]">指令单号</th>{tab === '驳回' && <th className="w-[280px] border border-[#e5e9ef] px-3 text-left font-semibold">驳回原因</th>}{['运单类型', '下单类型', '货箱选择方式', '指令数量', '指令', 'Shipment ID', 'Reference ID', '仓库代码', '邮编', '预计提货时间', '目的地', '发货件数', '重量', '方数', '转单号', '入仓时间（海外仓）', '业务员', '跟单员', '创建时间'].map((head) => <th key={head} className={(head === '指令' ? 'w-80' : head === '指令数量' ? 'w-24' : head === '转单号' ? 'w-48' : 'w-32') + ' border border-[#e5e9ef] px-2 text-center font-semibold'}>{head}</th>)}</tr></thead><tbody>{visible.map((row) => { const checked = selected.includes(row.id); const operations = getInstructionOperations(row); const doneCount = operations.filter(operation => operation.done).length; return <tr key={row.id} className={`h-[80px] ${getRowBackground(checked)}`}><td className="sticky left-0 z-10 border border-[#eef1f5] bg-inherit text-center"><input aria-label={`选择${row.instructionNo}`} type="checkbox" checked={checked} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} className="h-3.5 w-3.5 accent-[#5c67f2]" /></td><td className="sticky left-10 z-10 border border-[#eef1f5] bg-inherit px-2 text-center whitespace-nowrap">{row.customer}</td><td className="sticky left-[168px] z-10 border border-[#eef1f5] bg-inherit px-2 text-center whitespace-nowrap">{row.waybill}</td><td className="sticky left-[328px] z-10 border border-[#eef1f5] bg-inherit px-2 text-center text-[#5c67f2] shadow-[5px_0_8px_-7px_rgba(15,23,42,0.55)]"><button type="button" onClick={() => setDetailRowId(row.id)} aria-haspopup="dialog" className="whitespace-nowrap hover:underline">{row.instructionNo}</button></td>{tab === '驳回' && <td className="whitespace-pre-wrap break-words border border-[#eef1f5] px-3 py-2 text-left text-red-500">{row.rejectionReason || '—'}</td>}<td className="border border-[#eef1f5] px-2 text-center">{row.orderType}</td><td className="border border-[#eef1f5] px-2 text-center">{row.instructionType}</td><td className="border border-[#eef1f5] px-2 text-center">{row.boxSelectionMode||'随机'}</td><td className="border border-[#eef1f5] px-2 text-center font-semibold" aria-label={`指令数量 ${doneCount}/${operations.length}`}>{doneCount}/{operations.length}</td><td className="border border-[#eef1f5] px-2 py-2 text-left"><div className="space-y-1">{operations.map(operation => <div key={operation.id} className={`instruction-operation-line flex items-start gap-1.5 leading-5 ${operation.done ? 'text-[#67c23a]' : 'text-[#e6a23c]'}`}><span className={`shrink-0 rounded-full px-1.5 text-[10px] ${operation.done ? 'bg-[#f0f9eb]' : 'bg-[#fdf6ec]'}`}>{operation.done ? '已处理' : '待处理'}</span><span>{operation.description}</span></div>)}{!operations.length&&<span className="text-slate-400">—</span>}</div></td><td className="border border-[#eef1f5] px-2 text-center whitespace-nowrap">{row.shipment}</td><td className="border border-[#eef1f5] px-2 text-center">{row.reference}</td><td className="border border-[#eef1f5] px-2 text-center">{row.warehouse}</td><td className="border border-[#eef1f5] px-2 text-center whitespace-nowrap">{row.zip}</td><td className="border border-[#eef1f5] px-2 text-center whitespace-nowrap">{row.instructionType === '自提' ? row.expectedPickupTime || '' : ''}</td><td className="border border-[#eef1f5] px-2 text-center">{row.destination}</td><td className="border border-[#eef1f5] px-2 text-center">{row.packages}</td><td className="border border-[#eef1f5] px-2 text-center">{row.weight}</td><td className="border border-[#eef1f5] px-2 text-center">{row.volume}</td><td className="border border-[#eef1f5] px-2 py-2 text-center break-all">{row.transferNumbers?.at(-1)||'—'}</td><td className="border border-[#eef1f5] px-2 text-center whitespace-nowrap">{row.overseasTime}</td><td className="border border-[#eef1f5] px-2 text-center">{row.salesman}</td><td className="border border-[#eef1f5] px-2 text-center">{row.merchandiser}</td><td className="border border-[#eef1f5] px-2 text-center whitespace-nowrap">{row.created}</td></tr>; })}{visible.length === 0 && <tr><td colSpan={tab === '驳回' ? 24 : 23} className="h-48 border border-[#eef1f5] text-center text-slate-400">暂无符合筛选条件的指令数据</td></tr>}</tbody></table></div>
      <footer className="flex h-10 shrink-0 items-center justify-end gap-4 border-t border-[#edf0f4] px-4 text-xs text-slate-500"><span>共 {visible.length} 条</span><select aria-label="每页条数" className="h-6 rounded border border-slate-200 bg-white px-2 text-xs"><option>100条/页</option></select><button type="button">‹</button><span className="text-[#5c67f2]">1</span><button type="button">›</button><span>前往</span><input aria-label="页码" className="h-6 w-9 rounded border border-slate-200 text-center text-xs" value="1" readOnly /><span>页</span></footer>
    </section>
    {rejectionIds && <RejectionDialog count={rejectionIds.length} error={rejectionError} onCancel={() => { setRejectionIds(null); setRejectionError(''); }} onConfirm={confirmRejection} />}
    {detailRow && <InstructionDetailPage row={detailRow} onClose={() => setDetailRowId(null)} onUpdate={patch => setData(current => current.map(row => row.id === detailRow.id ? {...row,...patch} : row))} />}
  </main>;
}
