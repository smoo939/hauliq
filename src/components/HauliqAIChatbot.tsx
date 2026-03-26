import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function HauliqAIChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Hauliq AI — your logistics assistant. Ask me about routes, pricing, customs, or anything freight-related." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!user) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response (will be replaced with real edge function call)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getSimulatedResponse(userMsg.content)
      }]);
      setLoading(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <Button
              onClick={() => setOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg glow-primary"
              size="icon"
            >
              <Sparkles className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-4 z-50 w-[340px] max-h-[480px] rounded-2xl overflow-hidden glass-strong flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Hauliq AI</p>
                  <p className="text-[10px] text-muted-foreground">Logistics Assistant</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px]">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about routes, pricing..."
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="text-sm bg-muted/50 border-border/50"
                />
                <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function getSimulatedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('price') || lower.includes('rate') || lower.includes('cost')) {
    return "Current SADC corridor rates: Harare→Beira ~$800-1200 (depending on cargo). Harare→Johannesburg ~$1500-2500. Cross-border fees at Beitbridge average $50-120. Want me to calculate a specific route?";
  }
  if (lower.includes('border') || lower.includes('customs') || lower.includes('zimra')) {
    return "For ZIMRA clearance you'll need: Bill of Entry (Form 21), commercial invoice, packing list, and a valid customs bond. Processing typically takes 2-4 hours at Beitbridge. Need help with document preparation?";
  }
  if (lower.includes('route') || lower.includes('distance')) {
    return "Popular SADC routes: Harare→Beira (590km, ~8hrs), Harare→Johannesburg (1100km, ~14hrs via Beitbridge), Lusaka→Dar es Salaam (1800km, ~24hrs). Which route do you need details on?";
  }
  if (lower.includes('insurance') || lower.includes('git')) {
    return "GIT (Goods in Transit) insurance is mandatory for cross-border freight. Coverage typically ranges from 0.15%-0.5% of cargo value. I recommend getting quotes from at least 3 providers. Need specific provider recommendations?";
  }
  return "I can help with route planning, freight pricing, customs documentation (ZIMRA), insurance requirements, and fleet management. What would you like to know?";
}
