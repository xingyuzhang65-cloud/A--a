import React, { useState, useRef, useEffect } from 'react';
import { Waybill } from '../types';
import { MessageSquare, X, Send, Bot, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssistantBotProps {
  currentWaybills: Waybill[];
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export default function AssistantBot({ currentWaybills }: AssistantBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '您好！我是安速货运智能 AI 助理。我可以帮您快速统计、分析和检索当前列表中所有的业务运单。您可以问我：\n\n- *"哪些运单目前是异常扣货状态？"*\n- *"帮我汇总飞洋电商所有运单的申报总价值"*\n- *"目的地属于 ONT8 的货物最晚什么时候到？"*\n- *"进行一个简要的渠道运载统计报告"',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsgText = inputValue;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMsgText,
          waybills: currentWaybills
        })
      });

      if (!response.ok) {
        throw new Error('抱歉，服务器响应异常。');
      }

      const data = await response.json();
      const botMsg: Message = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || '未收到有效答复。',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        sender: 'bot',
        text: '❌ 连接 AI 助理超时。请检查密钥配置或重试。提示：需确保系统设置中配置了 `GEMINI_API_KEY`。',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, shadow: '0px 0px 0px rgba(0,0,0,0)' }}
            animate={{ scale: 1, shadow: '0px 10px 25px rgba(92,103,242,0.3)' }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-[#5c67f2] hover:bg-[#4a55e0] active:bg-[#3f4bd0] text-white flex items-center justify-center focus:outline-none transition-all relative group cursor-pointer"
            title="联系智能客服助理"
          >
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border border-white flex items-center justify-center text-[8px] font-bold">1</div>
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute right-16 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
              安速 AI 助理上线中
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[500px]"
          >
            {/* Header */}
            <div className="bg-[#1c2438] text-white px-4 py-3 flex items-center justify-between border-b border-[#2d3a5a]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#5c67f2] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1">
                    安速 AI 货运管家
                    <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </h4>
                  <span className="text-[9px] text-slate-400">Gemini 3.5-Flash 端到端智能</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[250px] max-h-[350px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-5 shadow-xs whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-[#5c67f2] text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                    <div className={`text-[8px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-700 border border-slate-200 rounded-lg rounded-tl-none p-3 shadow-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5c67f2] font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      安速 AI 正在解析运单并推理中...
                    </div>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#5c67f2] animate-[loading_1s_infinite] w-full" style={{ transformOrigin: 'left' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-150 flex items-center gap-2">
              <input
                type="text"
                placeholder="在此输入您的运输管理问题..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 focus:border-[#5c67f2] rounded focus:outline-none placeholder:text-slate-400 bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-8 h-8 rounded bg-[#5c67f2] hover:bg-[#4a55e0] text-white flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:bg-slate-300"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
