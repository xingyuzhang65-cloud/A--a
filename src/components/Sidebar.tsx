import React, { useState } from 'react';
import { 
  FilePlus, Warehouse, FileText, ClipboardList, DollarSign, ShieldAlert, 
  Headphones, Globe, Coins, FileCheck, Receipt, PackageMinus, Wallet, 
  Wrench, ShoppingBag, Ruler, History, Box, Lock, ChevronDown, ChevronRight, Menu, ChevronLeft
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ currentTab, setCurrentTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '业务运单': true,
    '客服运单管理': false,
    '海外中转单': false,
    '财务运单': false,
    '工单': false,
    '服务订单': false,
    '货件管理': false
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const menuItems = [
    { name: '预报下单', icon: FilePlus, id: 'forecast-order' },
    { name: '未入仓运单', icon: Warehouse, id: 'unwarehoused' },
    { 
      name: '业务运单', 
      icon: FileText, 
      id: 'business-waybills',
      children: [
        { name: '运单', icon: ClipboardList, id: 'waybills' },
        { name: '运单报价', icon: DollarSign, id: 'waybill-quotes' }
      ]
    },
    { name: '扣货管理', icon: ShieldAlert, id: 'withheld-cargo' },
    { 
      name: '客服运单管理', 
      icon: Headphones, 
      id: 'customer-service-mgmt',
      children: [
        { name: '问题件处理', icon: ShieldAlert, id: 'issue-mgmt' },
        { name: '退件管理', icon: PackageMinus, id: 'return-mgmt' }
      ]
    },
    { 
      name: '海外中转单', 
      icon: Globe, 
      id: 'overseas-transit',
      children: [
        { name: '中转记录', icon: ClipboardList, id: 'transit-logs' }
      ]
    },
    { 
      name: '财务运单', 
      icon: Coins, 
      id: 'financial-waybills',
      children: [
        { name: '对账单管理', icon: FileCheck, id: 'statements' }
      ]
    },
    { name: '报价审批', icon: FileCheck, id: 'quote-approval' },
    { name: '来款登记', icon: Receipt, id: 'receipt-matching' },
    { name: '出仓单', icon: PackageMinus, id: 'out-warehouse-doc' },
    { name: '客户余额', icon: Wallet, id: 'client-balances' },
    { 
      name: '工单', 
      icon: Wrench, 
      id: 'work-orders',
      children: [
        { name: '我的工单', icon: Wrench, id: 'my-orders' }
      ]
    },
    { 
      name: '服务订单', 
      icon: ShoppingBag, 
      id: 'service-orders',
      children: [
        { name: '标签打印', icon: ClipboardList, id: 'label-print' }
      ]
    },
    { name: '修改材积运单', icon: Ruler, id: 'modify-volume' },
    { name: '仓库费用日志', icon: History, id: 'warehouse-fees' },
    { 
      name: '货件管理', 
      icon: Box, 
      id: 'cargo-mgmt',
      children: [
        { name: '装箱计划', icon: Box, id: 'packing-plan' }
      ]
    },
    { name: '预留仓', icon: Lock, id: 'reserved-warehouse' }
  ];

  return (
    <aside 
      className={`bg-[#1c2438] text-slate-300 flex flex-col transition-all duration-300 border-r border-[#2d3a5a] relative select-none h-screen ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      id="ans-sidebar"
    >
      {/* Brand logo */}
      <div className="h-16 flex items-center px-4 bg-[#141b2d] border-b border-[#2d3a5a] overflow-hidden gap-3">
        <div className="w-9 h-9 rounded bg-[#5c67f2] flex items-center justify-center text-white font-bold text-lg shrink-0">
          A
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-white font-bold text-sm tracking-wider">ANSU</span>
            <span className="text-xs text-slate-400">安速货运管理系统</span>
          </motion.div>
        )}
      </div>

      {/* Navigation menu list */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isGroup = !!item.children;
          const isExpanded = expandedGroups[item.name];

          if (isGroup) {
            return (
              <div key={item.id} className="space-y-1">
                {/* Parent Group Button */}
                <button
                  onClick={() => !isCollapsed && toggleGroup(item.name)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#232d48] rounded-md mx-2 ${
                    isCollapsed ? 'justify-center w-12' : 'max-w-[240px]'
                  } ${
                    currentTab === item.id || item.children?.some(c => c.id === currentTab)
                      ? 'bg-[#1f2842] text-[#6974f5]'
                      : 'text-slate-300'
                  }`}
                  title={item.name}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4.5 h-4.5 shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-slate-500">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  )}
                </button>

                {/* Sub-menu items */}
                {!isCollapsed && isExpanded && item.children && (
                  <div className="pl-9 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isActiveChild = currentTab === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => setCurrentTab(child.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded-md transition-colors hover:text-white ${
                            isActiveChild 
                              ? 'bg-[#5c67f2] text-white shadow-sm' 
                              : 'text-slate-400 hover:bg-[#232d48]'
                          }`}
                        >
                          <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Normal Item
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#232d48] rounded-md mx-2 ${
                isCollapsed ? 'justify-center w-12' : 'max-w-[240px]'
              } ${
                isActive 
                  ? 'bg-[#5c67f2] text-white' 
                  : 'text-slate-300'
              }`}
              title={item.name}
            >
              <IconComponent className="w-4.5 h-4.5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* Collapse control button */}
      <div className="p-3 border-t border-[#2d3a5a] flex justify-center bg-[#141b2d]">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded bg-[#1e273d] hover:bg-[#293553] text-slate-400 hover:text-white flex items-center justify-center focus:outline-none"
          aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
