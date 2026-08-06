const NETWORK_MESSAGE =
  "We can't reach the server right now. Please check your connection and try again in a moment.";

export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  const message =
    error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network request failed') ||
    normalized.includes('load failed') ||
    normalized.includes('fetch failed')
  );
};

/** Converts raw auth/network errors into a message that is safe to show a user. */
export const toFriendlyAuthError = (error: unknown): Error => {
  if (isNetworkError(error)) {
    return new Error(NETWORK_MESSAGE);
  }
  if (error instanceof Error) return error;
  return new Error('Something went wrong. Please try again.');
};

export const NETWORK_ERROR_MESSAGE = NETWORK_MESSAGE;
