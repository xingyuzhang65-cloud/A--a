import {
  BarChart3,
  Box,
  ClipboardList,
  Database,
  Download,
  FileText,
  Grid2X2,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Wallet,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const railItems = [
  { label: '单据', icon: FileText },
  { label: '仓库', icon: ShoppingCart, active: true },
  { label: '产品', icon: Box },
  { label: '订单', icon: ClipboardList },
  { label: '财务', icon: Database },
  { label: '询价', icon: Tag },
  { label: '统计', icon: Grid2X2 },
  { label: '配置', icon: Settings },
  { label: '管理', icon: Wallet },
  { label: '导出', icon: Download },
  { label: '系统', icon: Package },
  { label: '营销', icon: BarChart3 },
  { label: '预关', icon: Truck },
];

const groups = [
  { title: '运单', children: [{ label: '运单', id: 'waybills' }, { label: '跟单运单', id: 'follow-waybills' }, { label: '业务运单', id: 'business-waybills' }] },
  { title: '提单', children: [] },
  { title: '工单', children: [] },
  { title: '打单', children: [] },
  { title: '预留仓', children: [] },
  { title: '海外中转单管理', children: [] },
  { title: '货件管理', children: [] },
];

export default function Sidebar({ currentTab, setCurrentTab, isCollapsed }: SidebarProps) {
  return (
    <aside className={`h-screen shrink-0 bg-white border-r border-[#e4ebf4] flex select-none ${isCollapsed ? 'w-[48px]' : 'w-[184px]'}`}>
      <div className="w-[40px] bg-[#0758ae] text-white flex flex-col items-center py-2 gap-1">
        {railItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`w-full h-[45px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${item.active ? 'bg-[#0b4f9d]' : 'hover:bg-[#0d68c8]'}`}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {!isCollapsed && (
        <div className="w-[144px] bg-[#fbfdff]">
          <div className="h-[80px] flex flex-col items-center justify-center border-b border-[#edf2f7]">
            <div className="relative h-9 w-[90px]">
              <span className="absolute left-4 top-1 h-2 w-20 -skew-x-[28deg] bg-[#f2a400]" />
              <span className="absolute left-2 top-3 h-2 w-16 -skew-x-[28deg] bg-[#1f92dc]" />
              <span className="absolute left-12 top-1 h-2 w-12 -skew-x-[28deg] bg-[#22a6e8]" />
              <span className="absolute left-5 top-5 text-[19px] font-black italic text-[#1d8bd0] tracking-[-1px]">Tiantu</span>
            </div>
            <div className="text-[10px] font-bold text-[#2f435a] tracking-[2px]">聚焦欧美 空海运专线</div>
          </div>

          <nav className="py-3 text-[#4b5d73]">
            {groups.map((group) => (
              <div key={group.title}>
                <button className="h-[42px] w-full px-5 flex items-center gap-2 text-[13px] font-bold hover:bg-[#f0f6fd]">
                  <ClipboardList className="h-4 w-4 text-[#71839b]" />
                  <span>{group.title}</span>
                  {group.children.length > 0 && <span className="ml-auto text-[#8a96a6]">⌄</span>}
                </button>
                {group.children.length > 0 && (
                  <div className="py-1">
                    {group.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setCurrentTab(child.id)}
                        className={`h-[38px] w-full pl-[56px] pr-3 text-left text-[13px] font-semibold ${currentTab === child.id ? 'bg-[#f2f2f2] text-[#0052b8]' : 'hover:bg-[#f5f8fc]'}`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
