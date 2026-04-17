import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DiagnosticoSeveridad, HistorialStatus } from '../enums/historial.enum';

export class RecetaDto {
  @IsString() medicamento!: string;
  @IsString() dosis!: string;
  @IsString() frecuencia!: string;
  @IsOptional() @IsString() indicaciones?: string;
  @IsOptional() duracion_dias?: number;
}

export class EvolucionDto {
  @IsString() observaciones!: string;
  @IsString() estado_fisico!: string;
}

export class CreateHistorialDto {
  @IsString() paciente_id!: string;
  @IsString() @MinLength(3) diagnostico!: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsEnum(DiagnosticoSeveridad) severidad!: DiagnosticoSeveridad;
  @IsString() medico_encargado!: string;
  @IsOptional() @IsString() tratamiento?: string;
  @IsOptional() @IsString() proxima_cita?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaDto)
  @IsOptional()
  recetas?: RecetaDto[];
}

export class FiltrosHistorialDto {
  @IsOptional() @IsEnum(HistorialStatus) status?: HistorialStatus;
  @IsOptional() @IsEnum(DiagnosticoSeveridad) severidad?: DiagnosticoSeveridad;
  @IsOptional() @IsString() medico_encargado?: string;
}
