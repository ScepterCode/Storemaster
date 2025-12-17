/**
 * Anomaly Detection Service
 * 
 * Detects unusual patterns in transactions
 * Flags potential fraud, errors, and suspicious activity
 */

import { TransactionAnomaly, AnomalyType } from '@/types/ai';
import { supabase } from '@/integrations/supabase/client';

export class AnomalyDetectionService {
  /**
   * Detect anomalies in transactions
   */
  async detectAnomalies(
    transactions: any[],
    organizationId: string
  ): Promise<TransactionAnomaly[]> {
    const anomalies: TransactionAnomaly[] = [];

    // Calculate baseline metrics
    const baseline = this.calculateBaseline(transactions);

    // Check each transaction
    transactions.forEach((transaction) => {
      const detected = this.checkTransaction(transaction, baseline);
      if (detected) {
        anomalies.push({
          ...detected,
          id: `anomaly_${transaction.id}`,
          transaction_id: transaction.id,
          detected_at: new Date().toISOString(),
          status: 'pending',
        });
      }
    });

    // Log anomalies
    if (anomalies.length > 0) {
      await this.logAnomalies(anomalies, organizationId);
    }

    return anomalies;
  }

  /**
   * Calculate baseline metrics from historical data
   */
  private calculateBaseline(transactions: any[]) {
    const amounts = transactions.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length
    );

    return {
      avgAmount,
      stdDev,
      maxAmount: Math.max(...amounts),
      minAmount: Math.min(...amounts),
      normalHours: { start: 8, end: 20 },
      avgDiscount: 5,
    };
  }

  /**
   * Check individual transaction for anomalies
   */
  private checkTransaction(transaction: any, baseline: any): Partial<TransactionAnomaly> | null {
    // Unusual amount (>3 standard deviations)
    if (Math.abs(transaction.amount - baseline.avgAmount) > baseline.stdDev * 3) {
      return {
        anomaly_type: 'unusual_amount',
        severity: transaction.amount > baseline.avgAmount * 5 ? 'critical' : 'high',
        confidence: 0.9,
        description: `Transaction amount (₦${transaction.amount}) is ${Math.round(
          (transaction.amount / baseline.avgAmount) * 100
        )}% of average`,
        details: {
          transaction_amount: transaction.amount,
          average_amount: baseline.avgAmount,
          deviation_percentage: Math.round(
            ((transaction.amount - baseline.avgAmount) / baseline.avgAmount) * 100
          ),
        },
      };
    }

    // Unusual time
    const hour = new Date(transaction.date).getHours();
    if (hour < baseline.normalHours.start || hour > baseline.normalHours.end) {
      return {
        anomaly_type: 'unusual_time',
        severity: 'medium',
        confidence: 0.7,
        description: `Transaction at ${hour}:00 outside normal business hours`,
        details: {
          transaction_time: transaction.date,
          normal_hours: `${baseline.normalHours.start}:00 - ${baseline.normalHours.end}:00`,
        },
      };
    }

    return null;
  }

  /**
   * Log anomalies to database
   */
  private async logAnomalies(anomalies: TransactionAnomaly[], organizationId: string) {
    try {
      await supabase.from('transaction_anomalies').insert(
        anomalies.map((a) => ({
          organization_id: organizationId,
          transaction_id: a.transaction_id,
          anomaly_type: a.anomaly_type,
          severity: a.severity,
          confidence: a.confidence,
          description: a.description,
          details: a.details,
          status: 'pending',
        }))
      );
    } catch (error) {
      console.error('Failed to log anomalies:', error);
    }
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
