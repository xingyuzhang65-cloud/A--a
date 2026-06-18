import { useEffect, useState } from 'react';
import FilterForm from './components/FilterForm';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import WaybillTable from './components/WaybillTable';
import { INITIAL_WAYBILLS } from './data';
import { FilterParams, Waybill, WaybillStatus } from './types';

const STORAGE_KEY = 'tiantu_waybills_ui_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState('waybills');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentStatusTab, setCurrentStatusTab] = useState('已下单');
  const [filterParams, setFilterParams] = useState<FilterParams | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setWaybills(INITIAL_WAYBILLS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WAYBILLS));
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Waybill[];
      setWaybills(Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_WAYBILLS);
    } catch {
      setWaybills(INITIAL_WAYBILLS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WAYBILLS));
    }
  }, []);

  const filteredWaybills = waybills.filter((item) => {
    if (!filterParams) return true;

    const keyword = filterParams.keyword.trim().toLowerCase();
    if (keyword) {
      const parts = keyword.split(/[\s,，]+/).filter(Boolean);
      const haystack = [item.waybillNo, item.groupNo, item.clientName, item.mark, item.fbaNo].join(' ').toLowerCase();
      if (!parts.some((part) => haystack.includes(part))) return false;
    }

    const checks: Array<[keyof FilterParams, string]> = [
      ['groupNo', item.groupNo],
      ['operator', item.operator],
      ['clientName', item.clientName],
      ['waybillNo', item.waybillNo],
      ['warehouseCode', item.warehouseCode],
      ['zipCode', item.zipCode],
      ['country', item.country],
      ['service', item.service],
      ['fbaNo', item.fbaNo],
      ['channel', item.channel],
      ['salesman', item.salesman],
    ];

    return checks.every(([key, value]) => {
      const needle = String(filterParams[key] ?? '').trim().toLowerCase();
      return !needle || value.toLowerCase().includes(needle);
    });
  });

  const updateWaybills = (nextWaybills: Waybill[]) => {
    setWaybills(nextWaybills);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWaybills));
  };

  const handleBulkUpdateStatus = (ids: string[], newStatus: WaybillStatus) => {
    updateWaybills(waybills.map((item) => (ids.includes(item.id) ? { ...item, status: newStatus } : item)));
  };

  const handleBulkUpdateTradeMode = (ids: string[], tradeMode: string) => {
    updateWaybills(waybills.map((item) => (ids.includes(item.id) ? { ...item, tradeMode } : item)));
  };

  const handleBulkUpdateRemark = (ids: string[], type: 'client' | 'internal', remark: string) => {
    updateWaybills(
      waybills.map((item) => {
        if (!ids.includes(item.id)) return item;
        return type === 'client' ? { ...item, clientRemark: remark } : { ...item, internalRemark: remark };
      }),
    );
  };

  return (
    <div className="h-screen min-w-[1440px] overflow-hidden bg-[#eef3f8] font-sans text-[#263548] antialiased">
      <div className="flex h-full">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#eef3f8]">
          <Topbar />
          <FilterForm onSearch={setFilterParams} onReset={() => setFilterParams(null)} />

          <div className="flex-1 overflow-hidden p-[10px]">
            {currentTab === 'waybills' ? (
              <WaybillTable
                waybills={filteredWaybills}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={() => undefined}
                onDelete={() => undefined}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onBulkUpdateTradeMode={handleBulkUpdateTradeMode}
                onBulkUpdateRemark={handleBulkUpdateRemark}
                onOpenStats={() => undefined}
                currentStatusTab={currentStatusTab}
                setCurrentStatusTab={setCurrentStatusTab}
                onMakeInvoice={() => undefined}
              />
            ) : (
              <div className="h-full border border-[#e3e9f2] bg-white p-10 text-center text-[13px] font-semibold text-[#7a8797]">
                当前模块正在建设中
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
