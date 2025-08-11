const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const userRouter = require('./routers/user');

const server = express();
server.use(express.json());
server.use('/users', userRouter);

describe('User Routes', () => {
  test('GET /users/all without auth returns 401', async () => {
    const res = await request(server).get('/users/all');
    expect(res.statusCode).toBe(401);
  });

  test('POST /users/ should return 400', async () => {
    const secretKey = 'madaretosagbegad666';

    const token = jwt.sign(
      { id: 1, username: 'adminUser', role: 'admin' },
      secretKey,
      { expiresIn: '1h' }
    );

    const res = await request(server)
      .post('/users/register-admin')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /users/register-admin unauthorized returns 401', async () => {
    const res = await request(server).post('/users/register-admin').send({
      fullname: 'Mark Smith',
      email: 'mark@yahoo.com',
      username: 'marksmith',
      password: 'password123',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('DELETE /users/:id unauthorized returns 401', async () => {
    const res = await request(server).delete('/users/1');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
