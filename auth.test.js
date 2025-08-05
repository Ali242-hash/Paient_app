const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const { User } = db;
const bcrypt = require('bcrypt');

const app = express()
const authModule = require('./routers/auth');
app.use(express.json());
app.use('/auth', authModule.router);

describe('Auth Routes', () => {
  describe('POST /auth/login', () => {
    test('should return 400 for missing credentials', async () => {
      const response = await supertest(app)
        .post('/auth/login')
        .send({ loginUsername: '', loginPassword: '' });
      expect(response.status).toBe(400);
    });

    test('should return 200 with token for valid credentials', async () => {
  
      await User.create({
        fullname: 'testuser',
        email: 'test@user.com',
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
        role: 'patient',
        active: true,
      });

      const response = await supertest(app)
        .post('/auth/login')
        .send({ loginUsername: 'testuser', loginPassword: 'password123' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Auth Middleware', () => {
    test('should return 401 for invalid token', async () => {
      const response = await supertest(app)
        .put('/auth/update')
        .set('Authorization', 'Bearer invalidtoken')
        .send({ NewUsername: 'whatever' });
      expect(response.status).toBe(401);
    });
  });
});
