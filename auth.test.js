const express = require('express');
const supertest = require('supertest');
const authRouter = require('./routers/auth')
const dbHandler = require('./dbHandler')  
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/auth',authRouter)

const secretkey = process.env.JWT_SECRET || 'madaretosagbegad666'

function Auth() {
  return (req, res, next) => {
    
    req.username = 'testuser';
    req.role = 'patient';
    next();
  }
}

app.get('/user', Auth(), (req, res) => {
  res.status(200).json({ message: `Hello ${req.username}`, role: req.role });
});

describe('POST/auth/login', () => {
  test('should return 401 for missing credentials', async () => {
    const response = await supertest(app).post('/auth/login').send({});
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid username or password');
  });

  test('should return 401 for wrong password', async () => {
    await supertest(app).post('/auth/register').send({
      RegisterUsername: 'admin1234',
      RegisterPassword: 'correctpassword',
      RegisterEmail: 'admin@example.com',
      role: 'admin'
    });

    const response = await supertest(app).post('/auth/login').send({
      loginUsername: 'admin1234',
      loginPassword: 'wrongpassword'
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid username or password');
  });

  test('should return 200 and token for valid login', async () => {
    await supertest(app).post('/auth/register').send({
      RegisterUsername: 'admin1234',
      RegisterPassword: 'yourpassword',
      RegisterEmail: 'admin@example.com',
      role: 'admin'
    });

    const response = await supertest(app).post('/auth/login').send({
      loginUsername: 'admin1234',
      loginPassword: 'yourpassword'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('message', 'Login was successful');
  });
});

describe('/auth/register', () => {
  test('should return 409 if user already exists', async () => {
    await supertest(app).post('/auth/register').send({
      RegisterUsername: 'testuser',
      RegisterPassword: '123456',
      RegisterEmail: 'test@example.com',
      role: 'patient'
    });

    const response = await supertest(app).post('/auth/register').send({
      RegisterUsername: 'testuser',
      RegisterPassword: '123456'
    });

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('message', 'You have already registered. Please login.');
  });

  test('should return 201 for successful registration', async () => {
    const response = await supertest(app).post('/auth/register').send({
      RegisterUsername: 'newuser123',
      RegisterPassword: 'securepass123',
      RegisterEmail: 'newuser123@example.com',
      role: 'patient'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Registration successful');
  });
});

describe('/save', () => {
  test('should return 404 for non-existing user', async () => {
    const response = await supertest(app).put('/save').send({
      NewUsername: 'nonexistentUser',
      NewPassword: 'somepass123'
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message', 'No patient with this infos');
  });

  test('should return 200 when credentials are updated', async () => {
    await supertest(app).post('/auth/register').send({
      RegisterUsername: 'gregrege',
      RegisterPassword: 'oldpass',
      RegisterEmail: 'greg@example.com',
      role: 'patient'
    });

    const response = await supertest(app).put('/save').send({
      NewUsername: 'gregrege',
      NewPassword: 'newpass123'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'your credential saved successfully');
  });
});



describe('Auth Middleware', () => {
  test('should return 401 if no Authorization header', async () => {
    const response = await supertest(app).get('/protected');
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message', 'Missing Authorization header');
  });

  test('should return 401 for invalid token format', async () => {
    const response = await supertest(app)
      .get('/protected')
      .set('Authorization', 'WithoutBearer');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid token format');
  });

  test('should return 401 for invalid token', async () => {
    const response = await supertest(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid or expired token');
  });

  test('should return 200 for valid token', async () => {
    const validToken = jwt.sign(
      { username: 'testuser', role: 'patient' },
      secretkey,
      { expiresIn: '1h' }
    );

    const response = await supertest(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Hello testuser');
    expect(response.body).toHaveProperty('role', 'patient');
  });
});

module.exports = Auth