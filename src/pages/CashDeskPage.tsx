import AppLayout from "@/components/layout/AppLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, ShoppingCart, Users } from "lucide-react";
import SessionManagement from "@/components/cashdesk/SessionManagement";
import ActiveSale from "@/components/cashdesk/ActiveSale";
import SessionSummary from "@/components/cashdesk/SessionSummary";
import { useCashdeskSession } from "@/hooks/useCashdeskSession";
import { CashdeskSession } from "@/types/cashdesk";

const CashdeskPage = () => {
  const { canEditCashDesk } = usePermissions();
  const { user } = useAuth();
  const { currentSession, startSession, endSession, sessionStats } =
    useCashdeskSession();

  if (!canEditCashDesk) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the cashdesk.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentSession) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Cashdesk</h1>
            <p className="text-muted-foreground">
              Start your cashier session to begin processing sales
            </p>
          </div>

          <SessionManagement onStartSession={startSession} />

          {sessionStats && (
            <SessionSummary stats={sessionStats} showDetailedView={true} />
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cashdesk - Active Session</h1>
            <p className="text-muted-foreground">
              Session started at{" "}
              {new Date(currentSession.startTime).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Session
            </Badge>

            <Button
              variant="outline"
              onClick={() => endSession(currentSession)}
            >
              End Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Opening Float
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{currentSession.openingFloat.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{currentSession.totalSales.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentSession.transactionCount} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expected Cash
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦
                {(
                  currentSession.openingFloat + currentSession.totalSales
                ).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Session Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(
                  (Date.now() - new Date(currentSession.startTime).getTime()) /
                    (1000 * 60 * 60)
                )}
                h
              </div>
              <p className="text-xs text-muted-foreground">hours active</p>
            </CardContent>
          </Card>
        </div>

        <ActiveSale sessionId={currentSession.id} />
      </div>
    </AppLayout>
  );
};

export default CashdeskPage;
