Proposed endpoints
Method Endpoint Purpose
GET /api/v1/public/salons/:id/slots?date=... List available slots
POST /api/v1/bookings Create a booking
GET /api/v1/bookings/me List customer's bookings
GET /api/v1/bookings/:id/ticket Download ticket PDF
POST /api/v1/bookings/:id/cancel Cancel a booking
GET /api/v1/owner/bookings View salon bookings
POST /api/v1/owner/bookings/:id/verify Verify a ticket key
All owner endpoints must validate ownership on the backend, and customer endpoints must restrict access to the authenticated customer's own bookings.

Implementation order

1. Database and capacity logic: Define slot and booking models, migrations, atomic reservations and cancellation transactions.
2. Backend APIs: Add availability, booking, cancellation, ticket and owner-management endpoints.
3. Ticket generation: Generate the PDF and securely handle the verification key.
4. Customer UI: Add slot selection and the customer's bookings page.
5. Owner UI: Add booking management and ticket verification.
6. Testing: Test simultaneous bookings for the final seat, repeated cancellations, duplicate requests, unauthorized access and PDF-generation failures.

## Execution phase

Booking validation — verify the customer session, published salon, active service, valid slot, and capacity.

Booking repository — implement Prisma transactions and conditional capacity updates to prevent overbooking.

Booking service and controller — handle reservation creation, cancellation, and error responses.

Ticket generation — generate the private key, encrypt it for secure retrieval, hash it for verification, and create the PDF.

Routes and tests — protect customer and owner endpoints and test concurrent bookings and cancellation races.
