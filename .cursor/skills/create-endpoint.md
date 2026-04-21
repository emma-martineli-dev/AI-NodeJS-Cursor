# Skill: create-endpoint

**Trigger:** "create endpoint for [resource]" | "add [resource] API" | "scaffold [resource]"

Generates a complete NestJS feature slice for `[resource]` (e.g. `alerts`, `reports`).
Produces 4 files + wires into AppModule + syncs Prisma schema.

---

## Pre-flight — read these files first
- `signal-lab/apps/api/src/app.module.ts` — to know current imports
- `prisma/schema.prisma` — to know current models
- `signal-lab/apps/api/src/scenarios/` — use as the reference implementation

---

## Step 1 — Prisma model

Add to `prisma/schema.prisma`:

```prisma
model [Resource] {
  id        String   @id @default(uuid())
  name      String
  status    String   @default("pending")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run:
```bash
npx prisma db push
npx prisma generate
```

---

## Step 2 — DTO

Create `signal-lab/apps/api/src/[resource]/dto/create-[resource].dto.ts`:

```ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class Create[Resource]Dto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
```

---

## Step 3 — Service

Create `signal-lab/apps/api/src/[resource]/[resource].service.ts`:

```ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../prisma/prisma.service';
import { Create[Resource]Dto } from './dto/create-[resource].dto';

@Injectable()
export class [Resource]Service {
  private readonly logger = new Logger([Resource]Service.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.[resource].findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.[resource].findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`[Resource] ${id} not found`);
    return item;
  }

  async create(dto: Create[Resource]Dto) {
    this.logger.log({ event: '[resource]_create_start', name: dto.name });

    try {
      const item = await this.prisma.[resource].create({ data: dto });

      this.logger.log({ event: '[resource]_created', id: item.id, name: item.name });
      return item;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ event: '[resource]_create_failed', name: dto.name, error: message });
      Sentry.captureException(err, { tags: { resource: '[resource]' }, extra: { dto } });
      throw err;
    }
  }
}
```

---

## Step 4 — Controller

Create `signal-lab/apps/api/src/[resource]/[resource].controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { [Resource]Service } from './[resource].service';
import { Create[Resource]Dto } from './dto/create-[resource].dto';

@Controller('[resource]s')
export class [Resource]Controller {
  constructor(private readonly [resource]Service: [Resource]Service) {}

  @Get()
  findAll() {
    return this.[resource]Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.[resource]Service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: Create[Resource]Dto) {
    return this.[resource]Service.create(dto);
  }
}
```

---

## Step 5 — Module

Create `signal-lab/apps/api/src/[resource]/[resource].module.ts`:

```ts
import { Module } from '@nestjs/common';
import { [Resource]Controller } from './[resource].controller';
import { [Resource]Service } from './[resource].service';

@Module({
  controllers: [[Resource]Controller],
  providers: [[Resource]Service],
})
export class [Resource]Module {}
```

---

## Step 6 — Wire into AppModule

Edit `signal-lab/apps/api/src/app.module.ts` — add to `imports`:

```ts
import { [Resource]Module } from './[resource]/[resource].module';

@Module({
  imports: [PrismaModule, ScenariosModule, [Resource]Module],  // add here
  ...
})
```

---

## Step 7 — Verify

```bash
# API responds
curl -s -X POST http://localhost:3001/api/[resource]s \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}' | jq .status

# Should return "pending"
```

---

## Completion checklist
- [ ] `prisma/schema.prisma` has `[Resource]` model
- [ ] `npx prisma db push` exited 0
- [ ] DTO, Service, Controller, Module files created
- [ ] `[Resource]Module` in AppModule imports
- [ ] `POST /api/[resource]s` returns 201
- [ ] `GET /api/[resource]s` returns array
- [ ] Run `observability-check` skill on the new service
