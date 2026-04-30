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
}
