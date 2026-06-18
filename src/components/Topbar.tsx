import React, { useState } from 'react';
import { Bell, UserRound } from 'lucide-react';

interface TopbarProps {
  onDirectOrder: () => void;
}

export default function Topbar({ onDirectOrder }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  const modules = ['运单管理', '财务管理', '管理中心', '配置中心', '导出中心', '报表中心', '审批管理'];
  const notifications = [
    { id: 1, title: '运单清关预警', desc: '博宇家居运单 ANSU2026060107 清关文件已签回 POD', time: '刚刚' },
    { id: 2, title: '海关直查查验通知', desc: '罗湖海关一号查验室对运单 ANSU2026060108 正在开箱查验', time: '10分钟前' }
  ];

  return (
    <header className="h-[40px] shrink-0 bg-white border-b border-[#edf0f5] flex items-center justify-between px-4 select-none">
      <nav className="flex h-full items-center gap-8 overflow-x-auto scrollbar-none">
        {modules.map((module, index) => (
          <button
            key={module}
            className={`h-8 px-3 text-[13px] font-bold rounded-full transition-colors shrink-0 ${
              index === 0
                ? 'bg-[#1890ff] text-white shadow-sm'
                : 'text-[#111827] hover:text-[#1890ff]'
            }`}
          >
            {module}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDirectOrder}
          className="h-7 px-4 bg-[#1890ff] hover:bg-[#087fe7] text-white text-[12px] font-semibold rounded-[2px]"
        >
          直客录单
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-7 w-7 flex items-center justify-center text-[#36485c] hover:bg-[#f3f6fa] rounded"
            aria-label="查看通知"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-[#ff4d4f] px-1 text-[10px] font-bold leading-4 text-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-[4px] border border-[#dfe6ee] bg-white shadow-xl">
              <div className="h-10 px-3 border-b border-[#edf0f5] flex items-center justify-between bg-[#f8fafc]">
                <span className="text-[12px] font-bold text-[#263548]">通知中心</span>
                <button className="text-[11px] font-semibold text-[#1890ff]">标记全读</button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#edf0f5]">
                {notifications.map(item => (
                  <div key={item.id} className="p-3 hover:bg-[#f8fbff] text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#263548]">{item.title}</span>
                      <span className="text-[10px] text-[#8a96a6]">{item.time}</span>
                    </div>
                    <p className="mt-1 leading-5 text-[#5f6f82] select-text">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-7 w-7 rounded-full bg-[#6cc551] text-white flex items-center justify-center">
          <UserRound className="h-4 w-4" />
        </div>
        <span className="text-[12px] font-semibold text-[#263548]">天朗</span>
      </div>
    </header>
  );
}
