import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Sparkles, ChevronRight } from 'lucide-react';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{id: number, text: string, sender: 'user' | 'bot'}[]>([
    { id: 1, text: "Hi! I'm the UniResolve Assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    "Check Ticket Status",
    "How to raise an issue?",
    "Contact Admin",
    "Report Emergency"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const simulateBotResponse = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let response = "";
      const lowerText = userText.toLowerCase();

      if (lowerText.includes("status")) {
        response = "You can check the status of your issues in the 'My Issues' tab on the Dashboard or in your Profile.";
      } else if (lowerText.includes("raise") || lowerText.includes("create")) {
        response = "Click on 'Raise Issue' in the sidebar to report a new problem. Our AI will help categorize it automatically!";
      } else if (lowerText.includes("admin") || lowerText.includes("contact")) {
        response = "I've flagged this for an admin. They usually respond within 24 hours. For urgent matters, please call the helpdesk.";
      } else if (lowerText.includes("emergency")) {
        response = "For emergencies (Fire, Medical, Security), please call Campus Security immediately at 555-0199.";
      } else {
        const defaults = [
          "I understand. Could you provide more details?",
          "I'll make a note of that.",
          "Please check the notifications panel for updates.",
          "Is there anything else I can help with?"
        ];
        response = defaults[Math.floor(Math.random() * defaults.length)];
      }

      setMessages(prev => [...prev, { id: Date.now(), text: response, sender: 'bot' }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = (text: string = inputValue) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now(), text: text, sender: 'user' }]);
    setInputValue('');
    simulateBotResponse(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-white w-[350px] h-[500px] rounded-2xl shadow-2xl border border-slate-200 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full relative">
                    <Bot className="w-6 h-6 text-white" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
                </div>
                <div>
                    <h3 className="text-white font-bold text-base">Student Support</h3>
                    <p className="text-indigo-200 text-xs">Always here to help</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
            <div className="flex justify-center my-2">
                <span className="text-[10px] text-slate-400 font-medium bg-slate-200/50 px-2 py-1 rounded-full">Today</span>
            </div>
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-auto">
                        <Bot className="w-4 h-4 text-indigo-600" />
                    </div>
                )}
                <div className={`max-w-[80%] p-3.5 text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
                <div className="flex justify-start items-center space-x-1 pl-9">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
             {quickReplies.map((reply, idx) => (
                 <button 
                    key={idx}
                    onClick={() => handleSend(reply)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-medium rounded-full shadow-sm hover:bg-indigo-50 transition-colors"
                 >
                    {reply}
                 </button>
             ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2 bg-slate-100 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none text-sm focus:outline-none text-slate-700 placeholder:text-slate-400"
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim()}
                    className={`p-1.5 rounded-full transition-all ${
                        inputValue.trim() 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                >
                <Send className="w-4 h-4" />
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-slate-400 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 mr-1 text-indigo-400" /> Powered by EduSolve AI
                </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </div>
  );
};