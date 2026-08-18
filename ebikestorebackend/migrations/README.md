# Database Migrations - Fidelo E-Bike Store

## Migration Strategy Overview

This project uses a lightweight, SQL-based migration runner (`src/db/migrate.js`) without heavy ORM dependencies.

### Creating New Migrations
1. Add a new `.sql` file in `ebikestorebackend/migrations/` using a sequential timestamp or numeric prefix.
   Example: `002_create_users_table.sql`
2. Write clean, idempotent MySQL 8 DDL statements. Use `IF NOT EXISTS` or standard table creation scripts.

### Executing Migrations
Run the migration script:
```bash
npm run migrate
```

Or via Docker Compose:
```bash
docker compose exec backend npm run migrate
```

The migration runner reads files in lexicographical order, tracks applied migrations in the `schema_migrations` table, and executes pending SQL statements within transactions where applicable.
