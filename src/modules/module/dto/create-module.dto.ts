import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, Validate } from 'class-validator';
import { UniqueOrderValidator } from 'src/common/validators';
import { CreateLessonDto } from 'src/modules/lesson/dto/create-lesson.dto';

export class CreateModuleDto {
  // @IsString()
  // @IsNotEmpty()
  // title: string;
  // @IsNumber()
  // order: number;
  // @IsString()
  // @IsNotEmpty()
  // courseId: string;
}

export class CreateModuleWithLessonsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  order: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  @Validate(UniqueOrderValidator, ['lessons']) // Validación para lecciones dentro de un módulo
  lessons: CreateLessonDto[];
}
