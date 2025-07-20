import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { usePrompt } from '@/hooks/PromptContext';

interface CreateIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string | null;
  onIndexCreated?: (data: any) => void;
  disableRedirect?: boolean;
  variant?: 'modal' | 'panel';
  onAiThinkingChange?: (thinking: boolean) => void;
  setIsLoadings?: boolean;
}

const quickSuggestions = [
  "AI companies leading in healthcare innovation",
  "Top green energy stocks for 2025",
  "Blockchain companies disrupting finance",
  // "High-growth SaaS businesses under $10B market cap",

];

type Message = { sender: 'user' | 'ai', text: string };

export function CreateIndexModal({ isOpen, setIsLoadings, onClose, initialPrompt, onIndexCreated, disableRedirect = false, variant = 'modal', onAiThinkingChange }: CreateIndexModalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { setPrompt } = usePrompt();
  const lastPromptRef = useRef<string | null>(null);

  const createIndexMutation = useMutation({
    mutationFn: async (data: { prompt: string }) => {
      setIsLoading(true);
      const response = await authService.apiRequest(
        "https://generatedassets1.onrender.com/api/generate-index",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: data.prompt,
            description: `AI-generated index based on: ${data.prompt}`,
          }),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to create index');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `✅ Index "${data.name}" created with ${data.stocks?.length || 0} stocks.\n${data.description || ''}` },
      ]);
      toast({
        title: "Index created successfully!",
        description: `"${data.name}" has been generated with ${data.stocks?.length || 0} stocks.`,
      });
      queryClient.invalidateQueries({ queryKey: ['indexes'] });
      onIndexCreated?.(data);
      if (!disableRedirect) {
        onClose();
        if (data._id) {
          setTimeout(() => {
            setLocation(`/index/${data._id}`);
          }, 100);
        }
      }
    },
    onError: (error: any) => {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: error.message || 'Failed to create index. Please try again.' },
      ]);
      toast({
        title: "Failed to create index",
        description: error.message || "Please try again with a different prompt.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsLoading(false),
  });

  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt !== lastPromptRef.current) {
      setMessages([
        { sender: 'ai', text: "Hi! I'm your AI investment assistant. Tell me about the type of companies or investment theme you're interested in, and I'll create a diversified portfolio for you." },
        { sender: 'user', text: initialPrompt },
      ]);
      setInput('');
      setIsLoading(true);
      createIndexMutation.mutate({ prompt: initialPrompt.trim() });
      setPrompt(null);
      lastPromptRef.current = initialPrompt;
    } else if (isOpen && !initialPrompt && messages.length === 0) {
      setMessages([
        { sender: 'ai', text: "Hi! I'm your AI investment assistant. Tell me about the type of companies or investment theme you're interested in, and I'll create a diversified portfolio for you." },
      ]);
      setInput('');
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    onAiThinkingChange?.(isLoading);
  }, [isLoading, onAiThinkingChange]);

  const handleClose = () => {
    if (isOpen) {
      setInput('');
      setMessages([]);
      onClose();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: 'user', text: input.trim() }]);
    setIsLoading(true);
    createIndexMutation.mutate({ prompt: input.trim() });
    setInput('');
  };

  const handleSuggestion = (suggestion: string) => {
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: suggestion }]);
    setIsLoading(true);
    createIndexMutation.mutate({ prompt: suggestion.trim() });
  };

  if (variant === 'panel') {
    return (
      <div className="flex flex-col h-full w-full" role="region" aria-label="AI Investment Assistant Chat">
        <div className="flex-1 overflow-y-auto p-0 space-y-2" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="flex-shrink-0 w-8 h-8 bg-dark rounded-full flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" />
                </div>
              )}
              <div className={`rounded-2xl px-4 py-2 max-w-[75%] whitespace-pre-line text-sm shadow ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}
                aria-label={msg.sender === 'user' ? 'You' : 'AI'}>
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {(isLoading || setIsLoadings ) && (
            <div className="flex items-end gap-2 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                {/* <Bot className="w-5 h-5 text-blue-300" /> */}
                <img src="/logo.png" alt="Logo" />
              </div>
              <div className="rounded-2xl px-4 py-2 max-w-[75%] bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 animate-pulse shadow">
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce mr-1" style={{animationDelay: '0ms'}}></span>
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce mr-1" style={{animationDelay: '100ms'}}></span>
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></span>
                <span className="ml-2">Your index is Getting Created</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {quickSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2 min-w-0">
            {quickSuggestions.map((s, i) => (
              <Button key={i} variant="secondary" size="sm" onClick={() => handleSuggestion(s)}
                className="truncate max-w-full rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/80 shadow">
                <span className="truncate max-w-[180px] md:max-w-[220px] lg:max-w-[260px]">{s}</span>
              </Button>
            ))}
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="p-1"
          aria-label="Send a message to the AI assistant"
        >
          <div className="relative bg-gray-900 rounded-full p-2 flex items-center min-h-[50px] shadow-lg">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your investment idea..."
              className="flex-1 bg-transparent rounded-full outline-none text-white placeholder-gray-400 p-3 text-sm py-2 resize-none min-h-[36px] max-h-32 overflow-y-hidden scrollbar-hide"
              disabled={isLoading}
              style={{ minWidth: "100%" }}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && input.trim()) handleSend(e);
                }
              }}
              aria-label="Type your message"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-white absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-blue-900 hover:bg-blue-800 p-2 flex items-center justify-center shadow"
              style={{ minWidth: 0, width: 36, height: 36, cursor: 'pointer' }}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md flex flex-col h-[70vh] p-0 bg-gray-50 dark:bg-gray-900 border-none shadow-xl">
        <DialogTitle className="sr-only">Create Index</DialogTitle>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl px-4 py-2 max-w-[75%] whitespace-pre-line text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 animate-pulse text-sm">
                Your index is getting created ...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {quickSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {quickSuggestions.map((s, i) => (
              <Button key={i} variant="secondary" size="sm" onClick={() => handleSuggestion(s)}>
                {s}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 p-4 border-t bg-gray-50 dark:bg-gray-900">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your investment idea..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="flex items-center gap-1">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
