# Hook: after-schema-change

**Problem it solves:** Developers edit `prisma/schema.prisma` and forget to run the migration and regenerate the client. This causes runtime errors where the DB schema and Prisma client are out of sync — often only discovered in production.

**Trigger:** `signal-lab/prisma/schema.prisma` is saved

## What this hook does

When `schema.prisma` is modified, remind the agent to:

1. Run the migration:
```bash
npx prisma migrate dev --name describe_your_change \
  --schema=signal-lab/prisma/schema.prisma
```

2. Regenerate the Prisma client:
```bash
npx prisma generate --schema=signal-lab/prisma/schema.prisma
```

3. Check for TypeScript errors caused by the schema change:
```bash
cd signal-lab/apps/backend && npx tsc --noEmit
```

4. If a new model was added — remind to create the corresponding NestJS module:
```
New model detected. Run /add-endpoint [model-name] to scaffold the API layer.
```

## Hook config (`.cursor/hooks/after-schema-change.json`)
```json
{
  "name": "After Schema Change",
  "version": "1.0.0",
  "description": "Reminds to migrate and regenerate Prisma client after schema edits",
  "when": {
    "type": "fileEdited",
    "patterns": ["signal-lab/prisma/schema.prisma"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "The Prisma schema was just edited. Please: 1) Run `npx prisma migrate dev --name <describe_change> --schema=signal-lab/prisma/schema.prisma`, 2) Run `npx prisma generate --schema=signal-lab/prisma/schema.prisma`, 3) Check for TypeScript errors with `npx tsc --noEmit` in signal-lab/apps/backend, 4) If a new model was added, remind the user to run /add-endpoint for the new resource."
  }
}
```
