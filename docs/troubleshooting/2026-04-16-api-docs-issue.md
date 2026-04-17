# API Docs Deferred Issue

Date: 2026-04-16

## Current status

- Business API is working:
  - `https://api.gaoge.cc/api/players` returns `200`
- Swagger UI works on the application port:
  - `http://127.0.0.1:3000/api-docs` returns `200`
- `api-docs` is still not considered fully fixed on the public entrypoint and is intentionally deferred for later follow-up.

## Important routing facts

- Global API prefix is `/api`
- Swagger route is `/api-docs`
- `https://api.gaoge.cc/player` is not a valid route
- Correct player list route is `https://api.gaoge.cc/api/players`

## Issues resolved during this session

1. GitHub Actions deployment workflow was fixed:
   - build on runner
   - sync build artifacts to server
   - provision `.env` from `DEPLOY_ENV_FILE`
   - harden remote shell environment
2. Nest dependency injection metadata issue was fixed:
   - root cause was `import type` used on runtime-injected classes
3. Database schema mismatch was fixed:
   - a destructive Prisma migration was added because the database can be reset
4. Nginx API reverse proxy was added so API traffic can reach the Nest app

## Remaining deferred issue

- Public `api-docs` access still needs a dedicated follow-up verification/fix.
- Since `http://127.0.0.1:3000/api-docs` works, the remaining problem is likely at the public ingress layer rather than the Nest Swagger setup itself.

## Most useful next checks when resuming

1. Test these endpoints again:
   - `https://api.gaoge.cc/api-docs`
   - `http://127.0.0.1:3000/api-docs`
2. Compare Nginx behavior for:
   - `/api/players`
   - `/api-docs`
3. Inspect current Nginx config:
   - `sudo nginx -T`
4. Inspect recent app logs:
   - `pm2 logs gaoge-server --lines 100`
5. If needed, verify whether Swagger static asset paths under `/api-docs/*` are being proxied correctly.

## Deployment-related commits from this debugging session

- `f9fd43b` `fix: normalize production build and deployment flow`
- `af282c4` `fix: harden remote deploy shell environment`
- `45b957e` `fix: load remote shell profiles safely`
- `5c62149` `fix: provision env file during deployment`
- `a08aae2` `fix: restore nest injection metadata`
- `59d9d25` `fix: reset prisma schema to current model`
