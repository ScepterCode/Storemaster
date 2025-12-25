import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { BatchService } from '../../services/batchService';
import { ProductBatchSummary } from '../../types';

export const BatchTrackingWidget: React.FC = () => {
  const [summary, setSummary] = useState<ProductBatchSummary[]>([]);
  const [expiringCount, setExpiringCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, expiringBatches, expiredBatches] = await Promise.all([
        BatchService.getProductBatchSummary(),
        BatchService.getExpiringBatches(30),
        BatchService.getExpiredBatches()
      ]);
      
      setSummary(summaryData);
      setExpiringCount(expiringBatches.length);
      setExpiredCount(expiredBatches.length);
    } catch (error) {
      console.error('Failed to load batch tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = summary.length;
  const totalBatches = summary.reduce((sum, item) => sum + item.totalBatches, 0);
  const totalValue = summary.reduce((sum, item) => sum + (item.totalQuantity * (item.averageCost || 0)), 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Batch Tracking Overview</h3>
        <Package className="w-5 h-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
          <p className="text-sm text-gray-600">Products with Batches</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{totalBatches}</p>
          <p className="text-sm text-gray-600">Total Batches</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Expiring Soon Alert */}
        {expiringCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {expiringCount} batch{expiringCount !== 1 ? 'es' : ''} expiring soon
              </span>
            </div>
            <span className="text-xs text-yellow-600">30 days</span>
          </div>
        )}

        {/* Expired Alert */}
        {expiredCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {expiredCount} expired batch{expiredCount !== 1 ? 'es' : ''}
              </span>
            </div>
            <span className="text-xs text-red-600">Action needed</span>
          </div>
        )}

        {/* Total Value */}
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Total Inventory Value
            </span>
          </div>
          <span className="text-sm font-bold text-green-800">
            ${totalValue.toFixed(2)}
          </span>
        </div>
      </div>

      {totalProducts === 0 && (
        <div className="text-center py-4">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No batch-tracked products yet</p>
        </div>
      )}
    </div>
  );
};