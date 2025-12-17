/**
 * useFlutterwave Hook
 * 
 * React hook for Flutterwave payment integration
 */

import { useState } from 'react';
import { flutterwaveService, initializeFlutterwaveInline } from '@/services/flutterwaveService';
import { FlutterwavePaymentData } from '@/types/admin';
import { useToast } from '@/components/ui/use-toast';

export const useFlutterwave = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  /**
   * Initialize payment with redirect
   */
  const initializePayment = async (paymentData: FlutterwavePaymentData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await flutterwaveService.initializePayment(paymentData);

      if (result.status === 'success' && result.data) {
        // Redirect to payment page
        window.location.href = result.data.link;
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Payment initialization failed');
      setError(error);
      toast({
        title: 'Payment Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize inline payment (modal)
   */
  const initializeInlinePayment = (
    paymentData: FlutterwavePaymentData,
    onSuccess?: (response: any) => void,
    onClose?: () => void
  ) => {
    try {
      setLoading(true);
      setError(null);

      initializeFlutterwaveInline(
        paymentData,
        (response) => {
          setLoading(false);
          if (response.status === 'successful') {
            toast({
              title: 'Payment Successful',
              description: 'Your payment has been processed successfully.',
            });
            onSuccess?.(response);
          } else {
            toast({
              title: 'Payment Failed',
              description: 'Payment was not completed. Please try again.',
              variant: 'destructive',
            });
          }
        },
        () => {
          setLoading(false);
          onClose?.();
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Payment initialization failed');
      setError(error);
      setLoading(false);
      toast({
        title: 'Payment Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  /**
   * Verify payment
   */
  const verifyPayment = async (transactionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await flutterwaveService.verifyPayment(transactionId);

      if (result.status === 'success') {
        toast({
          title: 'Payment Verified',
          description: 'Your payment has been verified successfully.',
        });
        return result.data;
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Payment verification failed');
      setError(error);
      toast({
        title: 'Verification Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Subscribe to a plan
   */
  const subscribeToPlan = async (
    email: string,
    planId: string,
    organizationId: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await flutterwaveService.subscribeCustomer(email, planId, organizationId);

      if (result.status === 'success' && result.data) {
        // Redirect to payment page
        window.location.href = result.data.link;
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Subscription failed');
      setError(error);
      toast({
        title: 'Subscription Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    initializePayment,
    initializeInlinePayment,
    verifyPayment,
    subscribeToPlan,
  };
};
