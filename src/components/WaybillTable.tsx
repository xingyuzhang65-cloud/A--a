import React, { useEffect, useRef, useState } from 'react';
import { Waybill, WaybillStatus } from '../types';
import {
  Edit3, Trash2, CheckCircle, FileText, Settings, AlertTriangle,
  ChevronRight, ChevronLeft, PackageCheck, Clock
} from 'lucide-react';
import TradeModeLogModal from './TradeModeLogModal';

interface WaybillTableProps {
  waybills: Waybill[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (waybill: Waybill) => void;
  onDelete: (id: string) => void;
  onBulkUpdateStatus: (ids: string[], newStatus: WaybillStatus) => void;
  onBulkUpdateTradeMode: (ids: string[], tradeMode: string) => void;
  onBulkUpdateRemark: (ids: string[], type: 'client' | 'internal', remark: string) => void;
  onOpenStats: () => void;
  currentStatusTab: string;
  setCurrentStatusTab: (status: string) => void;
  onMakeInvoice: (waybillId: string) => void;
}

type SortField = 'clientName' | 'destination' | 'channel' | 'eta' | 'declarationValue' | null;
type SortOrder = 'asc' | 'desc';

export default function WaybillTable({
  waybills,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  onBulkUpdateStatus,
  onBulkUpdateTradeMode,
  onBulkUpdateRemark,
  onOpenStats,
  currentStatusTab,
  setCurrentStatusTab,
  onMakeInvoice
}: WaybillTableProps) {
  // Sorting local states
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Detail Drawer state
  const [viewingWaybill, setViewingWaybill] = useState<Waybill | null>(null);

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Bulk Edit Dialog triggers
  const [bulkRemarkType, setBulkRemarkType] = useState<'client' | 'internal' | null>(null);
  const [bulkRemarkVal, setBulkRemarkVal] = useState<string>('');
  const [showBulkTradeMode, setShowBulkTradeMode] = useState<boolean>(false);
  const [batchTradeMode, setBatchTradeMode] = useState<string>('');
  const [showBulkMenu, setShowBulkMenu] = useState<boolean>(false);
  const [showDetailTradeModeModal, setShowDetailTradeModeModal] = useState<boolean>(false);
  const [detailTradeModeDraft, setDetailTradeModeDraft] = useState<string>('');
  const bulkMenuRef = useRef<HTMLDivElement | null>(null);
  const tradeModeOptions = ['9610', '9710', '9810', '0110', '1039'];
  const [logModalWaybill, setLogModalWaybill] = useState<Waybill | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!bulkMenuRef.current?.contains(event.target as Node)) {
        setShowBulkMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Status options with baseline numbers merged with live ones for realistic UI representation
  const statusSpecs: { label: string; statusKey: string }[] = [
    { label: '入仓', statusKey: '入仓' },
    { label: '出库', statusKey: '出库' },
    { label: '出仓', statusKey: '出仓' },
    { label: '运输', statusKey: '运输' },
    { label: '签收', statusKey: '签收' },
    { label: '扣货', statusKey: '扣货' },
    { label: '取消', statusKey: '取消' },
    { label: '全部', statusKey: '全部' }
  ];

  // Helper to count waybills by status
  const getStatusCount = (statusKey: string) => {
    if (statusKey === '全部') return waybills.length;
    return waybills.filter(w => w.status === statusKey).length;
  };

  const getBaselineCountLabel = (statusKey: string) => {
    const live = getStatusCount(statusKey);
    // Add realistic offset corresponding to ANSU scale
    let offset = 0;
    if (statusKey === '入仓') offset = 18;
    else if (statusKey === '出库') offset = 4;
    else if (statusKey === '出仓') offset = 221;
    else if (statusKey === '运输') offset = 26442;
    else if (statusKey === '签收') offset = 347480;
    else if (statusKey === '扣货') offset = 1;
    else if (statusKey === '取消') offset = 20760;
    else if (statusKey === '全部') offset = 394926;

    return `${statusKey}(${live + offset})`;
  };

  // 1. Filter based on status tabs
  const tabFiltered = waybills.filter(w => {
    if (currentStatusTab === '全部') return true;
    return w.status === currentStatusTab;
  });

  // 2. Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedWaybills = [...tabFiltered].sort((a, b) => {
    if (!sortField) return 0;
    let fieldA = a[sortField] || '';
    let fieldB = b[sortField] || '';

    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }

