export const logError = async (
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>
) => {
  try {
    console.error(`[${errorType}]`, errorMessage, context);
  } catch {
    console.error('Failed to log error:', errorType, errorMessage);
  }
};
