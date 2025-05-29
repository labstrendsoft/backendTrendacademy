import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCredencialesUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDtoValidation } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  //para buscar el usuario al loguearse
  async findOneUser(email: string) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { email },
      });

      if (!user) {
        return null; // Si no se encuentra el usuario, retornar null
      }

      // Si el usuario está inactivo, lanzar un error con mensaje personalizado
      if (!user.isActive) {
        throw new BadRequestException(
          'Tu cuenta está desactivada. Por favor, contacta al administrador.',
        );
      }

      return user; // Si el usuario está activo, devolverlo
    } catch (error) {
      // Si la excepción es de tipo BadRequestException, la lanzamos de nuevo
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Si la excepción es de tipo NotFoundException, la lanzamos también
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Para cualquier otro error, lanzar un InternalServerErrorException
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  // Crear usuario
  async create(createUserDto: CreateUserDtoValidation) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('El correo ya está en uso');
    }
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10); // 10 es el saltRounds

    // Crear el usuario con la contraseña encriptada
    return this.prismaService.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword, // Usamos la contraseña encriptada
      },
    });
  }

  // Listar usuarios

  findAll() {
    return this.prismaService.user.findMany({
      where: { isActive: true },
    });
  }

  // Obtener credenciales de usuario
  async getUserById(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  // Actualizar credenciales de usuario
  async updateUserCredentials(userId: number, updateUserDto: UpdateCredencialesUserDto) {
    const updateData: any = {};

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      if (!updateUserDto.currentPassword) {
        throw new BadRequestException('Debes proporcionar la contraseña actual para cambiarla');
      }

      const currentUser = await this.prismaService.user.findUnique({ where: { id: userId } });
      if (!currentUser?.password) {
        throw new BadRequestException('Usuario inválido o sin contraseña registrada');
      }

      const isValid = await bcrypt.compare(updateUserDto.currentPassword, currentUser.password);
      if (!isValid) {
        throw new BadRequestException('Contraseña actual incorrecta');
      }

      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  // Obtener el perfil del usuario
  getUserProfile(userId: number) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
  }

  // Actualizar el perfil del usuario(por el momento asi lo ideal es separar la logica y crear un create profile)
  async updateUserProfile(userId: number, updateProfileDto: UpdateUserProfileDto) {
    const dataToUpdate: any = {};

    // Validación y preparación de los datos a actualizar
    if (updateProfileDto.dateOfBirth) {
      dataToUpdate.dateOfBirth = updateProfileDto.dateOfBirth;
    }

    if (updateProfileDto.firstName) {
      dataToUpdate.firstName = updateProfileDto.firstName;
    }
    if (updateProfileDto.lastName) {
      dataToUpdate.lastName = updateProfileDto.lastName;
    }
    if (updateProfileDto.avatarUrl) {
      dataToUpdate.avatarUrl = updateProfileDto.avatarUrl;
    }
    if (updateProfileDto.address) {
      dataToUpdate.address = updateProfileDto.address;
    }
    if (updateProfileDto.phoneNumber) {
      dataToUpdate.phoneNumber = updateProfileDto.phoneNumber;
    }

    try {
      // Verificar si el usuario ya tiene un perfil
      const userProfile = await this.prismaService.userProfile.findFirst({
        where: { user: { id: userId } },
      });

      if (userProfile) {
        // Si el perfil existe, actualizar
        await this.prismaService.userProfile.update({
          where: { id: userProfile.id }, // Buscar por ID de perfil
          data: dataToUpdate,
        });
      } else {
        // Si no existe, crear un nuevo perfil
        await this.prismaService.userProfile.create({
          data: {
            user: {
              connect: { id: userId }, // Relaciona el perfil con el usuario
            },
            ...dataToUpdate,
          },
        });
      }

      return { message: 'Perfil actualizado correctamente' };
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      throw new InternalServerErrorException('Hubo un problema al actualizar el perfil');
    }
  }

  async toggleUserActiveState(id: number, isActive: boolean) {
    const user = await this.prismaService.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    return this.prismaService.user.update({
      where: { id },
      data: { isActive },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