    fieldA = String(fieldA).toLowerCase();
    fieldB = String(fieldB).toLowerCase();

    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 3. Paginated output
  const totalPages = Math.ceil(sortedWaybills.length / pageSize) || 1;
  const paginatedWaybills = sortedWaybills.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // General selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const activeIds = paginatedWaybills.map(w => w.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...activeIds])));
    } else {
      const activeIds = paginatedWaybills.map(w => w.id);
      setSelectedIds(prev => prev.filter(id => !activeIds.includes(id)));
    }
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const batchInvoice = () => {
    if (selectedIds.length === 0) {
      alert('⚠️ 错误：未勾选任何运单！制作发票前请先勾选一个运单。');
      return;
    }
    if (selectedIds.length > 1) {
      alert(`⚠️ 错误：每次只能勾选一个运单进行发票制作，当前已勾选了 ${selectedIds.length} 个！`);
      return;
    }
    onMakeInvoice(selectedIds[0]);
  };

  const handleApplyBulkRemarks = () => {
    if (!bulkRemarkType) return;
    onBulkUpdateRemark(selectedIds, bulkRemarkType, bulkRemarkVal);
    setBulkRemarkType(null);
    setBulkRemarkVal('');
    setSelectedIds([]);
  };

  const handleBatchTradeModeUpdate = (nextTradeMode = batchTradeMode) => {
    if (selectedIds.length === 0) {
      alert('请在下方列表中勾选目标运单进行批量操作！');
      return;
    }

    if (!nextTradeMode) {
      alert('请选择要批量修改的贸易方式');
      return;
    }

    const selectedWaybills = waybills.filter(item => selectedIds.includes(item.id));
    const unsupportedWaybills = selectedWaybills.filter(item => item.declarationType === '托管报关');

    if (unsupportedWaybills.length > 0) {
      const blockedText = unsupportedWaybills.map(item => `[${item.waybillNo || item.id}]`).join('、');
      alert(`${blockedText} 报关方式不支持该贸易方式`);
      return;
    }

    onBulkUpdateTradeMode(selectedIds, nextTradeMode);
    setBatchTradeMode(nextTradeMode);
    setShowBulkTradeMode(false);
    setShowBulkMenu(false);
  };

  const selectedWaybillNos = selectedIds.map(id => {
    const waybill = waybills.find(item => item.id === id);
    return waybill?.waybillNo || id;
  });

  const openDetailTradeModeModal = () => {
    if (!viewingWaybill) return;
    setDetailTradeModeDraft(viewingWaybill.tradeMode || '');
    setShowDetailTradeModeModal(true);
  };

  const confirmDetailTradeModeChange = () => {
    if (!viewingWaybill || !detailTradeModeDraft) {
      alert('请选择贸易方式');
      return;
    }

    onBulkUpdateTradeMode([viewingWaybill.id], detailTradeModeDraft);
    setViewingWaybill({ ...viewingWaybill, tradeMode: detailTradeModeDraft });
    setShowDetailTradeModeModal(false);
  };

  const closeDetailView = () => {
    setShowDetailTradeModeModal(false);
    setViewingWaybill(null);
  };

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden select-none">
      {/* 1. Status Navigation Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/50">
        {statusSpecs.map(spec => {
          const isActive = currentStatusTab === spec.statusKey;
          return (
            <button
              key={spec.statusKey}
              onClick={() => {
                setCurrentStatusTab(spec.statusKey);
                setCurrentPage(1);
              }}
              className={`px-5 py-3.5 text-xs font-semibold cursor-pointer border-b-2 tracking-wide transition-all shrink-0 ${
                isActive 
                  ? 'border-[#5c67f2] text-[#5c67f2] bg-white font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/40'
              }`}
            >
              {getBaselineCountLabel(spec.statusKey)}
            </button>
          );
        })}
      </div>

      {/* 2. Action Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Status Mass Actions dropdown */}
          <div className="relative" ref={bulkMenuRef}>
            <button
              type="button"
              onClick={() => setShowBulkMenu(prev => !prev)}
              className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              批量操作 ▾
            </button>
            <div className={`absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded shadow-lg z-30 ${showBulkMenu ? 'block' : 'hidden'}`}>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      alert('请在下方列表中勾选目标运单进行批量操作！');
                      return;
                    }
                    setShowBulkMenu(false);
                    setShowBulkTradeMode(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 hover:text-[#5c67f2] text-slate-700"
                >
                  批量修改贸易方式
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('请先勾选需修改备注的运单！');
                return;
              }
              setBulkRemarkType('client');
            }}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded text-xs text-slate-700 font-semibold cursor-pointer"
          >
            批量修改客户备注
          </button>

          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('请先勾选需修改内部备注的运单！');
                return;
              }
              setBulkRemarkType('internal');
            }}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded text-xs text-slate-700 font-semibold cursor-pointer"
          >
            批量修改内部备注
          </button>

          <button
            onClick={batchInvoice}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded text-xs text-slate-700 font-semibold cursor-pointer"
          >
            制作发票
          </button>

          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('请先勾选运单。');
                return;
              }
              alert(`🚢 已更新选定 ${selectedIds.length} 票运单的海外港口预计清关节点跟进！`);
            }}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded text-xs text-slate-700 font-semibold cursor-pointer"
          >
            更新运踪
          </button>

          <button
            onClick={onOpenStats}
            className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-[#5c67f2] hover:bg-indigo-100 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            查看数据统计
          </button>
        </div>

        <div className="flex items-center gap-2shrink-0">
          <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-500 hover:text-slate-700" title="高级表格配置">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Bulk Remark Dialog Panel */}
      {bulkRemarkType && (
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center gap-4 animate-fadeIn">
          <div className="text-xs font-bold text-slate-700">
            批量录入{bulkRemarkType === 'client' ? '【客户备注】' : '【内部备注】'}:
          </div>
          <input
            type="text"
            className="flex-1 max-w-md border border-slate-200 p-1.5 text-xs rounded bg-white"
            placeholder={`输入统一的 ${bulkRemarkType === 'client' ? '客户留言' : '操作备注'} 信息`}
            value={bulkRemarkVal}
            onChange={e => setBulkRemarkVal(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyBulkRemarks}
              className="px-3 py-1 bg-[#5c67f2] hover:bg-[#4a55e0] text-white text-xs font-semibold rounded cursor-pointer"
            >
              应用
            </button>
            <button
              onClick={() => {
                setBulkRemarkType(null);
                setBulkRemarkVal('');
              }}
              className="px-3 py-1 border border-slate-200 bg-white text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 4. Table Core Area */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 text-xs font-bold whitespace-nowrap">
              <th className="px-4 py-3 text-center font-mono text-slate-400 w-10">#</th>
              <th className="px-3 py-3 text-center w-8">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    paginatedWaybills.length > 0 &&
                    paginatedWaybills.every(w => selectedIds.includes(w.id))
                  }
                  className="rounded border-slate-300 focus:ring-[#5c67f2] accent-[#5c67f2] cursor-pointer"
                />
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('clientName')}
              >
                客户简称 {sortField === 'clientName' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>
              <th className="px-4 py-3">FBA单号</th>
              <th className="px-4 py-3">运单号</th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('destination')}
              >
                目的地 {sortField === 'destination' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>
              <th className="px-4 py-3">报关方式</th>
              <th className="px-4 py-3">贸易方式</th>
              <th className="px-4 py-3">ETA</th>
              <th className="px-4 py-3 min-w-[140px]">商品品名</th>
              <th className="px-4 py-3">ETD</th>
              <th className="px-4 py-3">船名航次</th>
              <th className="px-4 py-3">申报总值</th>
              <th className="px-4 py-3 text-center">附件</th>
              <th className="px-4 py-3">异常类型</th>
              <th className="px-4 py-3">快递商</th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('channel')}
              >
                干线渠道 {sortField === 'channel' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>
              <th className="px-4 py-3">运单状态</th>
              <th className="px-4 py-3 text-center">系统操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedWaybills.map((w, index) => {
              const isSelected = selectedIds.includes(w.id);
              const customIndex = (currentPage - 1) * pageSize + index + 1;
              const hasIssue = w.issueType !== '无';

              // Determine status style classes
              let statusLabelStyle = "";
              if (w.status === '入仓') statusLabelStyle = "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10";
              else if (w.status === '出库') statusLabelStyle = "bg-orange-50 text-orange-700 ring-1 ring-orange-600/10";
              else if (w.status === '出仓') statusLabelStyle = "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10";
              else if (w.status === '运输') statusLabelStyle = "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/10";
              else if (w.status === '签收') statusLabelStyle = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10";
              else if (w.status === '扣货') statusLabelStyle = "bg-rose-50 text-rose-750 ring-1 ring-rose-600/20";
              else if (w.status === '取消') statusLabelStyle = "bg-slate-100 text-slate-500";

              return (
                <tr 
                  key={w.id} 
                  className={`text-slate-700 text-xs hover:bg-slate-50/75 transition-all ${
                    isSelected ? 'bg-indigo-50/20' : ''
                  }`}
                  onDoubleClick={() => setViewingWaybill(w)}
                >
                  <td className="px-4 py-3.5 text-center font-mono text-slate-400 font-medium">
                    {customIndex}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => handleToggleSelect(w.id, e.target.checked)}
                      className="rounded border-slate-300 focus:ring-[#5c67f2] accent-[#5c67f2] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{w.clientName}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{w.fbaNo || '-'}</td>
                  <td className="px-4 py-3.5 font-semibold text-indigo-600 font-mono tracking-wide">{w.waybillNo}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono text-xs border border-slate-200">
                      {w.destination}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      w.declarationType === '一般贸易' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {w.declarationType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 font-mono">
                      {w.tradeMode || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500">{w.eta || '-'}</td>
                  <td className="px-4 py-3.5 truncate max-w-[180px] font-sans antialiased text-slate-700" title={w.productName}>
                    {w.productName}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500">{w.etd || '-'}</td>
                  <td className="px-4 py-3.5 text-slate-600 text-[11px] truncate max-w-[120px]" title={w.vesselVoyage}>
                    {w.vesselVoyage || '-'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold">
                    ${w.declarationValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {w.attachments > 0 ? (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full w-5 h-5 inline-flex items-center justify-center border border-slate-200">
                        {w.attachments}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {hasIssue ? (
                      <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200 animate-pulse text-[10px]">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {w.issueType}
                      </span>
                    ) : (
                      <span className="text-slate-400">无异常</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{w.courierCompany}</td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">{w.channel}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${statusLabelStyle}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center shrink-0">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setLogModalWaybill(w)}
                        className="px-2 py-0.5 rounded text-xs font-bold text-[#5c67f2] hover:bg-indigo-50 hover:text-[#4a55e0] transition-colors cursor-pointer flex items-center gap-1"
                        title="查看贸易方式变更日志"
                      >
                        <Clock className="w-3 h-3" />
                        日志
                      </button>
                      <button
                        onClick={() => onEdit(w)}
                        className="p-1 px-1.5 hover:bg-slate-100 rounded text-blue-500 hover:text-blue-700 transition-colors cursor-pointer flex items-center"
                        title="编辑和录入"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(w.id)}
                        className="p-1 px-1.5 hover:bg-slate-100 rounded text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center"
                        title="报废/删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedWaybills.length === 0 && (
              <tr>
                <td colSpan={19} className="py-12 text-center text-slate-400 font-medium text-xs bg-slate-50/50">
                  ⚠️ 没有找到匹配任何关键字或筛选条件的业务运单。您可以点击“重置”按钮清除检索词。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination Pager Footer */}
      <footer className="h-16 px-5 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs text-slate-500 select-none">
        <div className="flex items-center gap-5">
          <span>共 <strong className="text-slate-800">{sortedWaybills.length}</strong> 条记录</span>
          {selectedIds.length > 0 && (
            <span className="text-[#5c67f2] font-semibold bg-[#5c67f2]/10 px-2.5 py-0.5 rounded-full">
              已勾选 {selectedIds.length} 项
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Page controls */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-semibold text-slate-700">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="ml-3 px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#5c67f2] cursor-pointer"
          >
            <option value={10}>10 条/页</option>
            <option value={20}>20 条/页</option>
            <option value={50}>50 条/页</option>
            <option value={100}>100 条/页</option>
          </select>
        </div>
      </footer>

      {showBulkTradeMode && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/50 pt-16">
          <div className="w-[520px] rounded-sm bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">批量修改贸易方式</h3>
            </div>
            <div className="space-y-4 px-7 py-5 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-slate-600">运单号：</span>
                <span className="font-semibold text-slate-700">
                  {selectedWaybillNos.length > 2 ? `${selectedWaybillNos.slice(0, 2).join('、')} 等 ${selectedWaybillNos.length} 单` : selectedWaybillNos.join('、')}
                </span>
              </div>
              <label className="flex items-center gap-3">
                <span className="w-20 text-right text-slate-600">
                  <span className="mr-0.5 text-red-500">*</span>贸易方式：
                </span>
                <select
                  value={batchTradeMode}
                  onChange={(e) => setBatchTradeMode(e.target.value)}
                  className="h-9 flex-1 rounded border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">请选择贸易方式</option>
                  {tradeModeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowBulkTradeMode(false)}
                className="rounded border border-slate-300 bg-white px-5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleBatchTradeModeUpdate()}
                className="rounded bg-[#004bb1] px-5 py-1.5 text-xs font-bold text-white hover:bg-[#003b91]"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Waybill Detailed View */}
      {viewingWaybill && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full flex-col bg-[#f3f6fb] shadow-2xl lg:w-[calc(100vw-600px)] lg:min-w-[960px]">
            <div className="flex h-[59px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5">
              <button
                type="button"
                onClick={closeDetailView}
                className="flex h-8 w-8 items-center justify-center rounded text-2xl font-light leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="关闭"
              >
                ×
              </button>
              <h3 className="text-lg font-normal text-slate-900">查看({viewingWaybill.waybillNo})</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <section className="rounded-lg border border-slate-200 bg-white px-3 py-4 shadow-sm">
                <h4 className="mb-5 text-sm font-bold text-slate-900">基础信息</h4>
                <div className="grid grid-cols-3 gap-x-8 gap-y-[22px] text-[15px] leading-5 text-slate-900">
                  <div className="text-center">
                    <span className="font-bold text-orange-500">运单号：</span>
                    <strong className="font-bold text-orange-500">{viewingWaybill.waybillNo}</strong>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-orange-500">起运地：</span>
                    <strong className="font-bold text-orange-500">{viewingWaybill.operator || '-'}</strong>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-orange-500">运单类型：</span>
                    <strong className="font-bold text-orange-500">{viewingWaybill.waybillType || '-'}</strong>
                  </div>
                  <div className="text-center"><span className="font-bold">客户简称：</span><strong>{viewingWaybill.clientName || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">业务员：</span><strong>{viewingWaybill.salesman || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">跟单员：</span><strong>{viewingWaybill.merchandiser || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">目的地：</span><strong>{viewingWaybill.destination || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">渠道：</span><strong>{viewingWaybill.channel || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">仓库代码：</span><strong>{viewingWaybill.warehouseCode || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">品名：</span><strong>{viewingWaybill.productName || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">材质：</span><strong>{viewingWaybill.label || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">邮编：</span><strong>{viewingWaybill.zipCode || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">实重：</span></div>
                  <div className="text-center"><span className="font-bold">材积重：</span></div>
                  <div className="text-center"><span className="font-bold">件数：</span><strong>{viewingWaybill.attachments || 1}</strong> <button className="ml-2 text-blue-500 hover:text-blue-600">修改</button></div>
                  <div className="text-center"><span className="font-bold">方数：</span></div>
                  <div className="text-center"><span className="font-bold">结算重：</span></div>
                  <div className="text-center"><span className="font-bold">发票：</span><button className="text-blue-500 hover:text-blue-600">查看发票</button><button className="ml-3 text-blue-500 hover:text-blue-600">修改发票</button></div>
                  <div className="text-center"><span className="font-bold">报关方式：</span><strong>{viewingWaybill.declarationType || '-'}</strong></div>
                  <div className="text-center">
                    <span className="font-bold">贸易方式：</span>
                    <strong>{viewingWaybill.tradeMode || '-'}</strong>
                    <button
                      type="button"
                      onClick={openDetailTradeModeModal}
                      className="ml-2 text-blue-500 hover:text-blue-600"
                    >
                      修改
                    </button>
                  </div>
                  <div className="text-center"><span className="font-bold">交税方式：</span><strong>{viewingWaybill.taxPayment || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">申报价值：</span><strong>{viewingWaybill.declarationValue || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">收件人：</span><strong>{viewingWaybill.warehouseCode || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">收件人电话：</span><strong>{viewingWaybill.trackingNo || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">收件人邮箱：</span></div>
                  <div className="text-center"><span className="font-bold">币种：</span><strong>USD</strong></div>
                  <div className="text-center"><span className="font-bold">客户备注：</span><strong>{viewingWaybill.clientRemark || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">内部备注：</span><strong>{viewingWaybill.internalRemark || '-'}</strong></div>
                  <div className="text-center"><span className="font-bold">私人地址类型：</span></div>
                  <div className="text-center"><span className="font-bold">预计送达周：</span></div>
                  <div className="text-center"><span className="font-bold">是否购买退运保：</span><strong>{viewingWaybill.hasInsurance || '否'}</strong></div>
                  <div><span className="font-bold">是否购买国内查验宝：</span><strong>否</strong></div>
                </div>
              </section>

              <section className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">材积明细</h4>
                    <span className="font-bold text-slate-900">客户可见:</span>
                    <span className="inline-flex h-6 w-12 items-center rounded-full bg-blue-500 px-1 text-xs font-bold text-white">
                      开
                      <span className="ml-auto h-5 w-5 rounded-full bg-white"></span>
                    </span>
                  </div>
                  <strong className="font-bold text-slate-900">总结算重: 0</strong>
                </div>
                <table className="w-full table-fixed border-collapse text-xs text-slate-700">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-14 border border-slate-200 px-3 py-2 text-left">#</th>
                      <th className="w-[270px] border border-slate-200 px-3 py-2 text-left">系统箱号</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">长</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">宽</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">高</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">实重</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">材积重</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">周长</th>
                      <th className="w-[230px] border border-slate-200 px-3 py-2 text-left">换货图片</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-[50px]">
                      <td className="border border-slate-200 px-3 py-2">1</td>
                      <td className="border border-slate-200 px-3 py-2 font-mono leading-6 text-slate-600">
                        {viewingWaybill.fbaNo || viewingWaybill.waybillNo}U000001<br />
                        {viewingWaybill.waybillNo}U000001
                      </td>
                      <td className="border border-slate-200 px-3 py-2"></td>
                      <td className="border border-slate-200 px-3 py-2"></td>
                      <td className="border border-slate-200 px-3 py-2"></td>
                      <td className="border border-slate-200 px-3 py-2"></td>
                      <td className="border border-slate-200 px-3 py-2"></td>
                      <td className="border border-slate-200 px-3 py-2"></td>
                      <td className="border border-slate-200 px-3 py-2"></td>
                    </tr>
                    <tr>
                      <td className="h-[145px] border border-slate-200 px-3 py-2" colSpan={9}></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>

            {showDetailTradeModeModal && (
              <div className="absolute inset-0 z-[80] flex items-start justify-center bg-black/20 pt-24">
                <div className="w-[420px] rounded-sm bg-white shadow-2xl">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="text-base font-bold text-slate-900">修改贸易方式</h3>
                  </div>
                  <div className="space-y-4 px-7 py-5 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-right text-slate-600">运单号：</span>
                      <span className="font-semibold text-slate-700">{viewingWaybill.waybillNo}</span>
                    </div>
                    <label className="flex items-center gap-3">
                      <span className="w-20 text-right text-slate-600">
                        <span className="mr-0.5 text-red-500">*</span>贸易方式：
                      </span>
                      <select
                        value={detailTradeModeDraft}
                        onChange={(e) => setDetailTradeModeDraft(e.target.value)}
                        className="h-9 flex-1 rounded border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">请选择贸易方式</option>
                        {tradeModeOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setShowDetailTradeModeModal(false)}
                      className="rounded border border-slate-300 bg-white px-5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={confirmDetailTradeModeChange}
                      className="rounded bg-[#004bb1] px-5 py-1.5 text-xs font-bold text-white hover:bg-[#003b91]"
                    >
                      确定
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 7. Trade Mode Log Modal */}
      {logModalWaybill && (
        <TradeModeLogModal
          isOpen={logModalWaybill !== null}
          waybill={logModalWaybill}
          onClose={() => setLogModalWaybill(null)}
        />
      )}
    </div>
  );
}
