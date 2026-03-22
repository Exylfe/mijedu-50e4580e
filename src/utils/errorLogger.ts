import { supabase } from '@/integrations/supabase/client';

export const logError = async (
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>
) => {
  try {
    console.error(`[${errorType}]`, errorMessage, context);

    // Fire-and-forget: persist to error_logs table
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('error_logs').insert({
      error_type: errorType,
      error_message: errorMessage.slice(0, 2000),
      context: context || {},
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
      url: window.location.href,
    });
  } catch {
    // Never let error logging crash the app
    console.error('Failed to log error:', errorType, errorMessage);
  }
};

// Global unhandled error catcher
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError('UNHANDLED_ERROR', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError('UNHANDLED_PROMISE', String(event.reason), {
      type: 'promise_rejection',
    });
  });
}
