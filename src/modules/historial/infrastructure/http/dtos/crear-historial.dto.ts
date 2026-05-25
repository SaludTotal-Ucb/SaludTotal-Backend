import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class AfeccionDto {
  @ApiProperty({
    example: 'Hipertensión',
    description: 'Nombre o diagnóstico de la afección',
  })
  @IsString()
  @IsNotEmpty()
  problema!: string;

  @ApiProperty({
    example: 'Moderada',
    description: 'Nivel de severidad de la afección',
  })
  @IsString()
  @IsNotEmpty()
  severidad!: string;

  @ApiProperty({
    example: 'Control con Losartán 50mg diarios',
    description: 'Tratamiento o diagnóstico médico detallado',
  })
  @IsString()
  @IsNotEmpty()
  diagnostico!: string;
}

export class HttpCrearHistorialDto {
  @ApiProperty({ example: 'O+', description: 'Grupo sanguíneo del paciente' })
  @IsString()
  @IsNotEmpty()
  tipoSangre!: string;

  @ApiProperty({
    example: ['Penicilina', 'Polen'],
    description: 'Listado de alergias conocidas',
  })
  @IsArray()
  @IsString({ each: true })
  alergias!: string[];

  @ApiProperty({
    example: ['Presión arterial regular', 'Tratamiento dermatológico'],
    description: 'Tratamientos médicos en curso',
  })
  @IsArray()
  @IsString({ each: true })
  tratamientosEnCurso!: string[];

  @ApiProperty({
    type: [AfeccionDto],
    description: 'Historial de afecciones médicas del paciente',
    example: [
      {
        problema: 'Hipertensión',
        severidad: 'Moderada',
        diagnostico: 'Control con Losartán 50mg diarios',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AfeccionDto)
  afecciones!: AfeccionDto[];
}
