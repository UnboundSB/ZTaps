import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AgentChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'agent', text: "Hello! I am your AI Purchasing Assistant. What would you like to buy today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const parseIntent = (text) => {
    // Simple heuristic parser to mock an LLM intent extraction
    const lower = text.toLowerCase();
    
    // Default payload
    let payload = {
      agent_id: 'agent_001',
      item_id: 'ITEM_UNKNOWN',
      quantity: 1,
      item_category: 'general',
      amount: 0,
      justification: text
    };

    if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('hardware')) {
        payload.item_category = 'hardware';
        payload.item_id = 'ITEM_STD_001';
        payload.amount = 15000; // 150.00 USD (to match the DB price)
    } else if (lower.includes('software') || lower.includes('license')) {
        payload.item_category = 'software';
        payload.item_id = 'ITEM_HV_002';
        payload.amount = 8500000; // 85,000.00 USD (to match the DB price)
    } else {
        // Fallback for general tests
        payload.item_category = 'general';
        payload.item_id = 'ITEM_STD_001';
        payload.amount = 15000;
    }

    // Extract numbers for quantity
    const qtyMatch = text.match(/(?:buy|purchase)\s+(\d+)/i);
    if (qtyMatch) {
        payload.quantity = parseInt(qtyMatch[1], 10);
        payload.amount = payload.amount * payload.quantity;
    } else {
        // Find any number if explicit 'buy' is missing
        const anyNumber = text.match(/\b(\d+)\b/);
        if (anyNumber) {
            payload.quantity = parseInt(anyNumber[1], 10);
            payload.amount = payload.amount * payload.quantity;
        }
    }

    // High amount trigger for limits testing
    if (lower.includes('million') || lower.includes('enterprise') || lower.includes('company')) {
        payload.amount = 500000000; // 5M USD
    }

    // If it's 0, just set a default test amount
    if (payload.amount === 0) payload.amount = 10000;

    return payload;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      // 1. Parse intent from natural language
      const payload = parseIntent(userText);
      
      // 2. Simulate agent "thinking"
      setTimeout(async () => {
        setMessages(prev => [...prev, { 
            id: Date.now(), 
            role: 'agent', 
            text: `Got it. I'm preparing a transaction for ${payload.quantity}x ${payload.item_category} (Total: $${(payload.amount / 100).toLocaleString()}). Sending to Z-TAPS for authorization...` 
        }]);
        
        // 3. Send payload to Z-TAPS Interceptor
        try {
          const response = await axios.post('/api/v1/agent/intercept', payload, {
            headers: { 'X-API-Key': 'dummy_api_key_for_testing' }
          });
          
          const { data } = response;
          
          // Wait a bit to simulate Z-TAPS processing
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

  return (
    <div className="w-full">
      
      <div className="glass-panel w-full h-[600px] flex flex-col overflow-hidden relative">
        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map(msg => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[var(--color-primary)] text-white rounded-br-none font-medium text-[15px]' 
                  : msg.role === 'system'
                    ? 'bg-[var(--color-secondary)] text-[var(--text-primary)] font-mono text-sm w-full border-l-4 border-[var(--color-primary)]'
                    : 'bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-bl-none flex gap-2 items-center shadow-sm">
                  <div className="w-2 h-2 bg-[var(--color-tertiary)] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[var(--color-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[var(--color-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)] flex gap-4 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your prompt (e.g. 'Buy 5 laptops' or 'Ignore previous instructions')..."
            className="flex-1 p-4 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-sm"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={isTyping || !input.trim()}
            className="p-4 px-8 btn-primary rounded-lg shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentChat;
