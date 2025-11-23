# Efficio Backend (MongoDB + Express)

## Setup

1. Copy `.env.example` to `.env` and set your MongoDB URI and Auth0 values.

```bash
cp .env.example .env
# edit .env and set AUTH0_DOMAIN and AUTH0_AUDIENCE
pnpm install
pnpm dev
```

2. API is available at `http://localhost:4000/` and Swagger UI at `http://localhost:4000/api-docs`.

## Auth

The backend validates Auth0 access tokens for protected routes. Set these environment variables in `.env`:

- AUTH0_DOMAIN (e.g. dev-xxx.us.auth0.com)
- AUTH0_AUDIENCE (the API audience configured in Auth0)
- AUTH0_ISSUER (optional)

## Endpoints added

- GET /api/users/me
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/profile/picture
- POST /api/users/deactivate
- DELETE /api/users/account

## Tests

Run `pnpm test` to execute unit/integration tests. Tests use `NODE_ENV=test`.

## OpenAPI

An OpenAPI spec is available in `openapi.yaml`. Validate with:

```bash
pnpm exec swagger-cli validate openapi.yaml
```