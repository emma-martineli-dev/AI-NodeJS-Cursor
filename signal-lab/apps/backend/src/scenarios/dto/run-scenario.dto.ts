import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';

export class RunScenarioDto {
  @ApiProperty({
    example: 'success',
    description: 'Scenario type',
    enum: ['success', 'validation_error', 'system_error', 'slow_request', 'teapot', 'chaos_monkey'],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ example: 'My test run', description: 'Optional run name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Optional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
