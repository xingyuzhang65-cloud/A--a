import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import FilterForm from './components/FilterForm';
import WaybillTable from './components/WaybillTable';
import StatsPanel from './components/StatsPanel';
import AddEditModal from './components/AddEditModal';
import AddUserModal from './components/AddUserModal';
import AssistantBot from './components/AssistantBot';
import InvoiceModal from './components/InvoiceModal';
import ManagementCenter, { DEFAULT_MANAGEMENT_USERS } from './components/ManagementCenter';
import { INITIAL_WAYBILLS } from './data';
import { Waybill, FilterParams, WaybillStatus, User } from './types';
import { ShieldCheck, Info, Package, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { appendTradeModeLog, seedTradeModeLogs } from './components/TradeModeLogModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('waybills');
  const [globalNav, setGlobalNav] = useState<string>('waybill-manage');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Waybill inventory list state (synchronized with localStorage)
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentStatusTab, setCurrentStatusTab] = useState<string>('全部');
  const [filterParams, setFilterParams] = useState<FilterParams | null>(null);

  // Layout overlay triggers
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingWaybill, setEditingWaybill] = useState<Waybill | null>(null);
  const [invoiceWaybill, setInvoiceWaybill] = useState<Waybill | null>(null);

  // User management
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);

  // Initialize and load dataset
  useEffect(() => {
    // Seed historical trade mode change logs
    seedTradeModeLogs();

    const saved = localStorage.getItem('ans_waybills');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: add tradeMode if missing from old data
        if (parsed.length > 0 && !('tradeMode' in parsed[0])) {
          const defaultMap = Object.fromEntries(INITIAL_WAYBILLS.map(w => [w.id, w.tradeMode]));
          const migrated = parsed.map((w: Waybill) => ({
            ...w,
            tradeMode: w.tradeMode || defaultMap[w.id] || '9610'
          }));
          setWaybills(migrated);
          localStorage.setItem('ans_waybills', JSON.stringify(migrated));
        } else {
          setWaybills(parsed);
        }
      } catch (err) {
        console.error('Failed to parse waybills from localStorage, resetting:', err);
        setWaybills(INITIAL_WAYBILLS);
        localStorage.setItem('ans_waybills', JSON.stringify(INITIAL_WAYBILLS));
      }
    } else {
      setWaybills(INITIAL_WAYBILLS);
      localStorage.setItem('ans_waybills', JSON.stringify(INITIAL_WAYBILLS));
    }

    const savedUsers = localStorage.getItem('ans_users');
    if (savedUsers) {
      try { setUsers(JSON.parse(savedUsers)); } catch { setUsers(DEFAULT_MANAGEMENT_USERS); }
    } else {
      setUsers(DEFAULT_MANAGEMENT_USERS);
      localStorage.setItem('ans_users', JSON.stringify(DEFAULT_MANAGEMENT_USERS));
    }
  }, []);

  // Sync to Storage on alterations
  const updateWaybills = (newWaybills: Waybill[]) => {
    setWaybills(newWaybills);
    localStorage.setItem('ans_waybills', JSON.stringify(newWaybills));
  };

  // Add or Edit Waybill
  const handleSaveWaybill = (waybill: Waybill) => {
    const exists = waybills.some(w => w.id === waybill.id);
    let updated: Waybill[] = [];
    if (exists) {
      updated = waybills.map(w => w.id === waybill.id ? waybill : w);
    } else {
      // Assign custom progressive serial index
      const maxIdx = waybills.reduce((max, w) => Math.max(max, w.idx || 0), 0);
      waybill.idx = maxIdx + 1;
      updated = [waybill, ...waybills];
    }
    updateWaybills(updated);
    setShowAddEditModal(false);
    setEditingWaybill(null);
  };

  // Delete Waybill
  const handleDeleteWaybill = (id: string) => {
    const target = waybills.find(w => w.id === id);
    if (!target) return;
    if (window.confirm(`⚠️ 请确认是否永久作废并删除运单 【${target.waybillNo}】？该操作无法撤销。`)) {
      const updated = waybills.filter(w => w.id !== id);
      updateWaybills(updated);
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk status assignment
  const handleBulkUpdateStatus = (ids: string[], newStatus: WaybillStatus) => {
    const updated = waybills.map(w => {
      if (ids.includes(w.id)) {
        return { ...w, status: newStatus };
      }
      return w;
    });
    updateWaybills(updated);
    alert(`Success: 已成功将所选的 ${ids.length} 票运单状态变更为《${newStatus}》。`);
  };

  // Bulk remark appendance
  const handleBulkUpdateRemark = (ids: string[], type: 'client' | 'internal', remark: string) => {
    const updated = waybills.map(w => {
      if (ids.includes(w.id)) {
        if (type === 'client') {
          return { ...w, clientRemark: remark };
        } else {
          return { ...w, internalRemark: remark };
        }
      }
      return w;
    });
    updateWaybills(updated);
    alert(`Success: 与会运单批注已附带统一备注内容。`);
  };

  // Bulk trade mode update
  const handleBulkUpdateTradeMode = (ids: string[], tradeMode: string) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const updated = waybills.map(w => {
      if (ids.includes(w.id)) {
        // Record trade mode change log
        if (w.tradeMode !== tradeMode) {
          appendTradeModeLog({
            waybillId: w.id,
            waybillNo: w.waybillNo,
            from: w.tradeMode || '无',
            to: tradeMode,
            timestamp,
            operator: '安速操作员'
          });
        }
        return { ...w, tradeMode };
      }
      return w;
    });
    updateWaybills(updated);
    alert(`Success: 已成功将所选的 ${ids.length} 票运单贸易方式变更为 ${tradeMode}。`);
  };

  const handleSaveUser = (user: User) => {
    const updated = [user, ...users];
    setUsers(updated);
    localStorage.setItem('ans_users', JSON.stringify(updated));
  };

  const handleUsersChange = (updated: User[]) => {
    setUsers(updated);
    localStorage.setItem('ans_users', JSON.stringify(updated));
  };

  const handleInvoiceSave = (waybillId: string, updatedFields: Partial<Waybill>) => {
    const updated = waybills.map(w => {
      if (w.id === waybillId) {
        return { ...w, ...updatedFields };
      }
      return w;
    });
    updateWaybills(updated);
    setSelectedIds([]);
  };

  // Query Filter Engine
  const filteredWaybills = waybills.filter(w => {
    if (!filterParams) return true;

    // 1. Keyword search (OR match: client name, waybill tracking, FBA label, destination)
    if (filterParams.keyword) {
      const kw = filterParams.keyword.trim().toLowerCase();
      const match = kw.split(/[\s,]+/).some(k => 
        w.clientName.toLowerCase().includes(k) || 
        w.waybillNo.toLowerCase().includes(k) || 
        (w.fbaNo && w.fbaNo.toLowerCase().includes(k)) ||
        w.destination.toLowerCase().includes(k)
      );
      if (!match) return false;
    }

    // 2. Direct exact/substring matches
    if (filterParams.clientName && !w.clientName.toLowerCase().includes(filterParams.clientName.trim().toLowerCase())) return false;
    if (filterParams.warehouseCode && !w.warehouseCode.toLowerCase().includes(filterParams.warehouseCode.trim().toLowerCase())) return false;
    if (filterParams.zipCode && !w.zipCode.toLowerCase().includes(filterParams.zipCode.trim().toLowerCase())) return false;
    if (filterParams.merchandiser && !w.merchandiser.toLowerCase().includes(filterParams.merchandiser.trim().toLowerCase())) return false;
    if (filterParams.label && !w.label.toLowerCase().includes(filterParams.label.trim().toLowerCase())) return false;
    if (filterParams.waybillNo && !w.waybillNo.toLowerCase().includes(filterParams.waybillNo.trim().toLowerCase())) return false;
    if (filterParams.invoiceMade && filterParams.invoiceMade !== '全部' && w.invoiceMade !== filterParams.invoiceMade) return false;
    if (filterParams.destination && !w.destination.toLowerCase().includes(filterParams.destination.trim().toLowerCase())) return false;
    if (filterParams.taxPayment && !w.taxPayment.toLowerCase().includes(filterParams.taxPayment.trim().toLowerCase())) return false;
    if (filterParams.operator && !w.operator.toLowerCase().includes(filterParams.operator.trim().toLowerCase())) return false;
    if (filterParams.trackingNo && !w.trackingNo.toLowerCase().includes(filterParams.trackingNo.trim().toLowerCase())) return false;
    if (filterParams.declarationType && filterParams.declarationType !== '全部' && w.declarationType !== filterParams.declarationType) return false;
    if (filterParams.tradeMode.length > 0 && !filterParams.tradeMode.includes(w.tradeMode)) return false;
    if (filterParams.clientRemark && !w.clientRemark.toLowerCase().includes(filterParams.clientRemark.trim().toLowerCase())) return false;
    if (filterParams.fbaNo && !w.fbaNo.toLowerCase().includes(filterParams.fbaNo.trim().toLowerCase())) return false;
    if (filterParams.channel && !w.channel.toLowerCase().includes(filterParams.channel.trim().toLowerCase())) return false;
    if (filterParams.internalRemark && !w.internalRemark.toLowerCase().includes(filterParams.internalRemark.trim().toLowerCase())) return false;
    if (filterParams.salesman && !w.salesman.toLowerCase().includes(filterParams.salesman.trim().toLowerCase())) return false;
    if (filterParams.customerService && !w.customerService.toLowerCase().includes(filterParams.customerService.trim().toLowerCase())) return false;
    if (filterParams.hasInsurance && filterParams.hasInsurance !== '全部' && w.hasInsurance !== filterParams.hasInsurance) return false;
    if (filterParams.hasDocs && filterParams.hasDocs !== '全部' && w.hasDocs !== filterParams.hasDocs) return false;
    if (filterParams.customsRoom && filterParams.customsRoom !== '全部' && w.customsRoom !== filterParams.customsRoom) return false;
    
    // 3. Product name with SPACE -> AND condition matching!
    if (filterParams.productName) {
      const keywords = filterParams.productName.trim().toLowerCase().split(/\s+/);
      const mainText = w.productName.toLowerCase();
      const matchAll = keywords.every(kw => mainText.includes(kw));
      if (!matchAll) return false;
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans overflow-hidden antialiased text-slate-800">
      {/* Sidebar panel */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* Main Core Space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen bg-[#f8fafc]">
        {/* Top bar header */}
        <Topbar
          activeNav={globalNav}
          onNavChange={(nav) => {
            setGlobalNav(nav);
            if (nav === 'waybill-manage') setCurrentTab('waybills');
            else if (nav === 'admin-center') setCurrentTab('management-org');
            else setCurrentTab(nav);
          }}
          onAddUser={() => setShowAddUserModal(true)}
          onDirectOrder={() => {
            setEditingWaybill(null);
            setShowAddEditModal(true);
          }}
        />

        {/* Dynamic page tab header bar */}
        <div className="h-10 bg-white border-b border-slate-200 px-4 flex items-center gap-1 shrink-0 select-none">
          <div className="text-slate-400 font-bold px-1.5 cursor-default hover:text-slate-600 text-sm">☰</div>
          <div className="text-slate-400 font-bold px-1.5 cursor-default hover:text-slate-600 text-sm">‹</div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none h-full">
            <button className="px-3.5 h-8 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
              预报下单 <span className="text-[10px] text-slate-400">×</span>
            </button>
            <button className="px-3.5 h-8 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
              预留仓 <span className="text-[10px] text-slate-400">×</span>
            </button>
            <button className={`px-4 h-8 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
              currentTab === 'waybills'
                ? 'bg-[#5c67f2] text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              业务运单监控 <span className="text-[10px] opacity-70">×</span>
            </button>
            {globalNav === 'admin-center' && (
              <>
                <button className="px-3.5 h-8 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
                  角色与权限 <span className="text-[10px] text-slate-400">×</span>
                </button>
                <button className="px-3.5 h-8 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
                  司机管理 <span className="text-[10px] text-slate-400">×</span>
                </button>
                <button className="px-4 h-8 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all bg-[#5c67f2] text-white shadow-sm">
                  组织架构 <span className="text-[10px] opacity-70">×</span>
                </button>
              </>
            )}
          </div>
          
          <div className="text-slate-400 font-bold px-2 ml-auto cursor-default hover:text-slate-600 text-sm">›</div>
        </div>

        {/* Dynamic View container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {globalNav === 'admin-center' ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full"
              >
                <ManagementCenter users={users} onAddUser={() => setShowAddUserModal(true)} onUsersChange={handleUsersChange} />
              </motion.div>
            ) : currentTab === 'waybills' ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6"
              >
                {/* 1. Statistics Dashboard Panel */}
                {showStats && (
                  <StatsPanel 
                    waybills={filteredWaybills} 
                    onClose={() => setShowStats(false)} 
                  />
                )}

                {/* 2. Grid criteria search filter */}
                <FilterForm 
                  onSearch={(params) => setFilterParams(params)}
                  onReset={() => setFilterParams(null)}
                />

                {/* 3. Table core list and status tabs */}
                <WaybillTable
                  waybills={filteredWaybills}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  onEdit={(waybill) => {
                    setEditingWaybill(waybill);
                    setShowAddEditModal(true);
                  }}
                  onDelete={handleDeleteWaybill}
                  onBulkUpdateStatus={handleBulkUpdateStatus}
                  onBulkUpdateTradeMode={handleBulkUpdateTradeMode}
                  onBulkUpdateRemark={handleBulkUpdateRemark}
                  onOpenStats={() => setShowStats(true)}
                  currentStatusTab={currentStatusTab}
                  setCurrentStatusTab={setCurrentStatusTab}
                  onMakeInvoice={(waybillId) => {
                    const target = waybills.find(w => w.id === waybillId);
                    if (target) {
                      setInvoiceWaybill(target);
                    }
                  }}
                />
              </motion.div>
            ) : (
              // Secondary system views placeholders under construction
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-4 select-none"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 text-[#5c67f2] flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800 text-sm">模块功能开发部署中</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    您好！当前栏目（{currentTab}）已被安速货运纳入第二期智能化敏捷改造计划。
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setCurrentTab('waybills')}
                    className="px-4 py-2 bg-[#5c67f2] hover:bg-[#4a55e0] text-white font-bold text-xs rounded transition-all shadow-xs cursor-pointer"
                  >
                    返回《业务运单》工作台
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide-over dialogue drawer for creations/edits */}
      <AnimatePresence>
        {showAddEditModal && (
          <AddEditModal
            isOpen={showAddEditModal}
            onClose={() => {
              setShowAddEditModal(false);
              setEditingWaybill(null);
            }}
            onSave={handleSaveWaybill}
            editingWaybill={editingWaybill}
          />
        )}
      </AnimatePresence>

      {/* Invoice Generation Modal workspace */}
      <AnimatePresence>
        {invoiceWaybill && (
          <InvoiceModal
            isOpen={invoiceWaybill !== null}
            waybill={invoiceWaybill}
            onClose={() => setInvoiceWaybill(null)}
            onSave={handleInvoiceSave}
          />
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSave={handleSaveUser}
      />

      {/* Gemini AI Floating Assistant Robot */}
      <AssistantBot currentWaybills={waybills} />
    </div>
  );
}
