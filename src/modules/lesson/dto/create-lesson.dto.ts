import { IsString, IsNotEmpty, IsOptional, IsUrl, IsNumber } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  moduleId: string; // Este es el ID del módulo al que pertenece la lección
}
