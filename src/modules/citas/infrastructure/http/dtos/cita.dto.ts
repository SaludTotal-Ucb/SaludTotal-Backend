import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

//template para receber datos por http
export class HttpAgendarCitaDto {
  @ApiProperty({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'ID del médico con quien se agendará la cita',
  })
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @ApiProperty({
    example: '2026-05-30T10:00:00Z',
    description: 'Fecha y hora de la cita en formato ISO',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha!: string;

  @ApiProperty({
    example: 'Medicina General',
    description: 'Especialidad solicitada',
  })
  @IsString()
  @IsNotEmpty()
  especialidad!: string;

  @ApiProperty({
    example: 'Consulta rutinaria de presión arterial.',
    description: 'Notas opcionales para el médico',
    required: false,
  })
  @IsString()
  @IsOptional()
  notas?: string;
}
