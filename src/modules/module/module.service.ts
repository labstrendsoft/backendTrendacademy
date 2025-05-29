import { Injectable } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}

  // Función para crear un módulo dentro de un curso
  // async createModule(createModuleDto: CreateModuleDto) {
  //   const { courseId, ...moduleData } = createModuleDto;
  //   const module = await this.prisma.module.create({
  //     data: {
  //       ...moduleData,
  //       courseId: courseId,
  //     },
  //   });

  //   return module;
  // }

  create(createModuleDto: CreateModuleDto) {
    return 'This action adds a new module';
  }

  findAll() {
    return `This action returns all module`;
  }

  findOne(id: number) {
    return `This action returns a #${id} module`;
  }

  update(id: number, updateModuleDto: UpdateModuleDto) {
    return `This action updates a #${id} module`;
  }

  remove(id: number) {
    return `This action removes a #${id} module`;
  }
}
