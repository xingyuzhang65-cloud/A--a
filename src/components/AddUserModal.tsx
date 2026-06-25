import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MultiSelect from './MultiSelect';

const WAREHOUSE_OPTIONS = [
  'SZ01 - 深圳福永仓', 'SZ02 - 深圳坂田仓', 'SZ03 - 深圳龙华仓', 'SZ04 - 深圳平湖仓', 'SZ05 - 深圳盐田仓',
  'GZ01 - 广州白云仓', 'GZ02 - 广州番禺仓', 'GZ03 - 广州花都仓',
  'DG01 - 东莞虎门仓', 'DG02 - 东莞长安仓',
  'FS01 - 佛山顺德仓', 'FS02 - 佛山南海仓',
  'ZH01 - 珠海横琴仓', 'HZ01 - 惠州惠阳仓',
  'SH01 - 上海浦东仓', 'SH02 - 上海青浦仓', 'SH03 - 上海松江仓',
  'NB01 - 宁波北仑仓', 'NB02 - 宁波鄞州仓',
  'YW01 - 义乌仓', 'HZ02 - 杭州萧山仓',
  'TJ01 - 天津滨海仓', 'QD01 - 青岛黄岛仓',
  'XM01 - 厦门海沧仓', 'FZ01 - 福州仓',
  'WH01 - 武汉仓', 'CD01 - 成都仓', 'CQ01 - 重庆仓',
  'ZZ01 - 郑州仓', 'XA01 - 西安仓'
];

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

const initialFormData = () => ({
  username: '',
  name: '',
  phone: '',
  department: '',
  role: '',
  position: '',
  wechatId: '',
  linkedPerson: ''
});

