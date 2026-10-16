# Snipr Frontend --- Chat Handoff

## Stack and conventions

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui,
  Lucide icons.
- Server state: TanStack Query; use existing custom hooks for API
  calls, not `useEffect` for fetching.
- API client: existing Axios instance with cookie credentials and auth
  refresh handling.
- Prefer existing components, types, API functions, and hooks; merge
  changes instead of duplicating them.
- Styling preference: polished ivory/violet UI with shadcn/ui and
  Tailwind.

## Salon API and data

- Public endpoints:
  - `GET /api/v1/public/salons` → `{ data: PublicSalon[] }`
  - `GET /api/v1/public/salons/:id` → `{ data: PublicSalon }`
- Use public endpoints for customer-facing salon discovery.
- Public salon data includes profile/location fields, `services`
  (including `isActive`, `durationMin`, `price`) and `hours` (`day`,
  `opensAt`, `closesAt`, `isClosed`).
- Existing API/types are in `src/lib/api/salon.api.ts`; existing salon
  hooks are in `src/hooks/use-salons.ts`.
- Existing public hooks: `usePublicSalons()` and `usePublicSalon(id)`.
- Ensure imports match the actual Axios export and existing `WeekDay`
  type.

## Customer salon pages

- Listing page: `src/app/customer/salons/page.tsx`
  - Displays all public salons; **search functionality was
    removed**.
  - Has loading skeletons, API error/retry state, empty state, salon
    count, and responsive card grid.
  - Uses `CustomerNavbar` and `SalonCard`.
- Detail page: `src/app/customer/salons/[id]/page.tsx`
  - Uses `usePublicSalon(id)`.
  - Displays salon details, location, optional Google Maps link,
    active services with price/duration, and weekly opening hours.
- Reusable card: `src/components/customers/SalonCard.tsx`
  - Default export `SalonCard`, accepts `{ salon: PublicSalon }`.
  - Links to `/customer/salons/${salon.id}` and displays
    image/fallback, name, address, description, active service
    count.
- Customer navbar: `src/components/customers/CustomerNavbar.tsx`
  - Default export `CustomerNavbar`; Snipr logo and Explore salons
    link.
  - Includes Logout using existing `useLogout()` mutation.
  - Logout clears TanStack Query cache via hook `onSettled`;
    redirects to `/login` on success.
  - Confirm the `useLogout` import path and actual login route in
    the project.

## Owner area

- Owner dashboard route is `/owner/dashboard` (not `/owner/dasboard`).
- Existing owner navbar: `src/components/owner/navbar.tsx`.
- Owner salon card: `src/components/owner/salon-card.tsx`.
- Existing owner hooks in `src/hooks/use-salons.ts`: `useMySalons`,
  `useCreateSalon`, `useSalon`, `useUpdateSalon`, `usePublishSalon`,
  `useUnpublishSalon`.
- Owner pages:
  - `src/app/owner/dashboard/page.tsx`
  - `src/app/owner/salons/new/page.tsx`

## Shared protected routes (latest work)

- Intended reusable component:
  `src/components/auth/ProtectedRoute.tsx`.
- It uses `useCurrentUser()` from the existing auth hooks and accepts
  `allowedRole: "OWNER" | "CUSTOMER"`.
- Intended layouts:
  - `src/app/customer/layout.tsx` wraps children in
    `<ProtectedRoute allowedRole="CUSTOMER">`.
  - `src/app/owner/layout.tsx` wraps children in
    `<ProtectedRoute allowedRole="OWNER">`.
- Expected behavior: logged-out users → `/login`; wrong role → own
  dashboard (`OWNER` → `/owner/dashboard`, `CUSTOMER` →
  `/customer/dashboard`); only matching role renders children.
- **Verify before continuing:** `useCurrentUser()` data shape/import
  path, whether `/customer/dashboard` exists, and exact backend role
  strings. The prior implementation redirects `ADMIN`/unknown roles to
  `/login`.
- Frontend route protection is not API security; enforce permissions
  on backend endpoints too.
- Avoid rendering the same navbar twice if pages already include it
  and layouts later add it.

## Recent UI fix

- For a back button with arrow and text on one line, user does **not**
  want `asChild`.
- Use a button with `inline-flex flex-row items-center gap-2` and
  `useRouter().push(...)`; declare the router hook inside the page
  component.

## Next-chat instructions

- Start with the feature the user requests.
- Inspect existing implementations before replacing them; preserve
  current routes, types, and hooks.
- Do not reintroduce search on the customer salon listing unless
  explicitly requested.
