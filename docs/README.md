# Fidelo E-Bike Store System Documentation

This folder contains the maintained system documentation and regenerated diagrams for the current Fidelo E-Bike Store implementation.

## Document set

- [System documentation (PDF)](./system_documentation.pdf)
- [Prototype explanation (PDF)](./fidelo_prototype_explanation.pdf)
- [System architecture](./diagrams/fidelo-architecture.png)
- [Entity relationship diagram](./diagrams/fidelo-erd.png)
- [Role capabilities / use cases](./diagrams/fidelo-use-case.png)
- [Transfer request sequence](./diagrams/fidelo-sequence.png)
- [Inter-branch transfer activity](./diagrams/fidelo-activity.png)

## System summary

Fidelo E-Bike Store is a role-based inventory management and customer application system. A React 18 single-page application provides public, customer, branch staff, warehouse staff, and administrator workflows. An Express backend applies JWT authentication, CSRF protection, role and location rules, exposes modular domain APIs, persists records in MySQL through parameterized repository queries, stores product and profile images in MinIO, and uses Resend for account email flows.

The main inventory flow records stock by product and location, preserves every quantity change in a movement ledger, and coordinates inter-branch requests from approval through dispatch and receipt. Customers can browse the catalog and submit product applications for staff review, while notifications, reports, and authentication audit logs support day-to-day oversight.

## Regeneration

The checked-in JavaScript generator has no npm package dependency. It requires ImageMagick and a Chrome-compatible browser available as `google-chrome`:

```bash
node docs/generate-docs.js
```

### Prototype explanation PDF

Regenerate the prototype explanation PDF with a Chrome-compatible browser:

```bash
google-chrome --headless --no-sandbox --disable-gpu \
  --print-to-pdf=docs/fidelo_prototype_explanation.pdf \
  "file://$(pwd)/docs/fidelo_prototype_explanation.html"
```
