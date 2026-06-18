import { useMemo, useState } from 'react';
import type React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Settings,
} from 'lucide-react';
import { STATUS_COUNTS } from '../data';
import { Waybill, WaybillStatus } from '../types';

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

const statusTabs = ['已下单', '已收货', '已确认', '转运中', '已签收', '退件', '已取消', '全部', '未确认'];
const toolbarItems = ['其他', '打印标签', '批量操作', '导出', '批量添加', '转单号', '查看统计', '查看日志', '打印入仓单', '改线订单', '同步FBA', '推送报关', '抬头信息维护', '美线入库数据推送', '欧线入库数据推送'];

const columns: Array<{ key: keyof Waybill | 'select'; title: string; className?: string }> = [
  { key: 'select', title: '', className: 'w-[38px] text-center' },
  { key: 'waybillNo', title: '运单号', className: 'min-w-[170px]' },
  { key: 'mark', title: '标识', className: 'min-w-[120px]' },
  { key: 'createTime', title: '创建时间', className: 'min-w-[150px]' },
  { key: 'pickTime', title: '拣货时间', className: 'min-w-[150px]' },
  { key: 'outboundNo', title: '出货单', className: 'min-w-[145px]' },
  { key: 'groupNo', title: '集团单号', className: 'min-w-[160px]' },
  { key: 'clientName', title: '客户', className: 'min-w-[110px]' },
  { key: 'extraFeeRequest', title: '附加费申请', className: 'min-w-[130px]' },
  { key: 'zipCode', title: '邮编', className: 'min-w-[90px]' },
  { key: 'operator', title: '经营单位', className: 'min-w-[130px]' },
  { key: 'clientType', title: '客户类型', className: 'min-w-[100px]' },
  { key: 'service', title: '服务', className: 'min-w-[190px]' },
  { key: 'warehouseCode', title: '仓库代码', className: 'min-w-[95px]' },
  { key: 'country', title: '国家', className: 'min-w-[75px]' },
  { key: 'trackingTemplate', title: '运踪模板', className: 'min-w-[110px]' },
  { key: 'pieces', title: '件数', className: 'min-w-[72px] text-center' },
  { key: 'declarationValue', title: '申报价', className: 'min-w-[88px] text-center' },
  { key: 'declarationType', title: '申报', className: 'min-w-[70px] text-center' },
  { key: 'status', title: '运单状态', className: 'min-w-[95px] text-center' },
];

