import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDtoValidation } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('/register')
  async Register(@Body() body: CreateUserDtoValidation) {
    return this.usersService.create(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  Login(@Request() req) {
    return this.authService.Login(req.user);
  }
}
