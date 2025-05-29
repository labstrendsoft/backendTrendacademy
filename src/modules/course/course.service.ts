import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto, UpdateProgressDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from 'src/prisma.service';
import { Enrollment } from '@prisma/client';
import { RevalidateService } from 'src/common/revalidate/revalidate.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidateService: RevalidateService,
  ) {}

  // Actualizar o crear progreso de lección
  async updateProgress(updateProgressDto: UpdateProgressDto) {
    const { lessonId, completed, enrollmentId } = updateProgressDto;

    const progress = await this.prisma.progress.upsert({
      where: {
        lessonId_enrollmentId: { lessonId, enrollmentId },
      },
      update: completed ? { completedAt: new Date() } : {}, // no actualices completedAt si no está completado
      create: {
        lessonId,
        enrollmentId,
        completedAt: completed ? new Date() : undefined, // undefined está permitido aquí
      },
    });

    return progress;
  }

  // ────────────────────────────────
  // 🟢 1. CREACIÓN DE CURSOS CON MÓDULOS Y LECCIONES
  // ────────────────────────────────
  async createCourseWithModulesAndLessons(createCourseDto: CreateCourseDto) {
    const { modules, ...courseData } = createCourseDto;

    const result = await this.prisma.$transaction(async (prisma) => {
      const course = await prisma.course.create({
        data: {
          ...courseData,
          published: false,
        },
      });

      for (const moduleData of modules) {
        const { lessons, ...moduleInfo } = moduleData;

        const module = await prisma.module.create({
          data: {
            ...moduleInfo,
            courseId: course.id,
          },
        });

        for (const lessonData of lessons) {
          await prisma.lesson.create({
            data: {
              ...lessonData,
              moduleId: module.id,
            },
          });
        }
      }

      return course;
    });

    return result;
  }

  //obtener cursos disponibles de cada usuario
  async findCoursesNotEnrolled(userId: number) {
    const courses = await this.prisma.course.findMany({
      where: {
        enrollments: {
          none: {
            userId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        published: true,
        authorName: true,
        price: true,
        _count: {
          select: {
            modules: true,
          },
        },
      },
    });

    return courses.map(({ _count, ...rest }) => ({
      ...rest,
      moduleCount: _count.modules,
    }));
  }

  //obtener cursos recientes

  async findRecentCourses() {
    const cursos = await this.prisma.course.findMany({
      take: 3, // solo 3 cursos
      orderBy: {
        createdAt: 'desc', // ordena por los más recientes
      },
      where: {
        published: true, // opcional: solo cursos publicados
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        published: true,
        authorName: true,
        price: true,
        _count: {
          select: {
            modules: true,
          },
        },
      },
    });

    this.revalidateService.revalidate('/cursos-disponibles');

    return cursos.map(({ _count, ...rest }) => ({
      ...rest,
      moduleCount: _count.modules,
    }));
  }

  // ────────────────────────────────
  // 📘 2. OBTENER CURSOS
  // ────────────────────────────────
  async findAll() {
    const cursos = await this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        published: true,
        authorName: true,
        price: true,
        _count: {
          select: {
            modules: true, // Cuenta cuántos módulos tiene cada curso
          },
        },
      },
    });

    // Transformamos el resultado para que tenga moduleCount en lugar de _count
    return cursos.map(({ _count, ...rest }) => ({
      ...rest,
      moduleCount: _count.modules,
    }));
  }

  // course.service.ts
  findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
  }

  // ────────────────────────────────
  // 🎓 3. INSCRIPCIONES
  // ────────────────────────────────

  // Obtener inscripciones activas de un usuario
  async getUserEnrollments(userId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        canceled: false,
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true, title: true }, // Seleccionamos el ID y el título
                },
              },
            },
          },
        },
        progresses: {
          select: {
            lessonId: true,
          },
        },
      },
    });

    return enrollments.map((enrollment) => {
      // Obtener todas las lecciones del curso
      const allLessons = enrollment.course.modules.flatMap((mod) => mod.lessons);
      const totalLessons = allLessons.length;
      const completedLessons = enrollment.progresses.length;

      const progressPercentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Obtener el ID de la primera lección (si existe)
      const firstLessonId = allLessons.length > 0 ? allLessons[0].id : null;

      this.revalidateService.revalidate('/misCursos');

      // Devuelve todos los campos + el progreso calculado y el ID de la primera lección
      return {
        ...enrollment,
        progress: progressPercentage,
        firstLessonId, // Agregamos el ID de la primera lección
        // Opcional: eliminar los arrays innecesarios para no sobrecargar la respuesta
        progresses: undefined,
        course: {
          ...enrollment.course,
          modules: undefined, // opcional, puedes eliminar los módulos y lecciones si no los necesitas
        },
      };
    });
  }

  //preview de obtener incripciones
  async getUserEnrollmentsPreview(userId: number, limit = 3) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        canceled: false,
      },
      take: limit,
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true }, // Solo seleccionamos el ID de la lección
                },
              },
            },
          },
        },
        progresses: {
          select: {
            lessonId: true,
          },
        },
      },
    });

    return enrollments.map((enrollment) => {
      // Obtener todas las lecciones del curso
      const allLessons = enrollment.course.modules.flatMap((mod) => mod.lessons);
      const totalLessons = allLessons.length;
      const completedLessons = enrollment.progresses.length;

      const progressPercentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Obtener el ID de la primera lección (si existe)
      const firstLessonId = allLessons.length > 0 ? allLessons[0].id : null;

      this.revalidateService.revalidate('/inicio');

      // Devolver todos los campos + el progreso calculado y el ID de la primera lección
      return {
        ...enrollment,
        progress: progressPercentage,
        firstLessonId, // Agregar el ID de la primera lección
        progresses: undefined, // Eliminar los progresos si no los necesitas
        course: {
          ...enrollment.course,
          modules: undefined, // Eliminar los módulos si no los necesitas
        },
      };
    });
  }

  // crear inscripcion
  async createManyEnrollments(userId: number, courseIds: string[]) {
    const results: Enrollment[] = [];

    for (const courseId of courseIds) {
      const existing = await this.prisma.enrollment.findFirst({
        where: { userId, courseId },
      });

      if (existing) {
        if (existing.canceled) {
          const updated = await this.prisma.enrollment.update({
            where: { id: existing.id },
            data: { canceled: false },
          });
          results.push(updated);
          continue;
        }
        continue; // ya inscrito y no cancelado, lo ignoramos
      }

      const created = await this.prisma.enrollment.create({
        data: { userId, courseId },
      });

      results.push(created);
    }

    return results;
  }

  //cancelar isncripcion
  // async cancelEnrollment(userId: number, courseId: string) {
  //   const enrollment = await this.prisma.enrollment.findFirst({
  //     where: { userId, courseId, canceled: false },
  //   });

  //   if (!enrollment) {
  //     throw new NotFoundException('Inscripción no encontrada.');
  //   }

  //   return this.prisma.enrollment.update({
  //     where: { id: enrollment.id },
  //     data: { canceled: true },
  //   });
  // }

  // ────────────────────────────────
  // 🎥 4. OBTENER LECCIÓN CON CONTEXTO (curso y módulo)
  // ────────────────────────────────

  //obtener leccion
  async findLessonWithContext(courseId: string, lessonId: string, userId: string) {
    // 1. Buscar la lección con contexto (módulo y curso)
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) throw new NotFoundException('Lección no encontrada');

    // 2. Obtener todos los módulos del curso y sus lecciones
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // 3. Calcular total de lecciones del curso
    const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);

    // 4. Obtener el enrollment del usuario para ese curso
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: Number(userId),
        courseId,
      },
    });

    let completedLessons = 0;

    if (enrollment) {
      // 5. Contar cuántas lecciones ha completado ese usuario
      completedLessons = await this.prisma.progress.count({
        where: {
          enrollmentId: enrollment.id,
        },
      });
    }

    // 6. Calcular porcentaje
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // 7. Lista plana de todas las lecciones del curso
    const allLessons = modules.flatMap((m) => m.lessons);

    // 8. Buscar índice de la lección actual
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);

    // 9. Obtener las lecciones anterior y siguiente (si existen)
    const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        order: lesson.order,
      },
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        order: lesson.module.order,
      },
      course: {
        id: lesson.module.course.id,
        title: lesson.module.course.title,
        description: lesson.module.course.description,
        imageUrl: lesson.module.course.imageUrl,
        authorName: lesson.module.course.authorName,
      },
      modules,
      progress: progressPercentage, // aquí está el porcentaje
      previousLesson: previousLesson?.id ?? null,
      nextLesson: nextLesson?.id ?? null,
    };
  }

  create(createCourseDto: CreateCourseDto) {
    return 'This action adds a new course';
  }

  // findAll() {
  //   return `This action returns all course`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} course`;
  // }

  update(id: number, updateCourseDto: UpdateCourseDto) {
    return `This action updates a #${id} course`;
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
