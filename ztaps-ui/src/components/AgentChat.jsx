import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualKeyboard from './VirtualKeyboard';

const AgentChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'agent', text: "Hello! I am your AI Purchasing Assistant. What would you like to buy today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeScreen, setActiveScreen] = useState('chat'); // 'home', 'chat', 'payment', 'settings'
  const [notification, setNotification] = useState({ visible: false, payload: null });
  const [pendingPayment, setPendingPayment] = useState(null);

  const [settingsConfig, setSettingsConfig] = useState({
    hardwarePrice: 15000,       // $150.00
    softwarePrice: 8500000,     // $85,000.00
    approvalLimit: 500000,       // $5,000.00
    categories: [
      { name: 'hardware', min: 0, max: 200000, keywords: 'laptop, macbook, hardware' },
      { name: 'software', min: 0, max: 50000000, keywords: 'software, license, app' } // $500,000 max
    ]
  });

  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeScreen === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, isKeyboardVisible, activeScreen]);

  const parseIntent = (text) => {
    const lower = text.toLowerCase();
    let payload = {
      agent_id: 'agent_001',
      item_id: 'ITEM_UNKNOWN',
      quantity: 1,
      item_category: 'general',
      amount: 0,
      justification: text
    };

    let matchedCategory = null;
    for (const cat of settingsConfig.categories) {
       const keywords = (cat.keywords || cat.name).toLowerCase().split(',').map(k => k.trim());
       if (keywords.some(kw => lower.includes(kw))) {
           matchedCategory = cat;
           break;
       }
    }

    if (matchedCategory) {
        payload.item_category = matchedCategory.name;
        payload.item_id = 'ITEM_STD_001';
        if (matchedCategory.name === 'hardware') payload.amount = parseInt(settingsConfig.hardwarePrice, 10);
        else if (matchedCategory.name === 'software') payload.amount = parseInt(settingsConfig.softwarePrice, 10);
        else payload.amount = matchedCategory.min + 1000; 
    } else {
        payload.item_category = 'general';
        payload.item_id = 'ITEM_STD_001';
        payload.amount = parseInt(settingsConfig.hardwarePrice, 10);
    }

    let extractedQty = 1;
    const qtyMatch = text.match(/(?:buy|purchase|get)\s+(\d+)/i);
    if (qtyMatch) {
        extractedQty = parseInt(qtyMatch[1], 10);
    }

    let extractedAmount = null;
    const priceMatch = text.match(/(?:worth|for|costing|paise|\$|rs\.?|inr|price|amount)\s*([\d,]+)/i);
    if (priceMatch) {
        extractedAmount = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    } else {
        const numbers = text.match(/\b[\d,]+\b/g);
        if (numbers) {
            if (numbers.length >= 2) {
                if (qtyMatch && numbers[0].replace(/,/g, '') === qtyMatch[1]) {
                    extractedAmount = parseInt(numbers[1].replace(/,/g, ''), 10);
                } else {
                    extractedQty = parseInt(numbers[0].replace(/,/g, ''), 10);
                    extractedAmount = parseInt(numbers[1].replace(/,/g, ''), 10);
                }
            } else if (numbers.length === 1) {
                if (!qtyMatch || numbers[0].replace(/,/g, '') !== qtyMatch[1]) {
                    extractedAmount = parseInt(numbers[0].replace(/,/g, ''), 10);
                }
            }
        }
    }

    payload.quantity = extractedQty;
    if (extractedAmount !== null) {
        payload.amount = extractedAmount * 100;
    } else {
        payload.amount = payload.amount * payload.quantity;
    }

    if (payload.amount === 0) payload.amount = 10000;

    return payload;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const payload = parseIntent(userText);
      
      setTimeout(async () => {
        setMessages(prev => [...prev, { 
            id: Date.now(), 
            role: 'agent', 
            text: `Got it. I'm preparing a transaction for ${payload.quantity}x ${payload.item_category} (Total: $${(payload.amount / 100).toLocaleString()}). Sending to Z-TAPS for authorization...` 
        }]);
        
        try {
          const response = await axios.post('/api/v1/agent/intercept', payload, {
            headers: { 'X-API-Key': 'dummy_api_key_for_testing' }
          });
          
          const { data } = response;
          
          setTimeout(() => {
            setIsTyping(false);
            if (data.status === 'rejected' || data.status === 'error') {
              setMessages(prev => [...prev, { 
                id: Date.now(), 
                role: 'system', 
                text: `❌ Z-TAPS BLOCKED: ${data.reason}` 
              }]);
            } else if (data.status === 'escalated') {
              setMessages(prev => [...prev, { 
                id: Date.now(), 
                role: 'system', 
                text: `⚠️ Z-TAPS ESCALATED: ${data.reason}` 
              }]);
              // Trigger push notification
              setNotification({ visible: true, payload: { amount: payload.amount, reason: data.reason, qty: payload.quantity, cat: payload.item_category, transaction_id: data.transaction_id } });
              setPendingPayment({ amount: payload.amount, reason: data.reason, qty: payload.quantity, cat: payload.item_category, transaction_id: data.transaction_id });
              
              // Auto-hide notification after 6 seconds if not clicked
              setTimeout(() => {
                setNotification(prev => ({ ...prev, visible: false }));
              }, 6000);
            } else {
              setMessages(prev => [...prev, { 
                id: Date.now(), 
                role: 'system', 
                text: `✅ Z-TAPS APPROVED: Transaction successful.` 
              }]);
            }
          }, 1500);

        } catch (error) {
          setIsTyping(false);
          setMessages(prev => [...prev, { id: Date.now(), role: 'system', text: "❌ SYSTEM ERROR: Failed to reach Z-TAPS engine." }]);
        }
      }, 1000);

    } catch (error) {
        setIsTyping(false);
    }
  };

  const handleVirtualKeyPress = (keyChar) => {
    if (keyChar === 'Backspace') {
      setInput(prev => prev.slice(0, -1));
    } else if (keyChar === 'Enter') {
      handleSend();
    } else if (keyChar === 'Space') {
      setInput(prev => prev + ' ');
    } else if (keyChar !== 'Shift' && keyChar !== '?123') {
      setInput(prev => prev + keyChar);
    }
  };

  const approvePayment = async () => {
    try {
      if (pendingPayment?.transaction_id) {
        await axios.post('/api/v1/agent/action', {
          transaction_id: pendingPayment.transaction_id,
          action: 'APPROVED_ORDER'
        }, { headers: { 'X-API-Key': 'dummy_api_key_for_testing' } });
      }
    } catch (e) {
      console.error('Failed to update transaction', e);
    }
    
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      role: 'system', 
      text: `✅ USER APPROVED: Authorized $${(pendingPayment.amount / 100).toLocaleString()} via Device MFA.` 
    }]);
    setPendingPayment(null);
    setActiveScreen('chat');
  };

  const rejectPayment = async () => {
    try {
      if (pendingPayment?.transaction_id) {
        await axios.post('/api/v1/agent/action', {
          transaction_id: pendingPayment.transaction_id,
          action: 'REJECTED'
        }, { headers: { 'X-API-Key': 'dummy_api_key_for_testing' } });
      }
    } catch (e) {
      console.error('Failed to update transaction', e);
    }
    
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      role: 'system', 
      text: `❌ USER REJECTED: Payment cancelled by device owner.` 
    }]);
    setPendingPayment(null);
    setActiveScreen('chat');
  };

  const renderHomeScreen = () => (
    <div className="flex-1 w-full flex flex-col p-6 gap-6 pt-16 bg-[var(--bg-primary)]" style={{ backgroundImage: 'radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)', opacity: 0.9 }}>
       <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setActiveScreen('chat')}>
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 shadow-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
             </div>
             <span className="text-[10px] text-white font-medium drop-shadow-md">ZTaps</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setActiveScreen('settings')}>
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gray-700 to-gray-600 shadow-lg flex items-center justify-center text-gray-300 group-hover:scale-105 transition-transform">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             </div>
             <span className="text-[10px] text-white font-medium drop-shadow-md">Settings</span>
          </div>
       </div>
    </div>
  );

  const renderPaymentScreen = () => (
    <div className="flex-1 w-full bg-[var(--bg-primary)] p-6 pt-16 flex flex-col items-center">
       <div className="w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
       </div>
       <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Z-TAPS Authorization</h2>
       <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
         An agent is requesting a high-value transaction that exceeds the auto-approval threshold.
       </p>
       
       {pendingPayment && (
         <div className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-5 mb-8 shadow-inner">
           <div className="flex justify-between mb-3 text-sm">
             <span className="text-[var(--text-secondary)]">Amount</span>
             <span className="font-bold text-[var(--text-primary)]">${(pendingPayment.amount / 100).toLocaleString()}</span>
           </div>
           <div className="flex justify-between mb-3 text-sm">
             <span className="text-[var(--text-secondary)]">Category</span>
             <span className="font-medium text-[var(--text-primary)] capitalize">{pendingPayment.cat}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span className="text-[var(--text-secondary)]">Quantity</span>
             <span className="font-medium text-[var(--text-primary)]">{pendingPayment.qty}</span>
           </div>
         </div>
       )}

       <div className="w-full flex flex-col gap-3 mt-auto mb-8">
          <button onClick={approvePayment} className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform">
            Approve Payment
          </button>
          <button onClick={rejectPayment} className="w-full py-4 rounded-xl font-bold bg-[var(--bg-secondary)] text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
            Reject
          </button>
       </div>
    </div>
  );

  const renderChatScreen = () => (
    <>
      {/* App Header (Fake) */}
      <div className="w-full pt-10 pb-3 px-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] flex items-center justify-between z-20">
         <div className="font-bold text-[var(--text-primary)]">ZTaps</div>
         <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
         </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-4">
        {messages.map(msg => {
          const isEscalated = msg.text.includes('ESCALATED');
          const isApproved = msg.text.includes('APPROVED');
          const isRejected = msg.text.includes('REJECTED') || msg.text.includes('BLOCKED');
          
          let msgClass = '';
          if (msg.role === 'user') {
            msgClass = 'bg-[var(--color-primary)] text-white rounded-br-none font-medium text-[14px]';
          } else if (msg.role === 'system') {
            if (isEscalated) {
              msgClass = 'bg-yellow-500/10 text-yellow-500 font-mono text-xs w-full border-l-4 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
            } else if (isApproved) {
              msgClass = 'bg-emerald-500/10 text-emerald-500 font-mono text-xs w-full border-l-4 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            } else if (isRejected) {
              msgClass = 'bg-red-500/10 text-red-500 font-mono text-xs w-full border-l-4 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
            } else {
              msgClass = 'bg-[var(--color-secondary)] text-[var(--text-primary)] font-mono text-xs w-full border-l-4 border-[var(--color-primary)]';
            }
          } else {
            msgClass = 'bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-bl-none text-[14px]';
          }

          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msgClass}`}>
                {msg.text}
              </div>
            </motion.div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
             <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-bl-none flex gap-1.5 items-center shadow-sm">
                <div className="w-1.5 h-1.5 bg-[var(--color-tertiary)] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[var(--color-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-[var(--color-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[var(--bg-primary)] border-t border-[var(--glass-border)] z-20">
        <form onSubmit={handleSend} className="p-3 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsKeyboardVisible(true)}
            onBlur={() => setTimeout(() => setIsKeyboardVisible(false), 200)}
            placeholder="Message Agent..."
            className="flex-1 max-h-24 min-h-[44px] py-3 px-4 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-3xl text-[var(--text-primary)] text-[15px] focus:outline-none resize-none shadow-inner leading-tight"
            disabled={isTyping}
            rows={1}
          />
          <button 
            type="submit"
            disabled={isTyping || !input.trim()}
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center btn-primary rounded-full shadow-md disabled:opacity-50"
          >
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>

        {/* Virtual Keyboard Section */}
        <motion.div
          initial={false}
          animate={{ height: isKeyboardVisible ? 'auto' : 0, opacity: isKeyboardVisible ? 1 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="overflow-hidden bg-[var(--bg-primary)]"
        >
          <VirtualKeyboard onKeyPress={handleVirtualKeyPress} />
        </motion.div>
      </div>
    </>
  );

  return (
    <div className="w-full flex justify-center py-12">
      {/* Skeuomorphic Phone Outer Casing (Polished Metal Finish) */}
      <div className="relative w-[400px] h-[800px] bg-gradient-to-br from-gray-400 via-gray-100 to-gray-500 dark:from-gray-600 dark:via-gray-400 dark:to-gray-800 rounded-[3.5rem] p-[10px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7),inset_0_0_0_2px_rgba(255,255,255,0.6),inset_0_0_8px_rgba(0,0,0,0.2)] border border-gray-300 dark:border-gray-700 z-10">
        
        {/* Diagram Marker for Buttons */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute top-[100px] left-[-260px] w-[240px] h-[100px] pointer-events-none z-50 hidden md:block"
        >
           <svg width="240" height="100" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 right-0">
              <circle cx="230" cy="80" r="4" fill="currentColor" className="text-[var(--color-primary)] shadow-[0_0_10px_currentColor]" />
              <path d="M 230 80 Q 180 80 150 40 T 10 20" stroke="currentColor" className="text-[var(--color-primary)] opacity-70" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" fill="none" />
           </svg>
           <div className="absolute top-0 left-0 text-[var(--color-primary)] font-bold text-sm px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-primary)]/40 shadow-lg whitespace-nowrap flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
              </span>
              * Interactive Virtual Buttons
           </div>
        </motion.div>

        {/* Hardware Buttons (Shiny Metal) */}
        <div className="absolute left-[-6px] top-[150px] w-[6px] h-[40px] bg-gradient-to-b from-gray-500 via-gray-300 to-gray-500 dark:from-gray-800 dark:via-gray-500 dark:to-gray-800 rounded-l-md border-y border-l border-gray-400 dark:border-gray-700 shadow-[inset_1px_0_2px_rgba(255,255,255,0.6),-2px_0_4px_rgba(0,0,0,0.3)]"></div>
        <div className="absolute left-[-6px] top-[210px] w-[6px] h-[80px] bg-gradient-to-b from-gray-500 via-gray-300 to-gray-500 dark:from-gray-800 dark:via-gray-500 dark:to-gray-800 rounded-l-md border-y border-l border-gray-400 dark:border-gray-700 shadow-[inset_1px_0_2px_rgba(255,255,255,0.6),-2px_0_4px_rgba(0,0,0,0.3)]"></div>
        <div className="absolute right-[-6px] top-[180px] w-[6px] h-[60px] bg-gradient-to-b from-gray-500 via-gray-300 to-gray-500 dark:from-gray-800 dark:via-gray-500 dark:to-gray-800 rounded-r-md border-y border-r border-gray-400 dark:border-gray-700 shadow-[inset_-1px_0_2px_rgba(255,255,255,0.6),2px_0_4px_rgba(0,0,0,0.3)]"></div>

        {/* Inner Phone Screen */}
        <div className="relative w-full h-full bg-[var(--bg-primary)] rounded-[3rem] overflow-hidden flex flex-col border border-black/20 dark:border-white/20 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
          
          {/* Status Bar & Notch */}
          <div className="absolute top-0 w-full h-8 flex justify-between items-center px-6 z-40 text-xs font-semibold text-[var(--text-primary)]">
            <span>{currentTime}</span>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-2xl flex justify-center items-center gap-2 z-50">
               <div className="w-2 h-2 rounded-full bg-gray-800 shadow-[inset_0_0_2px_rgba(255,255,255,0.2)]"></div>
               <div className="w-12 h-1.5 rounded-full bg-gray-800 shadow-[inset_0_0_2px_rgba(255,255,255,0.2)]"></div>
            </div>
            <div className="flex gap-1 items-center">
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zM17.9 17.39c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
            </div>
          </div>

          {/* Push Notification Dropdown */}
          <AnimatePresence>
            {notification.visible && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 35, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="absolute left-4 right-4 z-50 bg-[var(--bg-secondary)] border border-yellow-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 cursor-pointer overflow-hidden backdrop-blur-md"
                onClick={() => {
                  setNotification(prev => ({ ...prev, visible: false }));
                  setActiveScreen('payment');
                }}
              >
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Z-TAPS Alert</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Is this you making a payment? Tap to review authorization request.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Active Screen */}
          <div className="flex-1 w-full flex flex-col relative z-20 min-h-0">
            {activeScreen === 'home' && renderHomeScreen()}
            {activeScreen === 'chat' && renderChatScreen()}
            {activeScreen === 'payment' && renderPaymentScreen()}
            {activeScreen === 'settings' && (
              <div className="flex-1 w-full bg-[var(--bg-primary)] p-6 pt-16 flex flex-col items-center overflow-y-auto">
                 <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Demo Configuration</h2>
                 
                 <div className="w-full space-y-4">
                     {/* Dynamic Categories Section */}
                     <div className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-4 shadow-inner space-y-3">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Allowed Categories</h3>
                             <button 
                                onClick={() => {
                                    setSettingsConfig(prev => ({
                                        ...prev, 
                                        categories: [...prev.categories, { name: 'new_category', min: 0, max: 100000, keywords: 'keyword1, keyword2' }]
                                    }))
                                }}
                                className="text-xs bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg shadow-sm hover:opacity-90"
                             >
                                 + Add
                             </button>
                         </div>
                         
                         {settingsConfig.categories.map((cat, idx) => (
                             <div key={idx} className="flex flex-col gap-2 p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--glass-border)]">
                                 <div className="flex justify-between items-center">
                                     <input 
                                        type="text" 
                                        value={cat.name}
                                        onChange={(e) => {
                                            const newCats = [...settingsConfig.categories];
                                            newCats[idx].name = e.target.value;
                                            setSettingsConfig(prev => ({...prev, categories: newCats}));
                                        }}
                                        className="bg-transparent font-bold text-[var(--text-primary)] focus:outline-none w-1/2"
                                     />
                                     <button 
                                        onClick={() => {
                                            const newCats = settingsConfig.categories.filter((_, i) => i !== idx);
                                            setSettingsConfig(prev => ({...prev, categories: newCats}));
                                        }}
                                        className="text-red-400 hover:text-red-500"
                                     >
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                     </button>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 text-xs">
                                     <div className="flex flex-col">
                                         <span className="text-[10px] text-[var(--text-secondary)] uppercase">Min (Paise)</span>
                                         <input type="number" value={cat.min} onChange={(e) => {
                                            const newCats = [...settingsConfig.categories];
                                            newCats[idx].min = parseInt(e.target.value, 10) || 0;
                                            setSettingsConfig(prev => ({...prev, categories: newCats}));
                                         }} className="bg-[var(--bg-secondary)] p-1.5 rounded border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none" />
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-[10px] text-[var(--text-secondary)] uppercase">Max (Paise)</span>
                                         <input type="number" value={cat.max} onChange={(e) => {
                                            const newCats = [...settingsConfig.categories];
                                            newCats[idx].max = parseInt(e.target.value, 10) || 0;
                                            setSettingsConfig(prev => ({...prev, categories: newCats}));
                                         }} className="bg-[var(--bg-secondary)] p-1.5 rounded border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none" />
                                     </div>
                                     <div className="flex flex-col col-span-2 mt-1">
                                         <span className="text-[10px] text-[var(--text-secondary)] uppercase">Trigger Keywords (Comma Separated)</span>
                                         <input type="text" value={cat.keywords || ''} onChange={(e) => {
                                            const newCats = [...settingsConfig.categories];
                                            newCats[idx].keywords = e.target.value;
                                            setSettingsConfig(prev => ({...prev, categories: newCats}));
                                         }} className="bg-[var(--bg-secondary)] p-1.5 rounded border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none" />
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                    <div className="flex flex-col">
                       <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Simulated Hardware Price (Paise)</label>
                       <input 
                          type="number" 
                          value={settingsConfig.hardwarePrice} 
                          onChange={(e) => setSettingsConfig(prev => ({...prev, hardwarePrice: e.target.value}))}
                          className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-3 text-[var(--text-primary)] focus:outline-none" 
                       />
                       <span className="text-[10px] text-[var(--text-secondary)] mt-1">Applies when 'laptop' or 'hardware' is mentioned.</span>
                    </div>

                    <div className="flex flex-col">
                       <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Simulated Software Price (Paise)</label>
                       <input 
                          type="number" 
                          value={settingsConfig.softwarePrice} 
                          onChange={(e) => setSettingsConfig(prev => ({...prev, softwarePrice: e.target.value}))}
                          className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-3 text-[var(--text-primary)] focus:outline-none" 
                       />
                       <span className="text-[10px] text-[var(--text-secondary)] mt-1">Applies when 'software' or 'license' is mentioned.</span>
                    </div>

                    <div className="flex flex-col">
                       <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Z-TAPS Auto-Approval Limit (Paise)</label>
                       <input 
                          type="number" 
                          value={settingsConfig.approvalLimit} 
                          onChange={(e) => setSettingsConfig(prev => ({...prev, approvalLimit: e.target.value}))}
                          className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-3 text-[var(--text-primary)] focus:outline-none" 
                       />
                       <span className="text-[10px] text-[var(--text-secondary)] mt-1">Updates backend Global Config. Transactions above this will escalate.</span>
                    </div>

                     <button 
                       className="w-full py-4 mt-4 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-transform"
                       onClick={async () => {
                         try {
                           await axios.post('/api/v1/admin/config', {
                             lower_limit: 0,
                             upper_limit: 9999999999,
                             require_human_approval_above: parseInt(settingsConfig.approvalLimit, 10)
                           }, { headers: { 'X-API-Key': 'dummy_api_key_for_testing' } });
                           
                           await axios.post('/api/v1/admin/policy', {
                               agent_id: 'agent_001',
                               max_spend: 999999999, // Legacy overall max limit
                               allowed_categories: settingsConfig.categories
                           }, { headers: { 'X-API-Key': 'dummy_api_key_for_testing' } });

                           setActiveScreen('home');
                           setMessages(prev => [...prev, { id: Date.now(), role: 'system', text: '✅ SYSTEM: Configuration limits updated successfully.'}]);
                         } catch (e) {
                           console.error(e);
                           alert("Failed to update config");
                         }
                       }}
                    >
                      Save Configuration
                    </button>
                 </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="w-full h-12 bg-[var(--bg-primary)] border-t border-[var(--glass-border)] flex justify-between items-center px-12 z-30 pb-2">
             <button onClick={() => setActiveScreen('home')} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
             </button>
             <button onClick={() => setActiveScreen('home')} className="w-12 h-1.5 rounded-full bg-[var(--text-primary)] opacity-40 hover:opacity-100 transition-opacity"></button>
             <div className="w-10"></div> {/* Spacer to center the home pill */}
          </div>

          {/* Screen Glare (Skeuomorphic) */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-[3rem] z-40"></div>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
