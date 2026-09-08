# FlyTying platform

A modular platform for fly-tying enthusiasts: track the flies you need, look up
recipes, and find what you can tie with the materials on hand.

## Modules

The repo is an npm-workspaces monorepo under [`app/`](./app):

| Folder             | Package                   | What it is                                            |
| ------------------ | ------------------------- | ----------------------------------------------------- |
| `app/api`          | `@flytying/api`           | Node/Express REST API over a libSQL database          |
| `app/user-portal`  | `@flytying/user-portal`   | React + TS + Tailwind portal for tyers (port 5173)    |
| `app/admin-portal` | `@flytying/admin-portal`  | React + TS + Tailwind portal for admins (port 5174)   |
| `app/shared`       | `@flytying/shared`        | Shared TypeScript domain model / API contract         |

Both portals follow a **unidirectional / MVI** architecture with a small
reducer-store (`src/store`): views dispatch *intents* (thunks), effects call the
API, and reducers produce the next immutable state.

## Getting started

```bash
# 1. Install all workspace dependencies
npm install

# 2. Configure the API and seed reference data + demo users
cp app/api/.env.example app/api/.env
npm run seed --workspace app/api

# 3. Run each module (separate terminals)
npm run dev:api      # http://localhost:4000
npm run dev:user     # http://localhost:5173
npm run dev:admin    # http://localhost:5174
```

Demo logins created by the seed:

- Admin portal — `admin@flytying.dev` / `admin1234`
- User portal — `tyer@flytying.dev` / `tyer1234`

## API surface

`POST /api/auth/login`, `GET /api/auth/me`, and CRUD under `/api/brands`,
`/api/fly-categories`, `/api/material-categories`, `/api/hooks`,
`/api/materials`, `/api/flies`. Reads require authentication; reference-data
writes require the `admin` role; fly patterns are owned by their creator.

## First-iteration scope

- API: full schema, auth, and CRUD for every domain entity.
- Admin portal: manage brands, fly categories, and material categories.
- User portal: browse all patterns, view your own, and add new patterns.

Not yet built (API is ready for them): admin UI for hooks/materials, a
"what can I tie" materials-inventory matcher, and picture uploads.
