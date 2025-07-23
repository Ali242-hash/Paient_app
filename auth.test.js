const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const { sequelize, User } = db;
const authRouter = require('./routers/auth');

const app = express();
app.use(express.json());


authRouter.get('/protected-route', authRouter.Auth(), (req, res) => {
  res.json({ message: 'Protected content' });
});

app.use('/auth', authRouter);

describe('Auth Routes', () => {
  beforeAll(async () => {
    await User.destroy({
      where: { 
        username: ['admin1234', 'testuser', 'newuser123', 'gregrege', 'updatetest', 'updateduser']
      },
      force: true
    });
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  describe('POST /auth/login', () => {
    test('should return 400 for missing credentials', async () => {
      const response = await supertest(app)
        .post('/auth/login')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username and password are required');
    });
  });

  describe('POST /auth/register', () => {
    test('should return 409 if user already exists', async () => {
      await User.create({
        username: 'testuser',
        password: '123456',
        email: 'test@example.com',
        fullname: 'Test User',
        role: 'patient',
        active: true
      });

      const response = await supertest(app)
        .post('/auth/register')
        .send({
          RegisterUsername: 'testuser',
          RegisterPassword: '123456',
          RegisterEmail: 'test@example.com',
          fullname: 'Test User'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message', 'Username already registered. Please login.');
    });
  });

  describe('PUT /auth/update', () => {
    test('should return 200 when credentials are updated', async () => {
      const user = await User.create({
        username: 'updatetest',
        password: 'oldpass',
        email: 'update@example.com',
        fullname: 'Update Test',
        role: 'patient',
        active: true
      });

      const loginResponse = await supertest(app)
        .post('/auth/login')
        .send({
          loginUsername: 'updatetest',
          loginPassword: 'oldpass'
        });

      const token = loginResponse.body.token;

      const response = await supertest(app)
        .put('/auth/update')
        .set('Authorization', `Bearer ${token}`)
        .send({
          NewUsername: 'updateduser',
          NewPassword: 'newpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User information updated successfully');
    });
  });

  describe('Auth Middleware', () => {
    test('should return 401 for invalid token', async () => {
      const response = await supertest(app)
        .get('/auth/protected-route')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });
});