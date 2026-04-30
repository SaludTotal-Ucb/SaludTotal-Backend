import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HttpLoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class HttpRegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  ci!: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
