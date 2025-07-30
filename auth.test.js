const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const sequelize = db.dbHandler;
const { User } = db;
const bcrypt = require('bcrypt');


require('dotenv').config({ path: '.env.test' })

const app = express();
app.use(express.json())

const authRouter = require('./routers/auth');
app.use('/auth', authRouter);

beforeAll(async () => {
  try {
    await sequelize.sync({ alter: true });
  } catch (error) {
    console.error('Database sync failed:', error);
    
  }
});

describe('Auth Routes', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    
    await User.destroy({ where: { username: 'testuser' } });

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      fullname: 'Test User',
      email: 'test@user.com',
      username: 'testuser',
      password: hashedPassword,
      role: 'patient',
      active: true
    });
  });

  describe('POST /auth/login', () => {
    test('should return 400 for missing credentials', async () => {
      const response = await supertest(app)
        .post('/auth/login')
     
        .send({ loginUsername: '', loginPassword: '' });

      expect(response.status).toBe(400);
    });

    test('should return 200 with token for valid credentials', async () => {
      const response = await supertest(app)
        .post('/auth/login')
        .send({ loginUsername: 'testuser', loginPassword: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });
  });

  describe('PUT /auth/update', () => {
    test('should return 400 if no new username or password', async () => {
      const response = await supertest(app)
        .put('/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400);
    });

    test('should return 200 when username or password updated', async () => {
      const response = await supertest(app)
        .put('/auth/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          NewUsername: 'newtestuser',
          NewPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Auth Middleware', () => {
    test('should return 401 for invalid token', async () => {
      const response = await supertest(app)
        .put('/auth/update')
        .set('Authorization', 'Bearer invalidtoken')
        .send({
          NewUsername: 'whatever'
        });

      expect(response.status).toBe(401);
    });
  });
});

afterAll(async () => {
  await sequelize.close();
});
