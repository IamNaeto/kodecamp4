import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation(() => 'mockToken'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  const existingUser = {
    id: '1',
    username: 'kodecamp',
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('signup', () => {
    it('should throw error if user already exists', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(existingUser);

      await expect(authService.signup(existingUser)).rejects.toThrow(
        new BadRequestException(
          `User with username '${existingUser.username}' already exists.`,
        ),
      );
    });

    it('should create a new user and return a token', async () => {
      const newUser = {
        username: 'kodecamp',
        password: 'password',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'hashedPassword');
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...newUser,
        id: '1',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await authService.signup(newUser);
      expect(result).toEqual({
        token: 'mockToken',
      });
    });
  });

  describe('signin', () => {
    it('should throw an error if user does not exist', async () => {
      const nonExistingUser = {
        username: 'wronguser',
        password: 'wrongpassword',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(authService.signin(nonExistingUser)).rejects.toThrow(
        new BadRequestException(`Invalid credentials.`),
      );
    });

    it('should throw error if password is incorrect', async () => {
      const mockUser = {
        username: 'kodecamp',
        password: 'password',
      };
      const hP = 'wrongPassword';

      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => hP);
      const user = {
        ...existingUser,
        password: hP,
      };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(authService.signin(mockUser)).rejects.toThrow(
        new BadRequestException(`Invalid credentials.`),
      );
    });

    it('should return a user if exists and password is correct', async () => {
      const hP = 'hashedPassword';
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => hP);
      const mockUser = {
        id: '1',
        username: existingUser.username,
        password: hP,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await authService.signin(existingUser);
      expect(result).toEqual({
        token: 'mockToken',
      });
    });
  });

  describe('updateUser', () => {
    const userId = '1';
    const updatePasswordDto = {
      currentPassword: 'currentPassword',
      newPassword: 'newPassword',
    };

    it('should throw error if currentPassword or newPassword is missing', async () => {
      await expect(authService.updateUser(userId, { currentPassword: '', newPassword: '' }))
        .rejects
        .toThrow(new BadRequestException(`Current password and new password are required.`));
    });

    it('should throw error if user is not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(authService.updateUser(userId, updatePasswordDto))
        .rejects
        .toThrow(new BadRequestException(`User not found.`));
    });

    it('should throw error if currentPassword is incorrect', async () => {
      const userWithIncorrectPassword = {
        ...existingUser,
        password: 'incorrectPassword',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithIncorrectPassword);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(authService.updateUser(userId, updatePasswordDto))
        .rejects
        .toThrow(new BadRequestException(`Current password is incorrect.`));
    });

    it('should update the password if currentPassword is correct', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(existingUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'newHashedPassword');
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
        ...existingUser,
        password: 'newHashedPassword',
      });

      const result = await authService.updateUser(userId, updatePasswordDto);
      expect(result).toEqual({ message: 'Password updated successfully.' });
    });
  });

  describe('deleteUser', () => {
    it('should throw an error if user is not found', async () => {
      const userId = 'non-existing-user-id';
    
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.user.delete = jest.fn();
    
      await expect(authService.deleteUser(userId)).rejects.toThrow(BadRequestException);
    
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    
      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });
    
  
    it('should delete the user and associated entities successfully', async () => {
      const userId = 'existing-user-id';
  
      prismaService.user.findUnique = jest.fn().mockResolvedValue({ id: userId });
      prismaService.user.delete = jest.fn().mockResolvedValue({ id: userId });
  
      const result = await authService.deleteUser(userId);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(prismaService.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
  
      expect(result).toEqual({ message: 'User and associated notes deleted successfully.' });
    });
  });
  
});
