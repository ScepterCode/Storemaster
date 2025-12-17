import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { AppError, isAuthError, getUserMessage, logError, handleAuthError } from '@/lib/errorHandler';

/**
 * Custom hook to handle authentication errors consistently across the app
 */
export function useAuthErrorHandler() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, defaultMessage: string = 'An error occurred') => {
    if (error instanceof AppError) {
      logError(error);
      
      // Check if it's an authentication error
      if (error.type === 'auth' || isAuthError(error)) {
        // Show auth-specific message
        toast({
          title: 'Authentication Required',
          description: getUserMessage(error),
          variant: 'destructive',
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          handleAuthError(error, () => navigate('/login'));
        }, 1500);
        
        return;
      }
      
      // Handle other error types
      toast({
        title: 'Error',
        description: getUserMessage(error),
        variant: 'destructive',
      });
    } else {
      // Handle non-AppError errors
      const errorMessage = error instanceof Error ? error.message : defaultMessage;
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Unexpected error:', error);
    }
  }, [navigate, toast]);

  return { handleError };
}
