import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SignupDto } from './dto/signup-user.dto';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { JwtAuthGuard } from './auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  async signup(@Body() user: SignupDto): Promise<{ token: string }> {
    return await this.authService.signup(user);
  }

  @Post('signin')
  async signin(@Body() user: SignupDto): Promise<{ token: string }> {
    return await this.authService.signin(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = (req as any).user;
    return { user };
  }

  @Get('signout')
  @UseGuards(JwtAuthGuard)
  async signout() {
    return {
      token: null,
    };
  }

  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(@Req() req: Request, @Body() updatePasswordDto: UpdatePasswordDto) {
    const user = (req as any).user;
    return this.authService.updateUser(user.id, updatePasswordDto);
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Req() req: Request): Promise<{ message: string }> {
    const user = (req as any).user;
    return this.authService.deleteUser(user.id);
  }
}
