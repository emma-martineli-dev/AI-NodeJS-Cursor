import { Body, Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScenariosService } from './scenarios.service';
import { RunScenarioDto } from './dto/run-scenario.dto';

@ApiTags('scenarios')
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  @ApiOperation({ summary: 'List recent scenario runs' })
  findAll() {
    return this.scenariosService.findAll();
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger a scenario run' })
  @ApiResponse({ status: 200, description: 'Run accepted', schema: {
    example: { id: 'clxxx...', status: 'pending', createdAt: '2026-04-22T...' }
  }})
  run(@Body() dto: RunScenarioDto) {
    return this.scenariosService.run(dto);
  }
}
