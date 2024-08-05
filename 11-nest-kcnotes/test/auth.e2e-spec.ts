import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { SignupDto } from 'src/auth/dto/signup-user.dto';
import { UpdatePasswordDto } from 'src/auth/dto/update-password.dto';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should signup a new user', async () => {
    const signupDto: SignupDto = {
      username: 'test',
      password: 'password',
    };
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(signupDto)
      .expect(201);
    expect(response.body.token).toBeDefined();
  });

  it('should signin an existing user', async () => {
    const signinDto: SignupDto = {
      username: 'test',
      password: 'password',
    };
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(signinDto)
      .expect(200);
    expect(response.body.token).toBeDefined();
  });

  it('should return the current user', async () => {
    const token = await getToken();
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body.user).toBeDefined();
  });

  it('should signout', async () => {
    const token = await getToken();
    const response = await request(app.getHttpServer())
      .get('/auth/signout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body.token).toBeNull();
  });

  it('should update password', async () => {
    const token = await getToken();
    const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'password',
      newPassword: 'newPassword',
    };
    const response = await request(app.getHttpServer())
      .patch('/auth/update-password')
      .set('Authorization', `Bearer ${token}`)
      .send(updatePasswordDto)
      .expect(200);
    expect(response.body).toBeDefined();
  });

  async function getToken() {
    const signinDto: SignupDto = {
      username: 'test',
      password: 'password',
    };
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(signinDto)
      .expect(200);
    return response.body.token;
  }
});