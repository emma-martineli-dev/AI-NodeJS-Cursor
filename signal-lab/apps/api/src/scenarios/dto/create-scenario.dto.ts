import { IsString, IsNotEmpty } from "class-validator";

export class CreateScenarioDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