export default function WaybillTable({
  waybills,
  selectedIds,
  setSelectedIds,
  onEdit,
  currentStatusTab,
  setCurrentStatusTab,
}: WaybillTableProps) {
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    if (currentStatusTab === '全部') return waybills;
    return waybills.filter((item) => item.status === currentStatusTab);
  }, [currentStatusTab, waybills]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleAll = (checked: boolean) => {
    const pageIds = rows.map((item) => item.id);
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, ...pageIds])) : prev.filter((id) => !pageIds.includes(id))));
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const renderCell = (row: Waybill, key: keyof Waybill | 'select') => {
    if (key === 'select') {
      return (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(event) => toggleRow(row.id, event.target.checked)}
          className="accent-[#0b5db8]"
        />
      );
    }

    if (key === 'waybillNo') {
      return (
        <div className="leading-[18px] font-medium text-[#5c6c7f]">
          <div>{row.waybillNo}</div>
          <div>{row.waybillNo}</div>
          {row.mark.includes('未上传') && <div className="mt-1 font-bold text-[#f5222d]">未上传报关资料</div>}
        </div>
      );
    }

    if (key === 'mark') {
      return <div className="whitespace-pre-line leading-[18px]">{row.mark.replace('未上传报关资料', '')}</div>;
    }

    if (key === 'pieces') {
      return <span className="font-bold text-[#f5222d]">{row.pieces}</span>;
    }

    if (key === 'declarationValue') {
      return <span>{row.declarationValue || 0}</span>;
    }

    if (key === 'status') {
      return <span className="rounded-[3px] bg-[#e8f2ff] px-2 py-1 text-[12px] font-bold text-[#2f8cff]">{row.status}</span>;
    }

    return <span>{String(row[key] ?? '')}</span>;
  };

  return (
    <section className="bg-white border border-[#e3e9f2] shadow-[0_2px_8px_rgba(31,45,61,0.08)]">
      <div className="h-[52px] px-3 flex items-end justify-between border-b border-[#edf1f6]">
        <div className="flex h-full items-end overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setCurrentStatusTab(tab);
                setCurrentPage(1);
              }}
              className={`h-[46px] px-4 border-b-2 text-[13px] font-bold whitespace-nowrap ${currentStatusTab === tab ? 'border-[#0052b8] text-[#0052b8]' : 'border-transparent text-[#344255] hover:text-[#0052b8]'}`}
            >
              {tab === '未确认' ? tab : `${tab}(${STATUS_COUNTS[tab] ?? 0})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-[7px]">
          <button className="primary-btn">快捷下单</button>
          <button className="plain-btn">Excel导入下单</button>
          <button className="primary-btn">解析发票下单(新版)</button>
          <button className="primary-btn">重算附加费</button>
        </div>
      </div>

      <div className="h-[48px] px-3 flex items-center justify-between border-b border-[#edf1f6] bg-white">
        <div className="flex items-center gap-2 overflow-hidden">
          {toolbarItems.map((item, index) => (
            <button key={item} className="primary-btn shrink-0">
              {index === 1 && <Printer className="h-3.5 w-3.5" />}
              {index === 8 && <FileText className="h-3.5 w-3.5" />}
              {item}
              {['其他', '打印标签', '批量操作', '导出', '批量添加', '转单号', '推送报关'].includes(item) && <ChevronDown className="h-3 w-3" />}
            </button>
          ))}
        </div>
        <button className="primary-btn h-[32px] w-[36px] justify-center px-0" title="列表设置">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[calc(100vh-252px)] overflow-auto">
        <table className="w-full min-w-[2100px] border-collapse text-[12px] text-[#596a7d]">
          <thead className="sticky top-0 z-10 bg-[#f6f7f9] text-[#47566a]">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className={`h-[34px] border-b border-r border-[#e8edf3] px-3 text-center font-bold ${column.className ?? ''}`}>
                  {column.key === 'select' ? (
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))}
                      onChange={(event) => toggleAll(event.target.checked)}
                      className="accent-[#0b5db8]"
                    />
                  ) : (
                    column.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                onDoubleClick={() => onEdit(row)}
                className={`${index === 2 ? 'bg-[#f1f4f8]' : 'bg-white'} hover:bg-[#eef6ff]`}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className={`h-[96px] border-b border-r border-[#edf1f6] px-3 align-middle ${column.className ?? ''}`}>
                    {renderCell(row, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="h-[48px] flex items-center justify-end gap-4 border-t border-[#edf1f6] px-4 text-[13px] text-[#596a7d]">
        <span>共 4053 条</span>
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setCurrentPage(1);
          }}
          className="h-[30px] rounded-[2px] border border-[#d8e0ea] bg-white px-2 outline-none"
        >
          <option value={50}>50条/页</option>
          <option value={100}>100条/页</option>
          <option value={200}>200条/页</option>
        </select>
        <div className="flex items-center gap-4 font-bold">
          <button className="pagination-arrow" onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          {[1, 2, 3, 4, 5, 6].map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? 'text-[#2f8cff]' : 'text-[#344255]'}>
              {page}
            </button>
          ))}
          <span>...</span>
          <button>41</button>
          <button className="pagination-arrow" onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <span>前往</span>
        <input className="h-[30px] w-[42px] rounded-[2px] border border-[#d8e0ea] text-center outline-none" value={currentPage} readOnly />
        <span>页</span>
      </footer>
    </section>
  );
}
