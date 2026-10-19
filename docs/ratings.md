## API endpoints

Method Endpoint Purpose
POST /api/v1/ratings Create or update a rating
GET /api/v1/ratings/mine?salonId=... Fetch the customer's rating for a salon
GET /api/v1/public/salons Include average rating and rating count in salon listings
GET /api/v1/public/salons/:id Include average rating and count in salon details

## Frontend integration

Following your existing Next.js App Router and TanStack Query conventions:

- src/lib/api/rating.api.ts — rating API functions and TypeScript types.
- src/hooks/use-ratings.ts — hooks for submitting and retrieving a customer's rating.
- src/components/customers/StarRating.tsx — reusable interactive star-rating component.
- src/components/customers/SalonCard.tsx — display average rating and count.
- src/app/customer/salons/[id]/page.tsx — show the average and allow the customer to rate the salon.

## Implementation order

1. Add the Prisma model and migration.
2. Implement rating validation, service, repository and controller.
3. Add the rating routes and authorization.
4. Extend the existing public salon responses with average rating and count.
5. Add frontend API functions, hooks and the star-rating component.
6. Update salon cards and detail pages.
