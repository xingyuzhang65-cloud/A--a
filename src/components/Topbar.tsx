import React, { useState, useEffect } from 'react';
import { Bell, User, Clock, Terminal, Check, UserPlus } from 'lucide-react';

interface TopbarProps {
  onDirectOrder: () => void;
  onAddUser: () => void;
  onNavChange: (nav: string) => void;
  activeNav: string;
}

export default function Topbar({ onDirectOrder, onAddUser, onNavChange, activeNav }: TopbarProps) {
  const [systime, setSystime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystime(now.toLocaleString('zh-CN', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const notifications = [
    { id: 1, title: '运单清关预警', desc: '博宇家居运单 ANSU2026060107 清关文件已签回 POD', time: '刚刚' },
    { id: 2, title: '海关直查查验通知', desc: '罗湖海关一号查验室对运单 ANSU2026060108 正在开箱查验', time: '10分钟前' }
  ];

  return (
    <header className="h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-6 select-none shrink-0 text-slate-200">
      {/* Module selector tabs */}
      <div className="flex items-center gap-1.5 h-full overflow-x-auto scrollbar-none">
        <button
          onClick={() => onNavChange('waybill-manage')}
          className={`px-3.5 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeNav === 'waybill-manage' ? 'text-white bg-[#5c67f2]' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-semibold'
          }`}>
          运单管理
        </button>
        <button
          onClick={() => onNavChange('finance-manage')}
          className={`px-3.5 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeNav === 'finance-manage' ? 'text-white bg-[#5c67f2]' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-semibold'
          }`}>
          财务管理
        </button>
        <button
          onClick={() => onNavChange('admin-center')}
          className={`px-3.5 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeNav === 'admin-center' ? 'text-white bg-[#5c67f2]' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-semibold'
          }`}>
          管理中心
        </button>
        <button
          onClick={() => onNavChange('config-center')}
          className={`px-3.5 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeNav === 'config-center' ? 'text-white bg-[#5c67f2]' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-semibold'
          }`}>
          配置中心
        </button>
        <button
          onClick={() => onNavChange('export-center')}
          className={`px-3.5 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeNav === 'export-center' ? 'text-white bg-[#5c67f2]' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-semibold'
          }`}>
          导出中心
        </button>
        <button
          onClick={() => onNavChange('report-center')}
          className={`px-3.5 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeNav === 'report-center' ? 'text-white bg-[#5c67f2]' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-semibold'
          }`}>
          报表中心
        </button>
        <button
          onClick={() => onNavChange('approval-manage')}
          className={`px-3.5 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeNav === 'approval-manage' ? 'text-white bg-[#5c67f2]' : 'text-slate-300 hover:text-white hover:bg-slate-800 font-semibold'
          }`}>
          审批管理
        </button>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 font-mono text-xs font-semibold select-none">
          <Clock className="w-3.5 h-3.5" />
          <span>{systime || '-'}</span>
        </div>

        {/* Add User Action */}
        <button
          onClick={onAddUser}
          className="px-4 py-2 bg-[#5c67f2] hover:bg-[#4a55e0] active:bg-[#3f4bd0] text-white rounded text-xs font-bold tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          新增用户
        </button>

        {/* Direct Booking Action */}
        <button
          onClick={onDirectOrder}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded text-xs font-bold tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>＋</span> 直客下单
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 hover:bg-slate-800 rounded-full flex items-center justify-center relative cursor-pointer text-slate-300 hover:text-white transition-all focus:outline-none"
            aria-label="查看新通知"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              2
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-205 rounded-lg shadow-2xl z-55 animate-fadeIn">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-lg">
                <span className="text-xs font-bold text-slate-800">通知中心</span>
                <span className="text-[10px] text-[#5c67f2] font-semibold cursor-pointer">标记全读</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-64">
                {notifications.map(item => (
                  <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <span className="text-[9px] text-slate-450 font-mono">{item.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed select-text">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-indigo-600 font-bold text-white flex items-center justify-center text-xs shadow-inner">
            天
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight">天朗</span>
            <span className="text-[9px] text-slate-400">总调度长</span>
          </div>
        </div>
      </div>
    </header>
  );
}
