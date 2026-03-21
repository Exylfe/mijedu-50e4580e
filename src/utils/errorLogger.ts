import { supabase } from '@/integrations/supabase/client';

export const logError = async (
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('error_logs').insert({
      error_type: errorType,
      error_message: errorMessage,
      user_id: user?.id || null,
      context: context || null,
    });
  } catch {
    console.error('Failed to log error:', errorType, errorMessage);
  }
};
