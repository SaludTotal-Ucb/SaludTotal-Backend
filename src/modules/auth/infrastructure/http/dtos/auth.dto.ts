import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

//validaciones de datos
export class HttpLoginDto {
  @ApiProperty({
    example: 'paciente.demo@saludtotal.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '12345678', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class HttpRegisterDto {
  @ApiProperty({
    example: 'Belen',
    description: 'Nombre completo del paciente',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '88888888', description: 'Cédula de identidad' })
  @IsString()
  @IsNotEmpty()
  ci!: string;

  @ApiProperty({
    example: 'prueba2@gmail.com',
    description: 'Correo electrónico',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '12345678',
    description: 'Contraseña para la nueva cuenta',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    example: '75460019',
    description: 'Número de teléfono',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
