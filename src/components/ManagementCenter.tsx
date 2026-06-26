import React, { useMemo, useState } from 'react';
import { Search, Settings, Plus } from 'lucide-react';
import { User } from '../types';

interface ManagementCenterProps {
  users: User[];
  onAddUser: () => void;
  onUsersChange: (users: User[]) => void;
}

const branches = ['深圳安速', '广州安速', '义乌安速', '东莞安速', '厦门安速', '上海安速', '中山安速', '武汉安速', '番禺安速', '福州安速'];

export const DEFAULT_MANAGEMENT_USERS: User[] = [
  { id: 'u-1', username: '安怡', name: '安怡', department: '客服专员', role: '业务专员', phone: '18682138774', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-2', username: '安市', name: '安市', department: '义乌业务专员', role: '业务专员', phone: '18680672374', position: '业务专员', warehouse: ['义乌安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-3', username: '天波', name: '天波', department: 'IT部', role: '超级管理员', phone: '123456', position: '管理员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-4', username: '天行', name: '邵义', department: '深圳安速', role: '超级管理员', phone: '12312312311', position: '管理员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-5', username: '天悦', name: '天悦', department: '福州安速,晋具安速,武汉安速,中山安...', role: '超级管理员', phone: '1298941283412', position: '管理员', warehouse: ['福州安速', '武汉安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-6', username: '天仁', name: '伍熊彪', department: '仓库专员', role: '仓库', phone: '13249858824', position: '仓库专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-7', username: '安迪', name: '陈子颖', department: '义乌业务专员', role: '业务专员', phone: '18520830346', position: '业务专员', warehouse: ['义乌安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-8', username: '安曲', name: '黄泽涛', department: '精英一部专员', role: '业务专员', phone: '18529538639', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-9', username: '安冷', name: '张铭枫', department: '精英二部专员', role: '业务专员', phone: '18576475690', position: '业务专员', warehouse: ['广州安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-10', username: '安雪', name: '许伟强', department: '精英二部专员', role: '业务专员', phone: '18565628523', position: '业务专员', warehouse: ['广州安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-11', username: '安耀', name: '雷竹倩', department: '精英二部专员', role: '业务专员', phone: '18589056970', position: '业务专员', warehouse: ['广州安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-12', username: '安麦', name: '温伟芳', department: '广州业务专员', role: '业务专员', phone: '13071325832', position: '业务专员', warehouse: ['广州安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-13', username: '安丹', name: '安丹', department: '广州业务专员', role: '业务专员', phone: '13238377841', position: '业务专员', warehouse: ['广州安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-14', username: '天未', name: '天未', department: '广州安速,义乌安速,东莞安速,厦门安...', role: '超级管理员', phone: '18565673150', position: '管理员', warehouse: ['广州安速', '义乌安速', '东莞安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-15', username: '安建', name: '贾龙', department: '精英一部专员', role: '业务专员', phone: '18664970945', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-16', username: '安威', name: '陈浩远', department: '精英三部专员', role: '业务专员', phone: '18681469082', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-17', username: '安左', name: '王喻', department: '精英一部专员', role: '业务专员', phone: '13043493006', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-18', username: '安垒', name: '包军磊', department: '精英二部专员', role: '业务专员', phone: '13068722029', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-19', username: '安谋', name: '胡纬鑫', department: '储备销售管理部', role: '业务专员', phone: '18594283212', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-20', username: '安绍', name: '侯明辉', department: '睿拓一部专员', role: '业务专员', phone: '18565803189', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' },
  { id: 'u-21', username: '安纵', name: '蒋子爽', department: '销售三部专员', role: '业务专员', phone: '18676718430', position: '业务专员', warehouse: ['深圳安速'], wechatId: '', linkedPerson: '', createTime: '2026-06-01' }
];

export default function ManagementCenter({ users, onAddUser, onUsersChange }: ManagementCenterProps) {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [disabledIds, setDisabledIds] = useState<Set<string>>(() => new Set(['u-5', 'u-8', 'u-17', 'u-18']));

  const filteredUsers = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return users.filter(user => {
      const status = disabledIds.has(user.id) ? '停用' : '启用';
      const searchText = `${user.username} ${user.name} ${user.department} ${user.phone}`.toLowerCase();
      return (!kw || searchText.includes(kw)) && (!roleFilter || user.role === roleFilter) && (!statusFilter || status === statusFilter);
    });
  }, [users, keyword, roleFilter, statusFilter, disabledIds]);

  const resetFilters = () => {
    setKeyword('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const toggleUserStatus = (target: User) => {
    setDisabledIds(prev => {
      const next = new Set(prev);
      if (next.has(target.id)) next.delete(target.id);
      else next.add(target.id);
      return next;
    });
  };

  const deleteUser = (target: User) => {
    const updated = users.filter(user => user.id !== target.id);
    onUsersChange(updated);
  };

  return (
    <div className="grid h-full min-h-[680px] gap-4" style={{ gridTemplateColumns: '240px minmax(0, 1fr)' }}>
      <aside className="bg-white border border-slate-200 rounded shadow-sm p-3 overflow-hidden">
        <div className="flex h-9 mb-3">
          <input className="min-w-0 flex-1 border border-slate-200 rounded-l px-3 text-xs outline-none focus:border-[#5c67f2]" placeholder="请输入关键字" />
          <button className="w-10 border border-l-0 border-slate-200 rounded-r text-slate-400 hover:text-[#5c67f2]" type="button" aria-label="搜索组织">
            <Search className="w-4 h-4 mx-auto" />
          </button>
        </div>
        <div className="space-y-1">
          {branches.map(branch => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`w-full h-8 grid items-center text-left text-xs rounded transition-colors ${
                selectedBranch === branch ? 'bg-indigo-50 text-[#5c67f2] font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-[#5c67f2]'
              }`}
              style={{ gridTemplateColumns: '18px 1fr 20px' }}
              type="button"
            >
              <span className="text-[10px]">▸</span>
              <span>{branch}</span>
              <span className="text-blue-400">✎</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0 grid gap-4" style={{ gridTemplateRows: 'auto minmax(0, 1fr)' }}>
        <section className="bg-white border border-slate-200 rounded shadow-sm p-4">
          <form className="grid items-center gap-x-8 gap-y-3" style={{ gridTemplateColumns: 'repeat(3, minmax(220px, 1fr)) auto' }} onSubmit={event => event.preventDefault()}>
            <label className="grid items-center gap-3 text-xs text-slate-700" style={{ gridTemplateColumns: '58px minmax(0, 1fr)' }}>
              <span>用户名</span>
              <input value={keyword} onChange={event => setKeyword(event.target.value)} className="h-9 border border-slate-200 rounded px-3 outline-none focus:border-[#5c67f2]" placeholder="用户名" />
            </label>
            <label className="grid items-center gap-3 text-xs text-slate-700" style={{ gridTemplateColumns: '58px minmax(0, 1fr)' }}>
              <span>角色</span>
              <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="h-9 border border-slate-200 rounded px-3 outline-none focus:border-[#5c67f2]">
                <option value="">角色</option>
                <option>超级管理员</option>
                <option>业务专员</option>
                <option>仓库</option>
                <option>客服专员</option>
              </select>
            </label>
            <label className="grid items-center gap-3 text-xs text-slate-700" style={{ gridTemplateColumns: '58px minmax(0, 1fr)' }}>
              <span>状态</span>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-9 border border-slate-200 rounded px-3 outline-none focus:border-[#5c67f2]">
                <option value="">状态</option>
                <option>启用</option>
                <option>停用</option>
              </select>
            </label>
            <div className="flex gap-3">
              <button className="h-9 px-5 rounded bg-[#5c67f2] hover:bg-[#4a55e0] text-white text-xs font-bold" type="submit">搜索</button>
              <button onClick={resetFilters} className="h-9 px-5 rounded border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50" type="button">重置</button>
            </div>
          </form>
        </section>

        <section className="bg-white border border-slate-200 rounded shadow-sm p-3 min-w-0 overflow-hidden">
          <div className="h-10 flex justify-between items-start">
            <div className="flex gap-2">
              <button onClick={onAddUser} className="h-8 px-4 rounded bg-[#5c67f2] hover:bg-[#4a55e0] text-white text-xs font-bold flex items-center gap-1.5" type="button">
                <Plus className="w-3.5 h-3.5" /> 新增用户
              </button>
              <button className="h-8 px-4 rounded border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50" type="button">批量导入</button>
              <button className="h-8 px-4 rounded border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50" type="button">批量修改部门</button>
            </div>
            <button className="w-8 h-8 rounded bg-[#5c67f2] text-white grid place-items-center" type="button" aria-label="表格设置">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="border border-slate-200 overflow-auto" style={{ height: 'calc(100vh - 292px)' }}>
            <table className="w-full min-w-[1320px] table-fixed border-collapse text-xs text-slate-600">
              <thead className="sticky top-0 z-30 bg-[#f8fafc] text-slate-600 font-bold">
                <tr>
                  {['#', '', '用户名', '姓名', '部门', '角色', '手机号', '状态', '操作'].map((head, index) => (
                    <th key={head || 'check'} className={`h-9 border-r border-b border-slate-200 text-center ${index < 2 ? 'w-12' : ''}`}>
                      {index === 1 ? <input type="checkbox" aria-label="全选用户" /> : head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const status = disabledIds.has(user.id) ? '停用' : '启用';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="h-9 border-r border-b border-slate-200 text-center">{index + 1}</td>
                      <td className="h-9 border-r border-b border-slate-200 text-center"><input type="checkbox" /></td>
                      <td className="h-9 border-r border-b border-slate-200 text-center truncate px-2" title={user.username}>{user.username}</td>
                      <td className="h-9 border-r border-b border-slate-200 text-center truncate px-2" title={user.name}>{user.name}</td>
                      <td className="h-9 border-r border-b border-slate-200 text-center truncate px-2" title={user.department}>{user.department}</td>
                      <td className="h-9 border-r border-b border-slate-200 text-center truncate px-2">{user.role}</td>
                      <td className="h-9 border-r border-b border-slate-200 text-center truncate px-2">{user.phone}</td>
                      <td className="h-9 border-r border-b border-slate-200 text-center">
                        <span className={`inline-flex h-6 min-w-10 px-2 items-center justify-center rounded-sm text-white ${status === '启用' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="h-9 border-b border-slate-200 text-center whitespace-nowrap">
                        <button onClick={() => toggleUserStatus(user)} className={`${status === '启用' ? 'text-red-500' : 'text-blue-500'} px-1`} type="button">{status === '启用' ? '停用' : '启用'}</button>
                        <button className="text-blue-500 px-1" type="button">编辑</button>
                        <button onClick={() => deleteUser(user)} className="text-red-500 px-1" type="button">删除</button>
                        <button className="text-blue-500 px-1" type="button">重置密码</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="h-10 flex items-center justify-end gap-2 text-xs text-slate-600">
            <span>共 {filteredUsers.length} 条</span>
            <button className="px-2 h-7" type="button">‹</button>
            <button className="min-w-7 h-7 border border-[#5c67f2] rounded text-[#5c67f2]" type="button">1</button>
            <button className="min-w-7 h-7" type="button">2</button>
            <button className="min-w-7 h-7" type="button">3</button>
            <button className="min-w-7 h-7" type="button">4</button>
            <span>›</span>
            <select className="h-7 border border-slate-200 rounded px-2"><option>100 条/页</option></select>
            <label className="flex items-center gap-1">跳至<input className="w-12 h-7 border border-slate-200 rounded text-center" />页</label>
          </div>
        </section>
      </main>
    </div>
  );
}
