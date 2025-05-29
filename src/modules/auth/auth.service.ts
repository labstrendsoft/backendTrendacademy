import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(body: LoginAuthDto) {
    try {
      const user = await this.usersService.findOneUser(body.email);
      const matchResult = await bcrypt.compare(body.password, user?.password ?? '');

      if (user && matchResult) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // Si el error es de usuario inactivo, lanzamos BadRequestException
      }
      if (error instanceof Error) throw new InternalServerErrorException(error.message);
    }
  }

  Login(user: LoginAuthDto) {
    const payload = { email: user.email, sub: user.id };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
