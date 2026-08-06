# Fix "Failed to fetch" on login

## What's actually wrong

The hosted database/auth backend is currently **paused**. Every login and token-refresh call from the app fails at the network level before it reaches the server, which the browser reports as the raw error "Failed to fetch". This is not a bug in the login form — the sign-in code and credentials are fine.

## Plan

1. **Resume the backend** so auth calls work again. This alone fixes login for you and your users.
2. **Verify** by signing in end-to-end and confirming the token endpoint returns successfully instead of erroring.
3. **Make the app fail gracefully** so a user never sees "Failed to fetch" again:
   - Detect network-level failures in the sign-in and sign-up handlers.
   - Show a friendly message like "We can't reach the server right now. Please check your connection and try again in a moment." instead of the raw browser error.
   - Apply the same handling to the password-reset flow.
4. **Reduce refresh-error noise**: currently a failed token refresh retries repeatedly and floods the console. Handle the failure once and let the user re-authenticate calmly.

## Technical notes

- Backend resume via the cloud resume operation; then poll status until healthy before testing.
- Error mapping in `src/contexts/AuthContext.tsx` (`signIn`, `signUp`) and surfaced in `src/pages/Auth.tsx` / `src/components/auth/ForgotPasswordModal.tsx`: treat `TypeError: Failed to fetch` / message containing "fetch" as a connectivity error and return a user-friendly message.
- No schema changes, no changes to the auto-generated client.

## Note on pausing

The backend pauses after inactivity. If it pauses again, logins break the same way — worth publishing and keeping the project active if real users will be signing in.
