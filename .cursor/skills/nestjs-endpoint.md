---
name: nestjs-endpoint
description: Scaffold a complete NestJS feature slice — DTO, Service, Controller, Module — wired into AppModule with observability included.
version: 1.0.0
---

# Skill: nestjs-endpoint

## When to Use
- Adding a new resource to the backend (e.g. `alerts`, `reports`, `pipelines`)
- PRD specifies a new API endpoint
- `/add-endpoint` command is invoked

## What this skill produces
- `src/[resource]/dto/create-[resource].dto.ts`
- `src/[resource]/[resource].service.ts` (with observability)
- `src/[resource]/[resource].controller.ts`
- `src/[resource]/[resource].module.ts`
- Updated `src/app.module.ts`
- Updated `prisma/schema.prisma` + migration

---

## Pre-flight — read first
Before generating, read:
- `signal-lab/apps/backend/src/app.module.ts` — current imports
- `signal-lab/prisma/schema.prisma` — current models
- `signal-lab/apps/backend/src/scenarios/` — reference implementation

Derive naming:
- `[resource]` = camelCase singular (e.g. `alert`)
- `[Resource]` = PascalCase (e.g. `Alert`)
- `[resources]` = plural (e.g. `alerts`)

---

## Step 1 — Prisma model

Add to `signal-lab/prisma/schema.prisma`:

```prisma
model [Resource] {
  id        String   @id @default(cuid())
  type      String
  status    String   @default("pending")
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Run:
```bash
npx prisma migrate dev --name add_[resource] --schema=signal-lab/prisma/schema.prisma
```

---

## Step 2 — DTO

`src/[resource]/dto/create-[resource].dto.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsObject } from 'class-validator';

export class Create[Resource]Dto {
  @ApiProperty({ example: 'default', description: '[Resource] type' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
```

---

## Step 3 — Service (with observability)

`src/[resource]/[resource].service.ts`:

```ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { Create[Resource]Dto } from './dto/create-[resource].dto';

@Injectable()
export class [Resource]Service {
  private readonly logger = new Logger([Resource]Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

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
    this.logger.log({ event: '[resource]_create_start', type: dto.type });
    const end = this.metrics.[resource]Duration.startTimer({ type: dto.type });

    try {
      const item = await this.prisma.[resource].create({ data: dto });
      this.logger.log({ event: '[resource]_created', id: item.id, type: item.type });
      this.metrics.[resource]Counter.inc({ type: dto.type, status: 'completed' });
      end();
      return item;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ event: '[resource]_create_failed', type: dto.type, error: message });
      this.metrics.[resource]Counter.inc({ type: dto.type, status: 'failed' });
      end();
      Sentry.captureException(err, { tags: { domain: '[resource]' }, extra: { dto } });
      throw err;
    }
  }
}
```

---

## Step 4 — Controller

`src/[resource]/[resource].controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { [Resource]Service } from './[resource].service';
import { Create[Resource]Dto } from './dto/create-[resource].dto';

@ApiTags('[resources]')
@Controller('[resources]')
export class [Resource]Controller {
  constructor(private readonly [resource]Service: [Resource]Service) {}

  @Get()
  @ApiOperation({ summary: 'List [resources]' })
  findAll() { return this.[resource]Service.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get [resource] by ID' })
  findOne(@Param('id') id: string) { return this.[resource]Service.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create [resource]' })
  create(@Body() dto: Create[Resource]Dto) { return this.[resource]Service.create(dto); }
}
```

---

## Step 5 — Module + AppModule

`src/[resource]/[resource].module.ts`:
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

Add to `app.module.ts` imports: `[Resource]Module`

---

## Step 6 — Gate check

```bash
curl -s -X POST http://localhost:3001/api/[resources] \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' | jq .status
# → "pending"

curl -s http://localhost:3001/api/metrics | grep [resource]_runs_total
# → metric line found
```

Then run `/check-obs` to confirm 3/3 pillars pass.
