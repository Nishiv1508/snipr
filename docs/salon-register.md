Suggested implementation order

1. Database and backend: Prisma models, migrations, validation, salon CRUD and ownership checks.
2. Owner salon list: Replace the owner dashboard placeholders with a salon overview and an “Add Salon” action.
3. Create and edit forms: Implement salon details, services, Google Maps link and weekly opening hours.
4. Publishing workflow: Add draft, published and unpublished states with server-side validation.
5. Customer discovery: Build public salon listing and detail pages that show only published salons.

Method Endpoint Access
POST /api/v1/salons Owner
GET /api/v1/salons/mine Owner
GET /api/v1/salons/:id Owning user
PATCH /api/v1/salons/:id Owning user
POST /api/v1/salons/:id/publish Owner
POST /api/v1/salons/:id/unpublish Owner
GET /api/v1/public/salons Public
GET /api/v1/public/salons/:id Public
