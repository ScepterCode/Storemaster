import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { CashdeskSession, PettyCashTransaction } from "@/types/cashdesk";
import { generateId } from "@/lib/formatter";

interface StatsType {
  totalSessions: number;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  lastSessionDate: string;
  recentSessions: CashdeskSession[];
}

export const useCashdeskSession = () => {
  const [currentSession, setCurrentSession] = useState<CashdeskSession | null>(
    null
  );
  const [sessionStats, setSessionStats] = useState<StatsType | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentSession();
    loadSessionStats();
  }, [user]);

  const loadCurrentSession = () => {
    if (!user) return;

    const sessionKey = `cashdesk_session_${user.id}`;
    const storedSession = localStorage.getItem(sessionKey);

    if (storedSession) {
      const session = JSON.parse(storedSession);
      // Check if session is from today and still active
      const sessionDate = new Date(session.startTime).toDateString();
      const today = new Date().toDateString();

      if (sessionDate === today && session.status === "active") {
        setCurrentSession(session);
      } else {
        // Clear old session
        localStorage.removeItem(sessionKey);
      }
    }
  };

  const loadSessionStats = () => {
    if (!user) return;

    const statsKey = `cashdesk_stats_${user.id}`;
    const storedStats = localStorage.getItem(statsKey);

    if (storedStats) {
      setSessionStats(JSON.parse(storedStats));
    } else {
      // Initialize default stats
      const defaultStats = {
        totalSessions: 0,
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        lastSessionDate: new Date().toISOString(),
        recentSessions: [],
      };
      setSessionStats(defaultStats);
      localStorage.setItem(statsKey, JSON.stringify(defaultStats));
    }
  };

  const startSession = async (openingFloat: number) => {
    if (!user) throw new Error("User not authenticated");

    const session: CashdeskSession = {
      id: generateId(),
      cashierId: user.id,
      cashierName: user.email || "Cashier",
      startTime: new Date().toISOString(),
      openingFloat,
      status: "active",
      pettyCashTransactions: [],
      totalSales: 0,
      transactionCount: 0,
    };

    setCurrentSession(session);

    const sessionKey = `cashdesk_session_${user.id}`;
    localStorage.setItem(sessionKey, JSON.stringify(session));

    // Update stats
    if (sessionStats) {
      const updatedStats = {
        ...sessionStats,
        totalSessions: sessionStats.totalSessions + 1,
        lastSessionDate: new Date().toISOString(),
      };
      setSessionStats(updatedStats);
      localStorage.setItem(
        `cashdesk_stats_${user.id}`,
        JSON.stringify(updatedStats)
      );
    }
  };

  const endSession = async (session: CashdeskSession) => {
    const endTime = new Date().toISOString();
    const duration =
      new Date(endTime).getTime() - new Date(session.startTime).getTime();

    const closedSession: CashdeskSession = {
      ...session,
      endTime,
      status: "closed",
      expectedCash: session.openingFloat + session.totalSales,
      closingCash: session.openingFloat + session.totalSales, // Assume no discrepancy for now
      discrepancy: 0,
    };

    // Save to history
    const historyKey = `cashdesk_history_${user?.id}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    history.unshift({
      id: session.id,
      date: session.startTime,
      sales: session.totalSales,
      transactions: session.transactionCount,
      duration: Math.floor(duration / (1000 * 60)) + " minutes",
    });

    // Keep only last 50 sessions
    if (history.length > 50) {
      history.splice(50);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));

    // Update stats
    if (sessionStats) {
      const updatedStats = {
        ...sessionStats,
        totalSales: sessionStats.totalSales + session.totalSales,
        totalTransactions:
          sessionStats.totalTransactions + session.transactionCount,
        averageTransactionValue:
          sessionStats.totalTransactions > 0
            ? (sessionStats.totalSales + session.totalSales) /
              (sessionStats.totalTransactions + session.transactionCount)
            : 0,
        recentSessions: history.slice(0, 10),
      };
      setSessionStats(updatedStats);
      localStorage.setItem(
        `cashdesk_stats_${user?.id}`,
        JSON.stringify(updatedStats)
      );
    }

    // Clear current session
    setCurrentSession(null);
    const sessionKey = `cashdesk_session_${user?.id}`;
    localStorage.removeItem(sessionKey);

    toast({
      title: "Session Ended",
      description: `Session completed with ₦${session.totalSales.toFixed(
        2
      )} in sales`,
    });
  };

  const updateSession = (updates: Partial<CashdeskSession>) => {
    if (!currentSession || !user) return;

    const updatedSession = { ...currentSession, ...updates };
    setCurrentSession(updatedSession);

    const sessionKey = `cashdesk_session_${user.id}`;
    localStorage.setItem(sessionKey, JSON.stringify(updatedSession));
  };

  const addPettyCashTransaction = (
    transaction: Omit<PettyCashTransaction, "id" | "timestamp" | "cashierId">
  ) => {
    if (!currentSession || !user) return;

    const pettyCashTransaction: PettyCashTransaction = {
      id: generateId(),
      ...transaction,
      timestamp: new Date().toISOString(),
      cashierId: user.id,
    };

    const updatedTransactions = [
      ...currentSession.pettyCashTransactions,
      pettyCashTransaction,
    ];
    updateSession({ pettyCashTransactions: updatedTransactions });
  };

  return {
    currentSession,
    sessionStats,
    startSession,
    endSession,
    updateSession,
    addPettyCashTransaction,
  };
};
