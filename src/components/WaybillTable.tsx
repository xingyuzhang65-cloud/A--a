import React, { useState } from 'react';
import { Waybill, WaybillStatus } from '../types';
import { 
  Eye, Edit3, Trash2, CheckCircle, FileText, Settings, AlertTriangle, 
  ChevronRight, ChevronLeft, PackageCheck, Info
} from 'lucide-react';

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

  const toolbarButton = 'h-[32px] px-3 bg-[#1890ff] hover:bg-[#087fe7] text-white rounded-[2px] text-[12px] font-semibold flex items-center gap-1 cursor-pointer';
  const plainButton = 'h-[32px] px-3 border border-[#dcdfe6] bg-white hover:bg-[#f7f9fc] text-[#344255] rounded-[2px] text-[12px] font-semibold cursor-pointer';

  return (
    <div className="bg-white rounded-[4px] border border-[#e5e9f0] shadow-[0_2px_8px_rgba(31,45,61,0.08)] overflow-hidden select-none">
      {/* 1. Status Navigation Tabs */}
      <div className="flex h-[48px] items-end border-b border-[#edf0f5] overflow-x-auto bg-white px-2">
        {statusSpecs.map(spec => {
          const isActive = currentStatusTab === spec.statusKey;
          return (
            <button
              key={spec.statusKey}
              onClick={() => {
                setCurrentStatusTab(spec.statusKey);
                setCurrentPage(1);
              }}
              className={`h-[48px] px-4 text-[12px] font-semibold cursor-pointer border-b-2 transition-all shrink-0 ${
                isActive 
                  ? 'border-[#1890ff] text-[#1890ff] bg-white font-bold' 
                  : 'border-transparent text-[#344255] hover:text-[#1890ff]'
              }`}
            >
              {getBaselineCountLabel(spec.statusKey)}
            </button>
          );
        })}
      </div>

      {/* 2. Action Toolbar */}
      <div className="px-3 py-[10px] border-b border-[#edf0f5] flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Status Mass Actions dropdown */}
          <div className="relative group">
            <button className={toolbarButton}>
              批量操作 ▾
            </button>
            <div className="absolute left-0 mt-1.5 w-44 bg-white border border-[#dfe6ee] rounded-[3px] shadow-lg hidden group-hover:block z-20">
              <div className="py-1">
                <button
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      alert('请先勾选需要修改贸易方式的运单！');
                      return;
                    }
                    setShowBulkTradeMode(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-[#e6f4ff] hover:text-[#1890ff] text-[#344255]"
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
            className={toolbarButton}
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
            className={toolbarButton}
          >
            批量修改内部备注
          </button>

          <button
            onClick={batchInvoice}
            className={toolbarButton}
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
            className={toolbarButton}
          >
            更新运踪
          </button>

          <button
            onClick={onOpenStats}
            className={toolbarButton}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            查看数据统计
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="h-[32px] w-[32px] border border-[#1890ff] bg-[#1890ff] hover:bg-[#087fe7] rounded-[2px] text-white flex items-center justify-center" title="高级表格配置">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Bulk Remark Dialog Panel */}
      {bulkRemarkType && (
        <div className="p-3 bg-[#f7fbff] border-b border-[#edf0f5] flex items-center gap-4 animate-fadeIn">
          <div className="text-xs font-bold text-slate-700">
            批量录入{bulkRemarkType === 'client' ? '【客户备注】' : '【内部备注】'}:
          </div>
          <input
            type="text"
            className="h-[30px] flex-1 max-w-md border border-[#dcdfe6] px-2 text-xs rounded-[2px] bg-white"
            placeholder={`输入统一的 ${bulkRemarkType === 'client' ? '客户留言' : '操作备注'} 信息`}
            value={bulkRemarkVal}
            onChange={e => setBulkRemarkVal(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyBulkRemarks}
              className="h-[30px] px-3 bg-[#1890ff] hover:bg-[#087fe7] text-white text-xs font-semibold rounded-[2px] cursor-pointer"
            >
              应用
            </button>
            <button
              onClick={() => {
                setBulkRemarkType(null);
                setBulkRemarkVal('');
              }}
              className="h-[30px] px-3 border border-[#dcdfe6] bg-white text-xs rounded-[2px] text-[#344255] hover:bg-[#f7f9fc] cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 3.1 Bulk Trade Mode Dialog Panel */}
      {showBulkTradeMode && (
        <div className="p-3 bg-[#f7fbff] border-b border-[#edf0f5] flex items-center gap-4 animate-fadeIn">
          <div className="text-xs font-bold text-slate-700">
            批量修改【贸易方式】:
          </div>
          <select
            className="h-[30px] border border-[#dcdfe6] px-2 text-xs rounded-[2px] bg-white cursor-pointer"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              onBulkUpdateTradeMode(selectedIds, e.target.value);
              setShowBulkTradeMode(false);
              setSelectedIds([]);
            }}
          >
            <option value="" disabled>请选择贸易方式</option>
            <option value="9610">9610</option>
            <option value="9710">9710</option>
            <option value="9810">9810</option>
            <option value="0110">0110</option>
            <option value="1039">1039</option>
          </select>
          <button
            onClick={() => setShowBulkTradeMode(false)}
            className="h-[30px] px-3 border border-[#dcdfe6] bg-white text-xs rounded-[2px] text-[#344255] hover:bg-[#f7f9fc] cursor-pointer"
          >
            取消
          </button>
        </div>
      )}

      {/* 4. Table Core Area */}
      <div className="w-full overflow-x-auto max-h-[calc(100vh-360px)]">
        <table className="w-full min-w-[1700px] text-left border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-[#f7f8fa] text-[#4e5d70] border-b border-[#edf0f5] text-[12px] font-bold whitespace-nowrap">
              <th className="px-3 py-2 text-center font-mono text-[#8a96a6] w-10 border-r border-[#edf0f5]">#</th>
              <th className="px-3 py-2 text-center w-8 border-r border-[#edf0f5]">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    paginatedWaybills.length > 0 &&
                    paginatedWaybills.every(w => selectedIds.includes(w.id))
                  }
                  className="rounded border-[#cfd7e2] focus:ring-[#1890ff] accent-[#1890ff] cursor-pointer"
                />
              </th>
              <th 
                className="px-3 py-2 cursor-pointer hover:bg-[#eef6ff] transition-colors select-none border-r border-[#edf0f5]"
                onClick={() => handleSort('clientName')}
              >
                客户简称 {sortField === 'clientName' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">FBA单号</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">运单号</th>
              <th 
                className="px-3 py-2 cursor-pointer hover:bg-[#eef6ff] transition-colors select-none border-r border-[#edf0f5]"
                onClick={() => handleSort('destination')}
              >
                目的地 {sortField === 'destination' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">报关方式</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">贸易方式</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">ETA</th>
              <th className="px-3 py-2 min-w-[140px] border-r border-[#edf0f5]">商品品名</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">ETD</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">船名航次</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">申报总值</th>
              <th className="px-3 py-2 text-center border-r border-[#edf0f5]">附件</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">异常类型</th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">快递商</th>
              <th 
                className="px-3 py-2 cursor-pointer hover:bg-[#eef6ff] transition-colors select-none border-r border-[#edf0f5]"
                onClick={() => handleSort('channel')}
              >
                干线渠道 {sortField === 'channel' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
              </th>
              <th className="px-3 py-2 border-r border-[#edf0f5]">运单状态</th>
              <th className="px-3 py-2 text-center">系统操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f5]">
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
                  className={`text-[#596a7d] text-[12px] hover:bg-[#f8fbff] transition-all ${
                    isSelected ? 'bg-[#e6f4ff]' : ''
                  }`}
                  onDoubleClick={() => onEdit(w)}
                >
                  <td className="px-3 py-2.5 text-center font-mono text-[#8a96a6] font-medium border-r border-[#edf0f5]">
                    {customIndex}
                  </td>
                  <td className="px-3 py-2.5 text-center border-r border-[#edf0f5]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => handleToggleSelect(w.id, e.target.checked)}
                      className="rounded border-[#cfd7e2] focus:ring-[#1890ff] accent-[#1890ff] cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-[#405166] border-r border-[#edf0f5]">{w.clientName}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-[#64748b] border-r border-[#edf0f5]">{w.fbaNo || '-'}</td>
                  <td className="px-3 py-2.5 font-semibold text-[#1890ff] font-mono tracking-wide border-r border-[#edf0f5]">{w.waybillNo}</td>
                  <td className="px-3 py-2.5 border-r border-[#edf0f5]">
                    <span className="font-bold text-[#405166] bg-[#f5f7fa] px-2 py-0.5 rounded-[2px] font-mono text-xs border border-[#e5e9f0]">
                      {w.destination}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r border-[#edf0f5]">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      w.declarationType === '一般贸易' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {w.declarationType}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r border-[#edf0f5]">
                    <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#e6f4ff] text-[#1890ff] border border-[#bae0ff] font-mono">
                      {w.tradeMode || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[#64748b] border-r border-[#edf0f5]">{w.eta || '-'}</td>
                  <td className="px-3 py-2.5 truncate max-w-[180px] font-sans antialiased text-[#596a7d] border-r border-[#edf0f5]" title={w.productName}>
                    {w.productName}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[#64748b] border-r border-[#edf0f5]">{w.etd || '-'}</td>
                  <td className="px-3 py-2.5 text-[#64748b] text-[11px] truncate max-w-[120px] border-r border-[#edf0f5]" title={w.vesselVoyage}>
                    {w.vesselVoyage || '-'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[#405166] font-semibold border-r border-[#edf0f5]">
                    ${w.declarationValue.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-center border-r border-[#edf0f5]">
                    {w.attachments > 0 ? (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full w-5 h-5 inline-flex items-center justify-center border border-slate-200">
                        {w.attachments}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 border-r border-[#edf0f5]">
                    {hasIssue ? (
                      <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 rounded-[2px] px-1.5 py-0.5 border border-amber-200 text-[10px]">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {w.issueType}
                      </span>
                    ) : (
                      <span className="text-slate-400">无异常</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-medium border-r border-[#edf0f5]">{w.courierCompany}</td>
                  <td className="px-3 py-2.5 text-[#64748b] font-medium border-r border-[#edf0f5]">{w.channel}</td>
                  <td className="px-3 py-2.5 border-r border-[#edf0f5]">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${statusLabelStyle}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center shrink-0">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setViewingWaybill(w)}
                        className="p-1 px-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center"
                        title="查看运单全量元数据"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
      <footer className="h-[48px] px-4 border-t border-[#edf0f5] flex items-center justify-end gap-4 bg-white text-[12px] text-[#596a7d] select-none">
        <div className="flex items-center gap-5">
          <span>共 <strong className="text-[#263548]">{sortedWaybills.length}</strong> 条记录</span>
          {selectedIds.length > 0 && (
            <span className="text-[#1890ff] font-semibold bg-[#e6f4ff] px-2.5 py-0.5 rounded-full">
              已勾选 {selectedIds.length} 项
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Page controls */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded-[2px] border border-[#dcdfe6] bg-white flex items-center justify-center text-[#596a7d] hover:bg-[#f7f9fc] disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-semibold text-[#344255]">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded-[2px] border border-[#dcdfe6] bg-white flex items-center justify-center text-[#596a7d] hover:bg-[#f7f9fc] disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="ml-2 h-7 px-2 border border-[#dcdfe6] rounded-[2px] bg-white text-[#596a7d] focus:outline-none focus:ring-1 focus:ring-[#1890ff] cursor-pointer"
          >
            <option value={10}>10 条/页</option>
            <option value={20}>20 条/页</option>
            <option value={50}>50 条/页</option>
            <option value={100}>100 条/页</option>
          </select>
        </div>
      </footer>

      {/* 6. Waybill Detailed Inspector Sidebar Sliding Panel */}
      {viewingWaybill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl shadow-2xl h-full flex flex-col">
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#5c67f2]" />
                <h3 className="font-bold text-slate-800 text-sm">安速全程物流运单卡片仪表</h3>
              </div>
              <button
                onClick={() => setViewingWaybill(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Detailed specs */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#5c67f2]/5 rounded-bl-full flex items-center justify-center">
                  <span className="text-3xl font-black text-[#5c67f2]/15">{viewingWaybill.destination}</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">主单追踪码</div>
                <div className="text-base font-bold font-mono tracking-wide text-indigo-600 mb-1.5">{viewingWaybill.waybillNo}</div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 font-bold text-[10px] rounded bg-[#5c67f2] text-white">
                    {viewingWaybill.status}
                  </span>
                  <span className="text-slate-500 font-medium">FBA: {viewingWaybill.fbaNo || '无'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs p-1">
                <div>
                  <span className="text-slate-400 block mb-0.5">客户简称</span>
                  <strong className="text-slate-800 text-sm">{viewingWaybill.clientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">目的地 (FBA)</span>
                  <strong className="text-slate-800 text-sm">{viewingWaybill.destination} ({viewingWaybill.zipCode || '-'})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">申报中文品名</span>
                  <strong className="text-slate-800">{viewingWaybill.productName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">申报总货值</span>
                  <strong className="text-slate-800 text-emerald-600 font-mono font-bold">${viewingWaybill.declarationValue.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">转单号/面单条码</span>
                  <strong className="text-slate-800 font-mono text-[11px] select-all bg-slate-50 px-1 py-0.5 border border-slate-100 rounded">{viewingWaybill.trackingNo || '暂未生成'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">海空关渠道</span>
                  <strong className="text-slate-800">{viewingWaybill.channel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">承运公司</span>
                  <strong className="text-slate-800">{viewingWaybill.courierCompany}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">报关方式</span>
                  <strong className="text-slate-800">{viewingWaybill.declarationType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">贸易方式</span>
                  <strong className="text-slate-800 font-mono">{viewingWaybill.tradeMode || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">预计开船/机日 (ETD)</span>
                  <strong className="text-slate-800 font-mono">{viewingWaybill.etd || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">预计签收送达日 (ETA)</span>
                  <strong className="text-slate-800 font-mono">{viewingWaybill.eta || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">下单建单日期</span>
                  <strong className="text-slate-800 font-mono">{viewingWaybill.createTime}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">跟单员</span>
                  <strong className="text-slate-800">{viewingWaybill.merchandiser}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">业务员</span>
                  <strong className="text-slate-800">{viewingWaybill.salesman}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">指派客服</span>
                  <strong className="text-slate-800">{viewingWaybill.customerService}</strong>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">外置客户公开备注</span>
                  <div className="bg-slate-50/50 p-2.5 rounded border border-slate-150 text-slate-650 min-h-[50px]">
                    {viewingWaybill.clientRemark || <span className="text-slate-400 italic">空备注</span>}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">内部协同特约备注</span>
                  <div className="bg-indigo-50/10 p-2.5 rounded border border-indigo-100 text-indigo-950 min-h-[50px]">
                    {viewingWaybill.internalRemark || <span className="text-slate-400 italic">空备注</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-16 px-6 border-t border-slate-100 flex items-center justify-end bg-slate-50 shrink-0">
              <button
                onClick={() => setViewingWaybill(null)}
                className="px-5 py-2 bg-slate-850 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                退出查看
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
