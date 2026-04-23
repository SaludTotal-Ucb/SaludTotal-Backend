import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class HttpAgendarCitaDto {
  @IsString() @IsNotEmpty() doctorId!: string;
  @IsDateString() @IsNotEmpty() fecha!: string;
  @IsString() @IsNotEmpty() especialidad!: string;
  @IsString() @IsOptional() notas?: string;
}
