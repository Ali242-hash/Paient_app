const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const { User } = db;

const app = express();
app.use(express.json());
const userRouter = require('./routers/user');
app.use('/users', userRouter);

describe('User Routes', () => {
  let testAdmin;
  let testUser;

  beforeAll(async () => {
    await User.destroy({ 
      where: { 
        email: ['admin@test.com', 'test@user.com', 'mark@yahoo.com', 'deleteme@example.com'] 
      } 
    });
    
    testAdmin = await User.create({
      fullname: 'Test Admin',
      email: 'admin@test.com',
      username: 'testadmin',
      password: 'password123',
      role: 'admin',
      active: true
    });

    testUser = await User.create({
      fullname: 'Test User',
      email: 'test@user.com',
      username: 'testuser',
      password: 'password',
      role: 'patient',
      active: true
    });
  });

  afterAll(async () => {
    await User.destroy({ 
      where: { 
        email: ['admin@test.com', 'test@user.com', 'mark@yahoo.com', 'deleteme@example.com'] 
      } 
    });
    if (db.sequelize) await db.sequelize.close();
  });

  describe('GET /users/all', () => { 
    test('should return 403 if user is not admin', async () => {
      const nonAdminApp = express();
      nonAdminApp.use(express.json());
      
      nonAdminApp.use((req, res, next) => {
        req.user = { role: 'patient' };
        next();
      });
      
      nonAdminApp.use('/users', userRouter);

      const response = await supertest(nonAdminApp).get('/users/all');
      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'Forbidden: Admin access required');
    });

    test('should return 200 if user is admin', async () => {
      const adminApp = express();
      adminApp.use(express.json());
      
      adminApp.use((req, res, next) => {
        req.user = { 
          id: testAdmin.id,
          role: 'admin',
          username: testAdmin.username
        };
        next();
      });
      
      adminApp.use('/users', userRouter);

      const response = await supertest(adminApp).get('/users/all');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /users/register-admin', () => { 
    afterEach(async () => {
      await User.destroy({ where: { email: 'mark@yahoo.com' } });
    });

    test('should register a new admin and return 201', async () => {
      const response = await supertest(app)
        .post('/users/register-admin')
        .send({
      NewAdminName: 'Mark Smith', 
      NewAdminEmail: 'mark@yahoo.com',
      NewAdminUsername: 'marksmith',
      NewAdminPass: 'password123' 
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'Admin registered successfully');
      
      const admin = await User.findOne({ 
        where: { email: 'mark@yahoo.com' },
        attributes: ['id', 'role', 'active'] 
      });
      expect(admin.role).toBe('admin');
      expect(admin.active).toBe(true);
    });
  });

  describe('DELETE /users/:id', () => {
    test('should return 404 if user not found', async () => {
      const response = await supertest(app)
        .delete('/users/999999');
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('should delete existing user and return 204', async () => {
      const newUser = await User.create({
        fullname: 'Test User To Delete',
        email: 'deleteme@example.com',
        username: 'deleteme',
        password: 'password',
        role: 'patient',
        active: true,
      });

      const response = await supertest(app)
        .delete(`/users/${newUser.id}`);
      
      expect(response.statusCode).toBe(204);

      const deletedUser = await User.findByPk(newUser.id);
      expect(deletedUser).toBeNull();
    });
  });
});