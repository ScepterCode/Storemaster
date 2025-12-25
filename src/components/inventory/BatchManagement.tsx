import React, { useState, useEffect } from 'react';
import { Plus, Calendar, AlertTriangle, Package, Edit, Trash2, Clock, TrendingDown } from 'lucide-react';
import { ProductBatch, Product } from '../../types';
import { useBatches } from '../../hooks/useBatches';
import { format, isAfter, differenceInDays } from 'date-fns';

interface BatchManagementProps {
  product: Product;
  onClose: () => void;
}

export const BatchManagement: React.FC<BatchManagementProps> = ({ product, onClose }) => {
  const {
    batches,
    expiringBatches,
    loading,
    error,
    createBatch,
    updateBatch,
    adjustBatchQuantity,
    deleteBatch,
    loadBatches,
    loadExpiringBatches
  } = useBatches(product.id);

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    quantityReceived: 0,
    unitCost: 0,
    receivedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    supplierName: '',
    supplierReference: '',
    notes: ''
  });

  useEffect(() => {
    loadExpiringBatches(30); // Load batches expiring in 30 days
  }, []);

  const handleCreateBatch = async () => {
    try {
      await createBatch({
        productId: product.id,
        batchNumber: newBatch.batchNumber || generateBatchNumber(),
        quantityReceived: newBatch.quantityReceived,
        quantityCurrent: newBatch.quantityReceived,
        unitCost: newBatch.unitCost || undefined,
        receivedDate: newBatch.receivedDate,
        expiryDate: newBatch.expiryDate || undefined,
        supplierName: newBatch.supplierName || undefined,
        supplierReference: newBatch.supplierReference || undefined,
        notes: newBatch.notes || undefined
      });
      
      setShowAddBatch(false);
      resetNewBatch();
    } catch (err) {
      console.error('Failed to create batch:', err);
    }
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;
    
    try {
      await updateBatch(editingBatch.id, editingBatch);
      setEditingBatch(null);
    } catch (err) {
      console.error('Failed to update batch:', err);
    }
  };

  const handleAdjustQuantity = async (batchId: string, adjustment: number, type: 'adjustment' | 'expired' | 'damaged' = 'adjustment') => {
    try {
      await adjustBatchQuantity(batchId, adjustment, type);
    } catch (err) {
      console.error('Failed to adjust quantity:', err);
    }
  };

  const generateBatchNumber = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const productCode = product.name.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${productCode}-${dateStr}-${randomSuffix}`;
  };

  const resetNewBatch = () => {
    setNewBatch({
      batchNumber: '',
      quantityReceived: 0,
      unitCost: 0,
      receivedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      supplierName: '',
      supplierReference: '',
      notes: ''
    });
  };

  const getBatchStatus = (batch: ProductBatch) => {
    if (!batch.expiryDate) return 'no-expiry';
    
    const expiryDate = new Date(batch.expiryDate);
    const now = new Date();
    const daysUntilExpiry = differenceInDays(expiryDate, now);
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'critical';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50';
      case 'critical': return 'text-red-500 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'good': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Batch Management - {product.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Total Stock: {batches.reduce((sum, batch) => sum + batch.quantityCurrent, 0)} units
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddBatch(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Batch</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Expiry Alerts */}
          {expiringBatches.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">Expiry Alerts</h3>
              </div>
              <p className="text-sm text-yellow-700">
                {expiringBatches.length} batch(es) expiring within 30 days
              </p>
            </div>
          )}

          {/* Batch List */}
          <div className="space-y-4">
            {batches.map((batch) => {
              const status = getBatchStatus(batch);
              const statusColor = getStatusColor(status);
              
              return (
                <div key={batch.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${statusColor}`}>
                        {getStatusIcon(status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{batch.batchNumber}</h4>
                        <p className="text-sm text-gray-500">
                          Received: {format(new Date(batch.receivedDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingBatch(batch)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {batch.quantityCurrent === 0 && (
                        <button
                          onClick={() => deleteBatch(batch.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Current Stock:</span>
                      <p className="font-medium">{batch.quantityCurrent} units</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Original:</span>
                      <p className="font-medium">{batch.quantityReceived} units</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Unit Cost:</span>
                      <p className="font-medium">
                        {batch.unitCost ? `$${batch.unitCost.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Expiry:</span>
                      <p className={`font-medium ${status === 'expired' ? 'text-red-600' : status === 'critical' ? 'text-red-500' : status === 'warning' ? 'text-yellow-600' : ''}`}>
                        {batch.expiryDate ? format(new Date(batch.expiryDate), 'MMM dd, yyyy') : 'No expiry'}
                      </p>
                    </div>
                  </div>

                  {batch.supplierName && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Supplier:</span> {batch.supplierName}
                      {batch.supplierReference && ` (Ref: ${batch.supplierReference})`}
                    </div>
                  )}

                  {batch.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {batch.notes}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleAdjustQuantity(batch.id, -1)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      disabled={batch.quantityCurrent <= 0}
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleAdjustQuantity(batch.id, 1)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      +1
                    </button>
                    {status === 'expired' && batch.quantityCurrent > 0 && (
                      <button
                        onClick={() => handleAdjustQuantity(batch.id, -batch.quantityCurrent, 'expired')}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                      >
                        Mark as Expired
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {batches.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Found</h3>
              <p className="text-gray-500 mb-4">Start by adding your first batch of inventory.</p>
              <button
                onClick={() => setShowAddBatch(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add First Batch
              </button>
            </div>
          )}
        </div>

        {/* Add Batch Modal */}
        {showAddBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Add New Batch</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={newBatch.batchNumber}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, batchNumber: e.target.value }))}
                      placeholder="Auto-generated if empty"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity Received *
                      </label>
                      <input
                        type="number"
                        value={newBatch.quantityReceived}
                        onChange={(e) => setNewBatch(prev => ({ ...prev, quantityReceived: parseInt(e.target.value) || 0 }))}
                        min="1"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newBatch.unitCost}
                        onChange={(e) => setNewBatch(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received Date *
                      </label>
                      <input
                        type="date"
                        value={newBatch.receivedDate}
                        onChange={(e) => setNewBatch(prev => ({ ...prev, receivedDate: e.target.value }))}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={newBatch.expiryDate}
                        onChange={(e) => setNewBatch(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      value={newBatch.supplierName}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, supplierName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Reference
                    </label>
                    <input
                      type="text"
                      value={newBatch.supplierReference}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, supplierReference: e.target.value }))}
                      placeholder="Invoice number, PO number, etc."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={newBatch.notes}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddBatch(false);
                      resetNewBatch();
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBatch}
                    disabled={newBatch.quantityReceived <= 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Batch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Batch Modal */}
        {editingBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Edit Batch</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={editingBatch.batchNumber}
                      onChange={(e) => setEditingBatch(prev => prev ? { ...prev, batchNumber: e.target.value } : null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editingBatch.expiryDate || ''}
                      onChange={(e) => setEditingBatch(prev => prev ? { ...prev, expiryDate: e.target.value || undefined } : null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      value={editingBatch.supplierName || ''}
                      onChange={(e) => setEditingBatch(prev => prev ? { ...prev, supplierName: e.target.value || undefined } : null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editingBatch.notes || ''}
                      onChange={(e) => setEditingBatch(prev => prev ? { ...prev, notes: e.target.value || undefined } : null)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingBatch(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateBatch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Batch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};