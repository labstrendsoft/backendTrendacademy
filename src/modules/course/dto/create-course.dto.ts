import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUrl,
  IsArray,
  ValidateNested,
  Validate,
  IsInt,
  IsBoolean,
  ArrayNotEmpty,
} from 'class-validator';
import { UniqueOrderValidator } from 'src/common/validators';
import { CreateModuleWithLessonsDto } from 'src/modules/module/dto/create-module.dto';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuleWithLessonsDto)
  @Validate(UniqueOrderValidator, ['modules']) // Validación para módulos
  modules: CreateModuleWithLessonsDto[];
}

export class CreateEnrollmentDto {
  @IsInt()
  userId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true }) // asegura que cada valor del array sea un string
  courseIds: string[];
}

export class UpdateProgressDto {
  @IsString()
  lessonId: string;

  @IsString()
  enrollmentId: string;

  @IsBoolean()
  completed: boolean;
}
