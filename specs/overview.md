# Summary

FlyTying is an app for fly tying enthusiasts: keep track of the flies you need, look up tying recipes, and find what you can tie with the materials you have on hand.

# Platform architecture

FlyTying is a modular platform made of two portals sharing one backend and database:

- **User portal**: user-focused activities — browse the fly pattern library and author and manage your own fly patterns (recipes). Requires authentication. (A material-inventory feature is planned but not built — see [domain model](./domain-model.md#not-yet-implemented).)
- **Admin portal**: a separate portal for admin users — CRUD operations on catalog data. The API supports brands, fly categories, material categories, hooks, and materials; the admin UI currently covers brands, fly categories, material categories, and materials (a hooks admin UI is not built yet). Requires authentication with the admin role.

Both portals talk to the same REST API and database. Authentication is JWT-based: on login the server issues a signed JWT carrying the user's id, email, and role, and the client sends it (as a bearer token) on subsequent requests. Every endpoint requires a valid token. Any authenticated user can read all catalog data and all flies; writing a fly is restricted to its owner (or an admin), and admin CRUD endpoints on catalog data require the admin role.

# Web stack

**User portal** and **Admin portal** frontends:
- Written in TypeScript, React components, Tailwind CSS
- Unidirectional data flow
- State managed with a reducer store pattern
- MVI (Model-View-Intent) pattern

**Server**: Node.js / Express REST API, backed by a libSQL database, serving both portals.

# Seed data

The seed script (`npm run seed --workspace app/api`) inserts the core reference
data plus demo logins: brands, fly categories, material categories, and two
users — an admin (`admin@flytying.dev`) and a regular user (`tyer@flytying.dev`).

It does **not** yet seed colors, hooks, materials, or sample flies/variants, so
those are created through the portals rather than preloaded.
