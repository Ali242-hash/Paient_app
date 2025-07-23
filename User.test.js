const express = require('express')
const supertest = require('supertest')
const userRouters = require('./routers/user')
const dbHandler = require('./dbHandler')     

const { User } = dbHandler;

const app = express();
app.use(express.json());
app.use('/', userRouters);

describe('GET /all-user', () => {
  test('should return 403 if user is not admin', async () => {
    const appNoUser = express();
    appNoUser.use(express.json());
    appNoUser.use(userRouters);

    const response = await supertest(appNoUser).get('/all-user');
    expect(response.statusCode).toBe(403);
   
  })

  test('should return 200 if user is admin', async () => {
    const appWithAdmin = express();
    appWithAdmin.use(express.json());

    appWithAdmin.use((req, res, next) => {
      req.user = { role: 'admin' }
      next()
    })

    appWithAdmin.use(userRouters);

    const response = await supertest(appWithAdmin).get('/all-user');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('POST /admin', () => {
  test('should register a new admin and return 201', async () => {
    const response = await supertest(app).post('/admin').send({
      NewAdminName: 'Mark Smith',
      NewAdminEmail: 'mark@yahoo.com',
      NewAdminUsername: 'marksmith',
      NewAdminPass: 'password123',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Registered Successfully');
  });
});

describe('DELETE /user/:id', () => {
  test('should return 404 if user not found', async () => {
    const response = await supertest(app).delete('/user/999999');
    expect(response.statusCode).toBe(404)
    expect(response.body).toHaveProperty('message', 'This user has not been found in the system');
  });

  test('should delete existing user and return 204', async () => {
    const newUser = await User.create({
      fullname: 'rwrgeg',
      email: 'deleteme@example.com',
      username: 'deleteme',
      password: 'password',
      role: 'patient',
      active: true,
    });

    const response = await supertest(app).delete(`/user/${newUser.id}`);
    expect(response.statusCode).toBe(204);
  })
})
