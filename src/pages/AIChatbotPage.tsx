/**
 * AI Chatbot Page
 * 
 * Conversational AI assistant powered by Gemini
 * Answers business questions about inventory, sales, and operations
 */

import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { geminiService } from '@/services/geminiService';
import { useProducts } from '@/hooks/useProducts';
import { useTransactions } from '@/hooks/useTransactions';
import { useInvoices } from '@/hooks/useInvoices';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import FeatureGuard from '@/components/auth/FeatureGuard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your AI business assistant. I can help you with:\n\n• Sales analysis and trends\n• Inventory insights\n• Product recommendations\n• Financial summaries\n• Business questions\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { products } = useProducts();
  const { transactions } = useTransactions();
  const { invoices } = useInvoices();
  const { organization } = useOrganization();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare business context
      const businessContext = {
        organization: organization?.name,
        products: {
          total: products.length,
          lowStock: products.filter((p) => p.quantity < 10).length,
          categories: [...new Set(products.map((p) => p.categoryName))],
        },
        transactions: {
          total: transactions.length,
          recentSales: transactions
            .filter((t) => t.type === 'sale')
            .slice(-10)
            .map((t) => ({ amount: t.amount, date: t.date })),
        },
        invoices: {
          total: invoices.length,
          pending: invoices.filter((i) => i.status === 'issued').length,
        },
      };

      // Get AI response
      const response = await geminiService.answerQuestion(input, businessContext);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try asking your question again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What were my sales last week?",
    "Which products are running low?",
    "Show me my top selling products",
    "How many pending invoices do I have?",
    "Analyze my inventory status",
  ];

  return (
    <AppLayout>
      <FeatureGuard feature="advanced_reports">
        <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              AI Business Assistant
            </h1>
            <p className="text-muted-foreground">
              Ask questions about your business in natural language
            </p>
          </div>

          {/* Chat Container */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Chat
              </CardTitle>
              <CardDescription>
                Powered by Google Gemini AI
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Suggested Questions */}
              {messages.length === 1 && (
                <div className="p-4 border-t bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setInput(question)}
                      >
                        {question}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your business..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={loading || !input.trim()}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGuard>
    </AppLayout>
  );
};

export default AIChatbotPage;
