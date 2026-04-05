import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle, Mail, FileText, Shield, Zap, X, Send, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

const FAQ_DATA = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I log in to the portal?",
        a: "You can log in using your university email address. Select your role (Student or Admin) on the login page. For demo purposes, use 'student@univ.edu' for students and 'admin@univ.edu' for administrators."
      },
      {
        q: "Can I use this portal on my mobile phone?",
        a: "Yes! EduSolve is fully responsive and works on smartphones, tablets, and desktop computers."
      }
    ]
  },
  {
    category: "Issue Reporting",
    items: [
      {
        q: "How do I raise a new issue?",
        a: "Click on the 'Raise Issue' tab in the sidebar. Fill in the title, description, and location. Our AI will automatically categorize it for you. You can then submit it."
      },
      {
        q: "Can I report an issue anonymously?",
        a: "Yes. When raising an issue, check the 'Submit Anonymously' box at the bottom of the form. Your name will be hidden from the public feed and staff."
      },
      {
        q: "What happens after I submit an issue?",
        a: "The issue status changes to 'Submitted'. An admin will review it and assign it to the relevant staff ('Assigned'). Once work begins, it moves to 'In Progress', and finally 'Resolved' when fixed."
      }
    ]
  },
  {
    category: "Points & Rewards",
    items: [
      {
        q: "What are Reputation Points?",
        a: "Reputation Points are part of our gamification system. You earn points for raising valid issues, receiving upvotes, and helping the community. High scores can earn you badges and campus recognition."
      },
      {
        q: "How do I earn badges?",
        a: "Badges are awarded for milestones like 'First Report', 'Top Voter', or maintaining a high reputation score throughout the semester."
      }
    ]
  },
  {
    category: "Technical Support",
    items: [
      {
        q: "The portal is not loading correctly.",
        a: "Please try clearing your browser cache or trying a different browser. If the problem persists, contact IT support via the details below."
      },
      {
        q: "My issue status hasn't changed in days.",
        a: "Check the estimated SLA (Service Level Agreement) for your issue category. If the time has passed, the issue is automatically flagged as 'Escalated' to the administration."
      }
    ]
  }
];

interface Props {
  userRole: UserRole;
}

export const HelpFAQ: React.FC<Props> = ({ userRole }) => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  
  // Support Form State
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const toggleAccordion = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    
    // Simulate API call
    setSupportSent(true);
    setTimeout(() => {
        setSupportSent(false);
        setShowSupportForm(false);
        setSupportMessage('');
    }, 2000);
  };

  const filteredData = FAQ_DATA.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.q.toLowerCase().includes(search.toLowerCase()) || 
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const isSearching = search.trim().length > 0;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">How can we help you?</h1>
        <p className="text-slate-500 mt-2 text-lg">Search for answers or browse common questions below.</p>
        
        <div className="max-w-xl mx-auto mt-6 relative group">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
                type="text" 
                placeholder="Search for help (e.g., 'anonymous', 'login', 'SLA')..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 border border-slate-200 rounded-full shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-base bg-white"
            />
            {search && (
                <button 
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2 space-y-8">
            {filteredData.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No results found for "{search}".</p>
                    <button 
                        onClick={() => setSearch('')}
                        className="mt-2 text-indigo-600 text-sm font-medium hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                filteredData.map((category, catIdx) => (
                    <div key={catIdx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                {category.category === "Getting Started" && <Zap className="w-4 h-4 mr-2 text-yellow-500" />}
                                {category.category === "Issue Reporting" && <FileText className="w-4 h-4 mr-2 text-blue-500" />}
                                {category.category === "Points & Rewards" && <Shield className="w-4 h-4 mr-2 text-purple-500" />}
                                {category.category === "Technical Support" && <MessageCircle className="w-4 h-4 mr-2 text-green-500" />}
                                {category.category}
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {category.items.map((item, itemIdx) => {
                                const uniqueId = `${catIdx}-${itemIdx}`;
                                // Automatically expand items if searching, otherwise use manual toggle
                                const isOpen = isSearching || openIndex === uniqueId;
                                
                                return (
                                    <div key={itemIdx} className="group">
                                        <button 
                                            onClick={() => toggleAccordion(uniqueId)}
                                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors focus:outline-none"
                                        >
                                            <span className={`font-medium text-sm ${isOpen ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                {item.q}
                                            </span>
                                            {isOpen ? (
                                                <ChevronUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                                            )}
                                        </button>
                                        {isOpen && (
                                            <div className="px-6 pb-5 pt-0 text-slate-600 text-sm leading-relaxed animate-in slide-in-from-top-1 duration-200 border-t border-transparent">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Contact/Support Sidebar */}
        <div className="space-y-6">
            {userRole === UserRole.STUDENT && (
                <div className={`bg-indigo-600 text-white rounded-2xl p-6 shadow-lg shadow-indigo-200 transition-all duration-300 ${showSupportForm ? 'bg-indigo-700' : ''}`}>
                    <h3 className="font-bold text-lg mb-2">Still need help?</h3>
                    <p className="text-indigo-100 text-sm mb-6">Can't find the answer you're looking for? Our support team is here to assist.</p>
                    
                    {supportSent ? (
                        <div className="bg-white/10 rounded-lg p-4 text-center animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <p className="font-bold text-white">Message Sent!</p>
                            <p className="text-xs text-indigo-100 mt-1">We'll get back to you shortly.</p>
                        </div>
                    ) : showSupportForm ? (
                        <form onSubmit={handleSupportSubmit} className="space-y-3 animate-in slide-in-from-bottom-2">
                            <textarea
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Describe your issue..."
                                className="w-full px-3 py-2 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[80px]"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowSupportForm(false)}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-white text-indigo-600 hover:bg-indigo-50 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                                >
                                    <Send className="w-3 h-3 mr-1.5" />
                                    Send
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button 
                            onClick={() => setShowSupportForm(true)}
                            className="w-full bg-white text-indigo-600 font-semibold py-2.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center text-sm"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Support
                        </button>
                    )}
                </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Emergency Contacts</h3>
                <ul className="space-y-4">
                    <li className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-red-600 uppercase">Campus Security</span>
                            <span className="text-sm font-semibold text-slate-800">555-0199</span>
                        </div>
                        <Shield className="w-5 h-5 text-red-500" />
                    </li>
                    <li className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-blue-600 uppercase">Medical Center</span>
                            <span className="text-sm font-semibold text-slate-800">555-0198</span>
                        </div>
                        <Shield className="w-5 h-5 text-blue-500" />
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};