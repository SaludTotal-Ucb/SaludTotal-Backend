import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class AfeccionDto {
  @IsString() @IsNotEmpty() problema!: string;
  @IsString() @IsNotEmpty() severidad!: string;
  @IsString() @IsNotEmpty() diagnostico!: string;
}

export class HttpCrearHistorialDto {
  @IsString() @IsNotEmpty() tipoSangre!: string;
  @IsArray() @IsString({ each: true }) alergias!: string[];
  @IsArray() @IsString({ each: true }) tratamientosEnCurso!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AfeccionDto)
  afecciones!: AfeccionDto[];
}
