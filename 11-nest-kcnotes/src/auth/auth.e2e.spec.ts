import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { SignupDto } from './dto/signup-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn((user: SignupDto) => ({ token: 'test-token' })),
    signin: jest.fn((user: SignupDto) => ({ token: 'test-token' })),
    updateUser: jest.fn((userId: string, dto: UpdatePasswordDto) => ({ success: true })),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Mocking the JwtAuthGuard
    jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation(mockJwtAuthGuard.canActivate);
  });

  describe('signup', () => {
    it('should return a token', async () => {
      const signupDto: SignupDto = { username: 'testuser', password: 'password' };
      const result = await authController.signup(signupDto);
      expect(result).toEqual({ token: 'test-token' });
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('signin', () => {
    it('should return a token', async () => {
      const signinDto: SignupDto = { username: 'testuser', password: 'password' };
      const result = await authController.signin(signinDto);
      expect(result).toEqual({ token: 'test-token' });
      expect(authService.signin).toHaveBeenCalledWith(signinDto);
    });
  });

  describe('me', () => {
    it('should return user information', async () => {
      const user = { id: 'user-id', username: 'testuser' };
      const req = { user } as any;
      const result = await authController.me(req as Request);
      expect(result).toEqual({ user });
    });
  });

  describe('updatePassword', () => {
    it('should update the user password', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'password',
        newPassword: 'newpassword',
      };
      const user = { id: 'user-id' };
      const req = { user } as any;
      const result = await authController.updatePassword(req as Request, updatePasswordDto);
      expect(result).toEqual({ success: true });
      expect(authService.updateUser).toHaveBeenCalledWith(user.id, updatePasswordDto);
    });
  });

  describe('signout', () => {
    it('should return null token', async () => {
      const result = await authController.signout();
      expect(result).toEqual({ token: null });
    });
  });
});
