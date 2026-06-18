import React, { useState } from 'react';
import {
  FilePlus, Warehouse, FileText, ClipboardList, DollarSign, ShieldAlert,
  Headphones, Globe, Coins, FileCheck, Receipt, PackageMinus, Wallet,
  Wrench, ShoppingBag, Ruler, History, Box, Lock, ChevronDown, ChevronRight,
  ChevronLeft, Menu
} from 'lucide-react';

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
      className={`relative z-10 flex h-screen flex-col border-r border-[#dbe9f5] bg-[#edf7ff] text-[#36485c] transition-all duration-200 select-none ${
        isCollapsed ? 'w-[64px]' : 'w-[176px]'
      }`}
      id="ans-sidebar"
    >
      <div className="h-[58px] flex items-center gap-2 px-4 bg-[#f7fbff] border-b border-[#dbe9f5] overflow-hidden">
        <div className="relative h-8 w-10 shrink-0">
          <span className="absolute left-0 top-4 h-2 w-7 -skew-x-12 bg-[#ff9f1a]" />
          <span className="absolute left-4 top-2 h-2 w-7 -skew-x-12 bg-[#e73135]" />
        </div>
        {!isCollapsed && (
          <div className="leading-tight">
            <div className="text-[15px] font-black text-[#e73135] tracking-tight">ANSU</div>
            <div className="text-[10px] font-semibold text-[#7b8794] whitespace-nowrap">安速货运</div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 sidebar-scroll">
        {menuItems.map(item => {
          const IconComponent = item.icon;
          const isGroup = !!item.children;
          const isExpanded = expandedGroups[item.name];
          const isGroupActive = currentTab === item.id || item.children?.some(child => child.id === currentTab);

          if (isGroup) {
            return (
              <div key={item.id}>
                <button
                  onClick={() => !isCollapsed && toggleGroup(item.name)}
                  title={item.name}
                  className={`relative flex min-h-[40px] w-full items-center gap-2 px-5 text-[13px] font-semibold transition-colors ${
                    isGroupActive ? 'text-[#1890ff]' : 'text-[#32465a] hover:bg-[#e1f1ff]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  {isGroupActive && <span className="absolute right-0 top-2 bottom-2 w-[3px] bg-[#1890ff]" />}
                  <IconComponent className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  {!isCollapsed && (
                    <span className="ml-auto text-[#68788a]">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </button>

                {!isCollapsed && isExpanded && item.children && (
                  <div className="py-1">
                    {item.children.map(child => {
                      const ChildIcon = child.icon;
                      const isActiveChild = currentTab === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => setCurrentTab(child.id)}
                          className={`relative flex min-h-[36px] w-full items-center gap-2 pl-10 pr-3 text-[12px] font-semibold transition-colors ${
                            isActiveChild ? 'bg-[#e6f4ff] text-[#1890ff]' : 'text-[#4e6074] hover:bg-[#e7f4ff]'
                          }`}
                        >
                          {isActiveChild && <span className="absolute right-0 top-1 bottom-1 w-[3px] bg-[#1890ff]" />}
                          <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              title={item.name}
              className={`relative flex min-h-[40px] w-full items-center gap-2 px-5 text-[13px] font-semibold transition-colors ${
                isActive ? 'bg-[#e6f4ff] text-[#1890ff]' : 'text-[#32465a] hover:bg-[#e1f1ff]'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              {isActive && <span className="absolute right-0 top-2 bottom-2 w-[3px] bg-[#1890ff]" />}
              <IconComponent className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </button>
          );
        })}
      </div>

      <div className="h-12 border-t border-[#dbe9f5] bg-[#f7fbff] flex items-center justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 flex items-center justify-center rounded text-[#40566c] hover:bg-[#e1f1ff]"
          aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
