import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(user: SignupDto): Promise<{ token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: user.username },
    });

    if (existingUser) {
      throw new BadRequestException(
        `User with username '${existingUser.username}' already exists.`,
      );
    }

    const salt = 10;
    const passwordHash = await bcrypt.hash(user.password, salt);

    const createdUser = await this.prisma.user.create({
      data: {
        ...user,
        password: passwordHash,
      },
    });

    const token = this.jwt.sign({
      id: createdUser.id,
    });

    return { token };
  }

  async signin(user: SignupDto): Promise<{ token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: user.username },
    });

    if (!existingUser) {
      throw new BadRequestException(`Invalid credentials.`);
    }

    const correctPassword = await bcrypt.compare(
      user.password,
      existingUser.password,
    );

    if (!correctPassword) {
      throw new BadRequestException(`Invalid credentials.`);
    }

    return {
      token: this.jwt.sign({
        id: existingUser.id,
      }),
    };
  }

  async updateUser(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = updatePasswordDto;
  
    if (!currentPassword || !newPassword) {
      throw new BadRequestException(`Current password and new password are required.`);
    }
  
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
  
    if (!user) {
      throw new BadRequestException(`User not found.`);
    }
  
    console.log('Current password:', currentPassword);
    console.log('User password from DB:', user.password);
  
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  
    if (!isPasswordValid) {
      throw new BadRequestException(`Current password is incorrect.`);
    }
  
    const salt = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
  
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });
  
    return { message: 'Password updated successfully.' };
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User not found.`);
    }

    // Deleting the user and cascading delete to related entities (notes)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User and associated notes deleted successfully.' };
  }
}
