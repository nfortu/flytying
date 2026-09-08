# Summary

FlyTying is an app for fly tying enthusiasts: keep track of the flies you need, look up tying recipes, and find what you can tie with the materials you have on hand.

# Platform architecture

FlyTying is a modular platform made of two portals sharing one backend and database:

- **User portal**: user-focused activities — browse the shared fly pattern library, author and manage your own fly patterns (recipes), and manage your material inventory. Requires authentication.
- **Admin portal**: a separate portal for admin users — CRUD operations on catalog data: brands, fly types, material categories, hooks, and materials. Requires authentication with the admin role.

Both portals talk to the same REST API and database. Authentication is JWT-based: on login the server issues a signed JWT carrying the user's id and role, and the client sends it (as a bearer token) on subsequent requests. Access to user-owned data (a user's own flies, their inventory) is restricted to the user identified by the token; access to admin CRUD endpoints requires the admin role.

# Web stack

**User portal** and **Admin portal** frontends:
- Written in TypeScript, React components, Tailwind CSS
- Unidirectional data flow
- State managed with a reducer store pattern
- MVI (Model-View-Intent) pattern

**Server**: Node.js / Express REST API, backed by a libSQL database, serving both portals.

# Seed data

The database is seeded with mock data so the app is usable end to end without manual setup: catalog data (brands, fly types, material categories, colors, hooks, materials), a handful of users (including at least one admin), and sample flies, variants, and inventories owned by those users.
