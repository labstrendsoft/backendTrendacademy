import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto, CreateEnrollmentDto, UpdateProgressDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('course')
@ApiTags('Cursos')
@UseGuards(JwtAuthGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Patch('progress')
  async updateProgress(@Body() updateProgressDto: UpdateProgressDto) {
    return this.courseService.updateProgress(updateProgressDto);
  }

  // crear inscripcion
  @Post('enroll')
  createManyEnrollments(@Body() body: CreateEnrollmentDto) {
    const { userId, courseIds } = body;
    return this.courseService.createManyEnrollments(userId, courseIds);
  }

  // //cancelar inscripcion
  // @Delete('enroll')
  // cancelEnrollment(@Body() dto: CreateEnrollmentDto) {
  //   return this.courseService.cancelEnrollment(dto.userId, dto.courseId);
  // }
  @Get('available/:userId')
  getAvailableCourses(@Param('userId', ParseIntPipe) userId: number) {
    return this.courseService.findCoursesNotEnrolled(userId);
  }

  @Get('enrollments/:userId')
  getUserEnrollments(@Param('userId', ParseIntPipe) userId: number) {
    return this.courseService.getUserEnrollments(userId);
  }

  // Obtener preview de mis cursos
  @Get('enrollments/:userId/preview')
  getUserEnrollmentsPreview(@Param('userId') userId: number, @Query('limit') limit?: string) {
    return this.courseService.getUserEnrollmentsPreview(userId, limit ? Number(limit) : 3);
  }

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.createCourseWithModulesAndLessons(createCourseDto);
  }

  //Obtener cursos recientes
  @Get('recent')
  @Public()
  getRecentCourses() {
    return this.courseService.findRecentCourses();
  }

  @Get()
  @Public()
  findAll() {
    return this.courseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Get(':courseId/lesson/:lessonId/user/:userId')
  async findLessonWithContext(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('userId') userId: string, // Recibiendo el userId desde la URL
  ) {
    return this.courseService.findLessonWithContext(courseId, lessonId, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(+id);
  }
}
