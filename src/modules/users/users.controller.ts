import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateCredencialesUserDto, UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDtoValidation } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDtoValidation) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Obtener las credenciales del usuario
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.getUserById(+id); // +id convierte el parámetro a número
  }

  // Actualizar las credenciales del usuario (email, password, role)
  @Patch('/me')
  async updateCredentials(@Request() req, @Body() updateUserDto: UpdateCredencialesUserDto) {
    // Actualiza las credenciales del usuario
    return await this.usersService.updateUserCredentials(req.user.userId, updateUserDto);
  }

  //Actualizar perfil de usuario
  @Patch('/profile/me')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateUserProfileDto) {
    return await this.usersService.updateUserProfile(req.user.userId, updateProfileDto);
  }

  // Obtener el perfil del usuario
  @Get('/profile/me')
  async getProfile(@Request() req) {
    return await this.usersService.getUserProfile(req.user.userId);
  }

  @Patch(':id/active')
  async toggleUserActiveState(@Param('id') id: number, @Body('isActive') isActive: boolean) {
    return this.usersService.toggleUserActiveState(id, isActive);
  }

  //referencial no se usa
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