export default function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  const [formData, setFormData] = useState(initialFormData());
  const [warehouse, setWarehouse] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData());
      setWarehouse([]);
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = '请输入用户名';
    if (!formData.name.trim()) newErrors.name = '请输入姓名';
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = '请输入正确的手机号格式';
    }
    if (!formData.department.trim()) newErrors.department = '请选择部门';
    if (!formData.role.trim()) newErrors.role = '请选择角色';
    if (!formData.position.trim()) newErrors.position = '请选择岗位';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...formData,
      warehouse,
      createTime: new Date().toISOString().split('T')[0]
    };
    onSave(newUser);
    onClose();
  };

  const handleCancel = () => {
    setFormData(initialFormData());
    setWarehouse([]);
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white rounded-lg shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">新增用户</h3>
              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="px-8 py-6 space-y-4 overflow-y-auto">
              {/* 1. 用户名 * */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">
                  <span className="text-red-500 mr-0.5">*</span>用户名
                </label>
                <div className="flex-1">
                  <input type="text" name="username" value={formData.username} onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs border rounded focus:outline-none focus:border-[#5c67f2] transition-colors ${errors.username ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    placeholder="请输入" />
                  {errors.username && <p className="text-[10px] text-red-500 mt-0.5">{errors.username}</p>}
                </div>
              </div>

              {/* 2. 姓名 * */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">
                  <span className="text-red-500 mr-0.5">*</span>姓名
                </label>
                <div className="flex-1">
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs border rounded focus:outline-none focus:border-[#5c67f2] transition-colors ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    placeholder="请输入" />
                  {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
                </div>
              </div>

              {/* 3. 手机号 * */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">
                  <span className="text-red-500 mr-0.5">*</span>手机号
                </label>
                <div className="flex-1">
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs border rounded focus:outline-none focus:border-[#5c67f2] transition-colors ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    placeholder="请输入" maxLength={11} />
                  {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
                </div>
              </div>

              {/* 4. 部门 * */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">
                  <span className="text-red-500 mr-0.5">*</span>部门
                </label>
                <div className="flex-1">
                  <select name="department" value={formData.department} onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs border rounded focus:outline-none focus:border-[#5c67f2] transition-colors appearance-none bg-white ${errors.department ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
                    <option value="">请选择</option>
                    <option value="调度中心">调度中心</option>
                    <option value="操作部">操作部</option>
                    <option value="业务部">业务部</option>
                    <option value="客服部">客服部</option>
                    <option value="财务部">财务部</option>
                    <option value="仓储部">仓储部</option>
                    <option value="技术部">技术部</option>
                    <option value="行政部">行政部</option>
                  </select>
                  {errors.department && <p className="text-[10px] text-red-500 mt-0.5">{errors.department}</p>}
                </div>
              </div>

              {/* 5. 角色 * */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">
                  <span className="text-red-500 mr-0.5">*</span>角色
                </label>
                <div className="flex-1">
                  <select name="role" value={formData.role} onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs border rounded focus:outline-none focus:border-[#5c67f2] transition-colors appearance-none bg-white ${errors.role ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
                    <option value="">请输入</option>
                    <option value="总调度长">总调度长</option>
                    <option value="调度员">调度员</option>
                    <option value="跟单员">跟单员</option>
                    <option value="业务员">业务员</option>
                    <option value="专属客服">专属客服</option>
                    <option value="财务主管">财务主管</option>
                    <option value="仓管员">仓管员</option>
                    <option value="系统管理员">系统管理员</option>
                    <option value="普通用户">普通用户</option>
                  </select>
                  {errors.role && <p className="text-[10px] text-red-500 mt-0.5">{errors.role}</p>}
                </div>
              </div>

              {/* 6. 岗位 * */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">
                  <span className="text-red-500 mr-0.5">*</span>岗位
                </label>
                <div className="flex-1">
                  <select name="position" value={formData.position} onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs border rounded focus:outline-none focus:border-[#5c67f2] transition-colors appearance-none bg-white ${errors.position ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
                    <option value="">请输入</option>
                    <option value="高级主管">高级主管</option>
                    <option value="客户经理">客户经理</option>
                    <option value="高级跟单">高级跟单</option>
                    <option value="客服专员">客服专员</option>
                    <option value="财务专员">财务专员</option>
                    <option value="仓库管理员">仓库管理员</option>
                    <option value="技术人员">技术人员</option>
                    <option value="行政专员">行政专员</option>
                  </select>
                  {errors.position && <p className="text-[10px] text-red-500 mt-0.5">{errors.position}</p>}
                </div>
              </div>

              {/* 7. 仓库 */}
              <div className="flex items-start gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0 pt-2">仓库</label>
                <div className="flex-1">
                  <MultiSelect
                    name="warehouse"
                    options={WAREHOUSE_OPTIONS}
                    selected={warehouse}
                    onChange={setWarehouse}
                    placeholder="请输入"
                  />
                </div>
              </div>

              {/* 8. 企业微信号 */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">企业微信号</label>
                <div className="flex-1">
                  <input type="text" name="wechatId" value={formData.wechatId} onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#5c67f2] transition-colors"
                    placeholder="请输入" />
                </div>
              </div>

              {/* 9. 关联人员 */}
              <div className="flex items-center gap-3">
                <label className="w-24 text-right text-xs text-slate-500 font-semibold shrink-0">关联人员</label>
                <div className="flex-1">
                  <input type="text" name="linkedPerson" value={formData.linkedPerson} onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#5c67f2] transition-colors"
                    placeholder="请输入" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="h-16 border-t border-slate-100 px-6 flex items-center justify-end gap-3 shrink-0 bg-slate-50 rounded-b-lg">
              <button type="button" onClick={handleCancel}
                className="px-6 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-xs text-slate-600 transition-all font-medium cursor-pointer">
                取消
              </button>
              <button type="button" onClick={handleSubmit}
                className="px-6 py-2 bg-[#5c67f2] hover:bg-[#4a55e0] active:bg-[#3f4bd0] text-white rounded text-xs font-medium transition-all shadow-sm cursor-pointer">
                确定
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
