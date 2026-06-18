import { Bell, ChevronDown, Download, MapPin, Menu, Play, UserRound } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-[36px] shrink-0 bg-white border-b border-[#e7edf5] flex items-center justify-between px-3 select-none">
      <div className="flex items-center h-full gap-2">
        <button className="top-icon" aria-label="菜单">
          <Menu className="h-4 w-4" />
        </button>
        <button className="top-icon text-[#1f2d3d]" aria-label="返回">
          <span className="text-[12px]">◀</span>
        </button>
        <div className="flex items-center gap-1.5">
          <button className="page-tab active">运单 <span>×</span></button>
          <button className="page-tab">404 <span>×</span></button>
          <button className="page-tab">跟单运单 <span>×</span></button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[#1f2d3d]">
        <Play className="h-3.5 w-3.5 fill-current" />
        <button className="relative top-icon" aria-label="通知">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-[#ff4d4f] px-1 text-[10px] font-bold leading-4 text-white">0</span>
        </button>
        <Download className="h-4 w-4" />
        <span className="inline-flex h-6 items-center gap-1 rounded-[2px] bg-[#eef4fb] px-2 text-[12px] font-semibold text-[#6b7788]">
          <MapPin className="h-3.5 w-3.5 text-[#8aa0b8]" />
          糖原仓
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#344255]">
          <UserRound className="h-3.5 w-3.5" />
          天朗（付家）
          <ChevronDown className="h-3.5 w-3.5 text-[#9aa5b1]" />
        </span>
      </div>
    </header>
  );
}
