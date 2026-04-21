import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class RunScenarioDto {
  @ApiProperty({ example: 'load_test', description: 'Scenario type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Optional metadata for the run' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
