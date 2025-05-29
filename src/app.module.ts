import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CourseModule } from './modules/course/course.module';
import { ModuleModule } from './modules/module/module.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RevalidateModule } from './common/revalidate/revalidate.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    RevalidateModule,
    CourseModule,
    ModuleModule,
    LessonModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
