# GhostPass Shield Server

Serverless API for GhostPass behavioral verification.

Endpoints:
- `POST /api/enroll` — enrolls or updates a user profile
- `POST /api/verify` — compares a typing sample to the profile
- `GET /api/admin/events` — admin-only event feed (requires ADMIN_TOKEN)
