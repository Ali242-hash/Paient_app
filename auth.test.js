const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const sequelize = db.dbHandler;
const { User } = db;

const app = express();
app.use(express.json());
const authRouter = require('./routers/auth');
app.use('/auth', authRouter);

beforeAll(async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error('Database sync failed:', error);
    process.exit(1);
  }
});

describe('Auth Routes', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    
    testUser = await User.create({
      fullname: 'Test User',
      email: 'test@user.com',
      username: 'testuser',
      password: '$2a$10$hashedpasswordplaceholder', 
      role: 'patient',
      active: true
    });
  });

  describe('POST /auth/login', () => {
    test('should return 400 for missing credentials', async () => {
      const response = await supertest(app)
        .post('/auth/login')
        .send({ username: '', password: '' });
      
      expect(response.status).toBe(400);
    });

    test('should return 200 with token for valid credentials', async () => {
      const response = await supertest(app)
        .post('/auth/login')
        .send({ 
          username: 'testuser', 
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });
  });

  describe('PUT /auth/update', () => {
    test('should return 200 when credentials are updated', async () => {
      const response = await supertest(app)
        .put('/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
          confirmNewPassword: 'newpassword123'
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Auth Middleware', () => {
    test('should return 401 for invalid token', async () => {
      const response = await supertest(app)
        .get('/auth/me') 
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(response.status).toBe(401);
    });
  });
});

afterAll(async () => { 
  await sequelize.close();
});