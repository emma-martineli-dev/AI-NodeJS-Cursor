import { Body, Controller, Get, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { ScenariosService } from "./scenarios.service";
import { CreateScenarioDto } from "./dto/create-scenario.dto";

@Controller("scenarios")
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  findAll() {
    return this.scenariosService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(dto);
  }
}
