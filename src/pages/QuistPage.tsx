/**
 * Quist Page - Natural Language Business Intelligence
 * 
 * Conversational AI assistant powered by Gemini that allows users
 * to query their business data using natural language.
 * 
 * Features:
 * - Natural language query processing
 * - Rich response rendering (text, tables, charts)
 * - Quick query shortcuts
 * - Conversation context for follow-ups
 */

import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Loader2,
  MessageSquare,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  History,
  X,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import FeatureGuard from '@/components/auth/FeatureGuard';
import {
  quistService,
  createConversationContext,
  updateConversationContext,
} from '@/services/quistService';
import {
  recentQueriesService,
} from '@/services/quistRecentQueries';
import type { 
  QuistResponse, 
  QuistConversationContext,
  QuistAction,
  QuistRecentQuery,
  QuistLoadingStage,
} from '@/types/quist';
import { QuistResponseRenderer } from '@/components/quist/QuistResponseRenderer';

// ============================================================================
// Loading Stage Messages
// ============================================================================

const LOADING_STAGE_MESSAGES: Record<QuistLoadingStage, string> = {
  idle: '',
  classifying: 'Understanding your question...',
  fetching: 'Fetching your data...',
  generating: 'Analyzing results...',
  formatting: 'Preparing response...',
};

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: QuistResponse;
}

interface QuickQuery {
  id: string;
  label: string;
  query: string;
  icon: React.ReactNode;
  category: 'sales' | 'inventory' | 'profit' | 'trends';
}

// ============================================================================
// Quick Query Shortcuts
// ============================================================================

const QUICK_QUERIES: QuickQuery[] = [
  {
    id: 'today-sales',
    label: "Today's Sales",
    query: "How much revenue did I make today?",
    icon: <DollarSign className="h-4 w-4" />,
    category: 'sales',
  },
  {
    id: 'low-stock',
    label: 'Low Stock',
    query: "Which products are low on stock?",
    icon: <Package className="h-4 w-4" />,
    category: 'inventory',
  },
  {
    id: 'top-products',
    label: 'Top Products',
    query: "What are my best selling products this month?",
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'sales',
  },
  {
    id: 'monthly-profit',
    label: "This Month's Profit",
    query: "Did I make profit this month?",
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'profit',
  },
];

// ============================================================================
// Component
// ============================================================================

const QuistPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm Quist, your business intelligence assistant. Ask me anything about your sales, inventory, profits, or trends. Try one of the quick queries below or type your own question!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<QuistLoadingStage>('idle');
  const [conversationContext, setConversationContext] = useState<QuistConversationContext | null>(null);
  const [recentQueries, setRecentQueries] = useState<QuistRecentQuery[]>([]);
  const [showRecentQueries, setShowRecentQueries] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { organization } = useOrganization();
  const { user } = useAuth();

  // Load recent queries when organization changes
  useEffect(() => {
    if (organization?.id) {
      const queries = recentQueriesService.getRecentQueries(organization.id);
      setRecentQueries(queries);
    }
  }, [organization?.id]);

  // Initialize conversation context
  useEffect(() => {
    if (organization?.id && user?.id && !conversationContext) {
      setConversationContext(
        createConversationContext(organization.id, user.id)
      );
    }
  }, [organization?.id, user?.id, conversationContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const query = queryText || input.trim();
    if (!query || loading) return;
    if (!organization?.id) {
      toast({
        title: 'Error',
        description: 'Organization not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setLoadingStage('classifying');
    setLastFailedQuery(null);

    // Set up timeout for long-running queries
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoadingStage('generating');
      }
    }, 3000);

    try {
      // Update loading stage as we progress
      setLoadingStage('fetching');
      
      // Process query using Quist service
      const response = await quistService.processQuery(
        query,
        organization.id,
        conversationContext || undefined
      );

      clearTimeout(timeoutId);
      setLoadingStage('formatting');

      // Check if response is an error type
      if (response.type === 'error') {
        setLastFailedQuery(query);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
          response,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        // Save to recent queries only on success
        recentQueriesService.saveRecentQuery(
          organization.id,
          query,
          response.metadata.intent
        );
        // Refresh recent queries list
        setRecentQueries(recentQueriesService.getRecentQueries(organization.id));

        // Update conversation context
        if (conversationContext) {
          setConversationContext(
            updateConversationContext(conversationContext, query, response)
          );
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
          response,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Quist error:', error);
      
      // Determine error type and message
      let errorMessage = "I'm sorry, I encountered an error processing your request.";
      let isNetworkError = false;
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = "I couldn't connect to the server. Please check your internet connection and try again.";
          isNetworkError = true;
        } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = "The request took too long. Please try a simpler question or try again later.";
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = "I'm receiving too many requests right now. Please wait a moment and try again.";
        }
      }

      setLastFailedQuery(query);
      
      toast({
        title: isNetworkError ? 'Connection Error' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${errorMessage} ${isNetworkError ? '' : 'Please try again or rephrase your question.'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setLoading(false);
      setLoadingStage('idle');
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSend(lastFailedQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuery = (query: string) => {
    setInput(query);
    handleSend(query);
  };

  const handleActionClick = (action: QuistAction) => {
    if (action.type === 'navigate') {
      window.location.href = action.payload;
    } else if (action.type === 'query') {
      handleSend(action.payload);
    }
  };

  const handleRecentQueryClick = (query: string) => {
    setShowRecentQueries(false);
    handleSend(query);
  };

  const handleRemoveRecentQuery = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    if (organization?.id) {
      recentQueriesService.removeRecentQuery(organization.id, query);
      setRecentQueries(recentQueriesService.getRecentQueries(organization.id));
    }
  };

  const handleClearRecentQueries = () => {
    if (organization?.id) {
      recentQueriesService.clearRecentQueries(organization.id);
      setRecentQueries([]);
      setShowRecentQueries(false);
    }
  };

  return (
    <AppLayout>
      <FeatureGuard feature="quist">
        <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Quist
            </h1>
            <p className="text-muted-foreground">
              Ask questions about your business in natural language
            </p>
          </div>

          {/* Chat Container */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Business Intelligence Chat
              </CardTitle>
              <CardDescription>
                Powered by AI - Ask about sales, inventory, profits, and trends
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
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {/* Render rich response for assistant messages with response data */}
                        {message.role === 'assistant' && message.response ? (
                          <QuistResponseRenderer 
                            response={message.response} 
                            onActionClick={handleActionClick}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        <p className="text-xs opacity-70 mt-2">
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
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            {LOADING_STAGE_MESSAGES[loadingStage] || 'Analyzing your data...'}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {(['classifying', 'fetching', 'generating', 'formatting'] as QuistLoadingStage[]).map((stage, idx) => (
                            <div
                              key={stage}
                              className={`h-1 w-6 rounded-full transition-colors ${
                                ['classifying', 'fetching', 'generating', 'formatting'].indexOf(loadingStage) >= idx
                                  ? 'bg-primary'
                                  : 'bg-muted-foreground/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Retry button for failed queries */}
                  {lastFailedQuery && !loading && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry last query
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Query Shortcuts */}
              {messages.length <= 2 && (
                <div className="p-4 border-t bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Quick queries:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUERIES.map((query) => (
                      <Button
                        key={query.id}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleQuickQuery(query.query)}
                        disabled={loading}
                      >
                        {query.icon}
                        {query.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Queries */}
              {recentQueries.length > 0 && (
                <div className="p-4 border-t bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowRecentQueries(!showRecentQueries)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <History className="h-4 w-4" />
                      Recent queries ({recentQueries.length})
                      <span className="text-xs">
                        {showRecentQueries ? '▲' : '▼'}
                      </span>
                    </button>
                    {showRecentQueries && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        onClick={handleClearRecentQueries}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear all
                      </Button>
                    )}
                  </div>
                  {showRecentQueries && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {recentQueries.map((recentQuery, index) => (
                        <div
                          key={`${recentQuery.query}-${index}`}
                          className="flex items-center justify-between group rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <button
                            onClick={() => handleRecentQueryClick(recentQuery.query)}
                            disabled={loading}
                            className="flex-1 text-left px-2 py-1.5 text-sm truncate disabled:opacity-50"
                          >
                            <span className="truncate">{recentQuery.query}</span>
                            {recentQuery.runCount > 1 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({recentQuery.runCount}x)
                              </span>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleRemoveRecentQuery(e, recentQuery.query)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                            title="Remove from recent"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your sales, inventory, profits..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send • Try: "What are my top products?" or "Show me this week's sales trend"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGuard>
    </AppLayout>
  );
};

export default QuistPage;
