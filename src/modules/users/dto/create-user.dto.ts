import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDtoValidation {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(25, { message: 'La contraseña no debe exceder los 25 caracteres' })
  password: string;
}
