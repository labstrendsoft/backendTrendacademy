import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(25, { message: 'La contraseña no debe exceder los 25 caracteres' })
  password: string;

  @IsOptional()
  @IsInt({ message: 'El id debe ser un número entero' })
  id?: number; // O si es string, puedes usar @IsString() en vez de @IsInt()
}
