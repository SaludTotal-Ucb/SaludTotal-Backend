//son como la plantilla de lo que se espera que envien los usuarios
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  ci: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  bloodType?: string;
  address?: string;
  emergencyContact?: string;
}
