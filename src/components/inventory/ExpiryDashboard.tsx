import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Package, TrendingDown, Calendar } from 'lucide-react';
import { ProductBatch } from '../../types';
import { BatchService } from '../../services/batchService';
import { format, differenceInDays } from 'date-fns';

export const ExpiryDashboard: React.FC = () => {
  const [expiringBatches, setExpiringBatches] = useState<ProductBatch[]>([]);
  const [expiredBatches, setExpiredBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(30);

  useEffect(() => {
    loadData();
  }, [selectedTimeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expiring, expired] = await Promise.all([
        BatchService.getExpiringBatches(selectedTimeframe),
        BatchService.getExpiredBatches()
      ]);
      setExpiringBatches(expiring);
      setExpiredBatches(expired);
    } catch (error) {
      console.error('Failed to load expiry data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const getUrgencyLevel = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'critical';
    if (daysUntilExpiry <= 7) return 'urgent';
    if (daysUntilExpiry <= 14) return 'warning';
    return 'normal';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-50 text-red-700 border-red-200';
      case 'urgent': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const calculateTotalValue = (batches: ProductBatch[]) => {
    return batches.reduce((total, batch) => {
      return total + (batch.quantityCurrent * (batch.unitCost || 0));
    }, 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">{expiringBatches.length}</p>
              <p className="text-xs text-gray-500">
                Within {selectedTimeframe} days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Already Expired</p>
              <p className="text-2xl font-bold text-gray-900">{expiredBatches.length}</p>
              <p className="text-xs text-gray-500">
                ${calculateTotalValue(expiredBatches).toFixed(2)} value
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">At Risk Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${calculateTotalValue(expiringBatches).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                Potential loss
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Expiry Timeline</h3>
          <div className="flex space-x-2">
            {[7, 14, 30, 60].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedTimeframe(days)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedTimeframe === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {/* Expiring Batches List */}
        <div className="space-y-3">
          {expiringBatches.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No batches expiring in the next {selectedTimeframe} days</p>
            </div>
          ) : (
            expiringBatches.map((batch) => {
              const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate!);
              const urgencyLevel = getUrgencyLevel(daysUntilExpiry);
              const urgencyColor = getUrgencyColor(urgencyLevel);

              return (
                <div
                  key={batch.id}
                  className={`border rounded-lg p-4 ${urgencyColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{batch.batchNumber}</h4>
                          <p className="text-sm opacity-75">
                            {batch.quantityCurrent} units • 
                            {batch.unitCost && ` $${(batch.quantityCurrent * batch.unitCost).toFixed(2)} value`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days`}
                      </p>
                      <p className="text-sm opacity-75">
                        {format(new Date(batch.expiryDate!), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Expired Batches */}
      {expiredBatches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Expired Batches</h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {expiredBatches.length}
            </span>
          </div>

          <div className="space-y-3">
            {expiredBatches.map((batch) => {
              const daysExpired = Math.abs(getDaysUntilExpiry(batch.expiryDate!));
              
              return (
                <div
                  key={batch.id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">{batch.batchNumber}</h4>
                      <p className="text-sm text-red-700">
                        {batch.quantityCurrent} units • 
                        {batch.unitCost && ` $${(batch.quantityCurrent * batch.unitCost).toFixed(2)} value`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-900">
                        {daysExpired} days ago
                      </p>
                      <p className="text-sm text-red-700">
                        {format(new Date(batch.expiryDate!), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};