import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VATService } from '@/services/vatService';
import { TaxConfiguration } from '@/types/tax';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export const useTaxConfiguration = () => {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const {
    data: taxConfig,
    isLoading,
    error
  } = useQuery({
    queryKey: ['taxConfiguration', organization?.id],
    queryFn: () => VATService.getTaxConfiguration(organization!.id),
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<TaxConfiguration>) =>
      VATService.updateTaxConfiguration(organization!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxConfiguration', organization?.id] });
      toast.success('Tax configuration updated successfully');
    },
    onError: (error) => {
      console.error('Error updating tax configuration:', error);
      toast.error('Failed to update tax configuration');
    },
  });

  const updateTaxConfiguration = (updates: Partial<TaxConfiguration>) => {
    updateMutation.mutate(updates);
  };

  return {
    taxConfig,
    isLoading,
    error,
    updateTaxConfiguration,
    isUpdating: updateMutation.isPending,
  };
};

export const useVATCalculation = () => {
  const { taxConfig } = useTaxConfiguration();

  const calculateVAT = (amount: number, isExempt: boolean = false) => {
    const vatRate = taxConfig?.vat_rate || 7.5;
    return VATService.calculateVAT(amount, vatRate, isExempt);
  };

  const calculateVATFromGross = (grossAmount: number, isExempt: boolean = false) => {
    const vatRate = taxConfig?.vat_rate || 7.5;
    return VATService.calculateVATFromGross(grossAmount, vatRate, isExempt);
  };

  const isProductVATExempt = (product: any) => {
    return VATService.isProductVATExempt(product, taxConfig || undefined);
  };

  return {
    calculateVAT,
    calculateVATFromGross,
    isProductVATExempt,
    vatRate: taxConfig?.vat_rate || 7.5,
    vatEnabled: taxConfig?.vat_enabled ?? true,
  };
};