# Snipr Authentication --- Handoff Notes

## Stack and conventions

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS v4,
  shadcn/ui, Axios, TanStack Query.
- **Backend:** Express + TypeScript, Prisma, Neon; authentication uses
  HTTP-only cookies.
- Use **shadcn/ui** for UI controls.
- Do **not** use `useEffect` for API calls. Put API requests in
  `src/lib/api/` modules, wrap them in custom TanStack Query hooks,
  and call those hooks from pages. `useEffect` is acceptable for
  non-fetch side effects such as role-based redirects.
- Axios client is `src/lib/api.ts`; it uses `withCredentials: true`,
  handles refresh/retry after eligible 401 responses, and exports
  `getApiError(error)` for readable error messages.
- Query provider is `src/providers/query-provider.tsx`, mounted in
  `src/app/layout.tsx`. Sonner `<Toaster>` is also mounted there.

## Authentication API

API routes are mounted under `/api/v1/auth`: - `POST /auth/register` -
`POST /auth/login` - `POST /auth/refresh` - `POST /auth/logout` -
`GET /auth/me` - `POST /auth/2fa/setup` - `POST /auth/2fa/enable` -
`POST /auth/2fa/verify-login` - `POST /auth/2fa/disable`

The Axios base URL is configured in `src/lib/api.ts`. Backend CORS must
allow the frontend origin with credentials; `cookie-parser` must run
before auth routes.

## Cookie / 2FA flow

- Cookie names used in the current auth design: `snipr_access`,
  `snipr_refresh`, `snipr_2fa_setup`, and `snipr_2fa_challenge`.
- Access and refresh cookies are HTTP-only. Refresh rotates tokens.
- Owner accounts must enable authenticator-based TOTP before reaching
  the owner dashboard.
- Setup returns a QR-code data URL and a manual secret. Enabling 2FA
  verifies a code, creates recovery codes, and issues a full session.
- Login can return `setupRequired` or `twoFactorRequired`. Setup goes
  to `/setup-authenticator`; a login challenge goes to
  `/verify-authenticator`.
- Recovery codes are intended to be hashed server-side and consumed
  once.
- Frontend role redirects: `OWNER` → `/owner/dashboard`; customer →
  `/customer/dashboard`.
- Backend authorization must protect owner-only endpoints; frontend
  role redirects are not a security boundary.

## Frontend API modules and hooks

- `src/lib/api/auth.api.ts` contains typed API functions and response
  types:
  - `registerRequest`, `loginRequest`, `getCurrentUser`,
    `setupTwoFactorRequest`, `enableTwoFactorRequest`,
    `verifyLoginTwoFactorRequest`, `logoutRequest`.
- `src/hooks/use-auth.ts` exposes:
  - `useRegister()`
  - `useLogin()`
  - `useCurrentUser(enabled = true)`
  - `useSetupTwoFactor()`
  - `useEnableTwoFactor()`
  - `useVerifyLoginTwoFactor()`
  - `useLogout()`
- Auth query key: `['auth', 'me']`. Successful auth updates or
  invalidates the cached current user as appropriate; logout clears
  the query cache.

## Pages implemented

- `src/app/register/page.tsx`
  - React Hook Form + Zod (`zodResolver`) validation.
  - Fields: role (`CUSTOMER` or `OWNER`), email, password, confirm
    password.
  - Validates email, password minimum 8 characters, and matching
    confirmation.
  - Supports `/register?role=OWNER`.
  - Uses `useRegister()`; owner registration routes to
    `/setup-authenticator`.
  - Password and confirm-password fields have independent show/hide
    eye toggles using `Eye` / `EyeOff`.
- `src/app/login/page.tsx`
  - React Hook Form + Zod validation for email and required
    password.
  - Uses `useLogin()` and `getApiError()`.
  - Redirects based on setup/2FA response and user role.
  - Password field has a show/hide eye toggle.
- `src/app/setup-authenticator/page.tsx`
  - Uses `useSetupTwoFactor()` and `useEnableTwoFactor()`.
  - Displays QR code/manual secret, accepts a verification code,
    then displays recovery codes with a copy action.
- `src/app/verify-authenticator/page.tsx`
  - Uses `useVerifyLoginTwoFactor()` for a TOTP code or recovery
    code.
- `src/app/customer/dashboard/page.tsx`
  - Uses `useCurrentUser()` and `useLogout()`.
  - Displays user email, loading/error states, and placeholder
    appointment UI.
- `src/app/owner/dashboard/page.tsx`
  - Uses `useCurrentUser()` and `useLogout()`.
  - Redirects non-owners to the customer dashboard; this `useEffect`
    is for navigation only, not fetching.
  - Owner feature cards are placeholders marked "Coming soon".

## UI / implementation notes

- Premium ivory/stoney base with violet accents.
- Use shadcn `Button`, `Card`, `Input`, `Label`, `Alert`, `Badge`,
  `Skeleton`, `RadioGroup`, etc.
- Use `Button asChild` with Next.js `Link` for navigation controls
  where supported, avoiding nested interactive elements.
- Current booking/salon-management dashboard cards are UI
  placeholders; don't assume those APIs/features are implemented.
- `getApiError()` handles Axios response messages and structured error
  objects; use it when displaying mutation/query errors.
