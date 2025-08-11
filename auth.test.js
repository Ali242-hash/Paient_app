const express = require('express')
const supertest = require('supertest')
const db = require('./dbHandler')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = db
const authRouter = require('./routers/auth')

const server = express()
server.use(express.json())
server.use('/auth', authRouter.router) 


describe('Auth Routes', () => {
  test('Should return 400 for missing credential', async () => {
    const response = await supertest(server).post('/auth/login').send({
      loginUsername: '',
      loginPassword: ''
    })
    expect(response.statusCode).toBe(400)
  })

  test('Should return 404 if user not found', async () => {
    const response = await supertest(server).post('/auth/login').send({
      loginUsername: 'nonexistentuser',
      loginPassword: 'somepassword'
    })
    expect(response.statusCode).toBe(404)
    expect(response.body).toHaveProperty('message')
  })

  test('Should return 401 for invalid password', async () => {
    await User.destroy({ where: { username: 'testuser2' } })
    await User.create({
      fullname: 'Test User Two',
      email: 'testuser2@example.com',
      username: 'testuser2',
      password: await bcrypt.hash('correctpassword', 10),
      role: 'patient',
      active: true
    })

    const response = await supertest(server).post('/auth/login').send({
      loginUsername: 'testuser2',
      loginPassword: 'wrongpassword'
    })
    expect(response.statusCode).toBe(401)
    expect(response.body).toHaveProperty('message')
  })

  test('Should return 200 success login', async () => {
    await User.destroy({ where: { username: 'testuser1' } })
    await User.create({
      fullname: 'testuser one',
      email: 'testuser@test.com',
      username: 'testuser1',
      password: await bcrypt.hash('password123', 10),
      role: 'patient',
      active: true
    })

    const response = await supertest(server).post('/auth/login').send({
      loginUsername: 'testuser1',
      loginPassword: 'password123'
    })
    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('token')
  })

  test('Register should return 400 if missing username or password', async () => {
    const response = await supertest(server).post('/auth/register').send({
      RegisterUsername: '',
      RegisterPassword: ''
    })
    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
  })

  test('Register should return 409 if user already exists', async () => {
    const unique = Date.now()
    await User.create({
      fullname: 'Existing User',
      email: `exist${unique}@example.com`,
      username: `exist${unique}`,
      password: await bcrypt.hash('password', 10),
      role: 'patient',
      active: true
    })

    const response = await supertest(server).post('/auth/register').send({
      RegisterUsername: `exist${unique}`,
      RegisterPassword: 'somepassword',
      RegisterEmail: 'exist@example.com',
      fullname: 'Existing User'
    })
    expect(response.statusCode).toBe(409)
    expect(response.body).toHaveProperty('message')
  })

  test('Register should return 201 on success', async () => {
    const unique = Date.now()
    const response = await supertest(server).post('/auth/register').send({
      RegisterUsername: `newuser${unique}`,
      RegisterPassword: 'password123',
      RegisterEmail: `newuser${unique}@example.com`,
      fullname: 'New User'
    })
    expect(response.statusCode).toBe(201)
    expect(response.body).toHaveProperty('message')
  })
test('Auth middleware allows access with valid token', async () => {
  const loginResponse = await supertest(server).post('/auth/login').send({
    loginUsername:'testuser1',
    loginPassword:'password123'
  })
  
  const token = loginResponse.body.token

  const response = await supertest(server).put('/auth/put')
    .set('Authorization', `Bearer ${token}`)
    .send({})

  expect(response.statusCode).toBe(200)
  expect(response.body).toHaveProperty('message')
})

  test('Auth middleware returns 401 if Authorization header is not Bearer', async () => {
    const response = await supertest(server)
      .put('/auth/put')
      .set('Authorization', 'Basic invalidtoken')
      .send({})
    expect(response.statusCode).toBe(401)
    expect(response.body).toHaveProperty('message')
  })

  test('Auth middleware returns 401 on invalid token', async () => {
    const response = await supertest(server)
      .put('/auth/put')
      .set('Authorization', 'Bearer invalidtoken')
      .send({})
    expect(response.statusCode).toBe(401)
    expect(response.body).toHaveProperty('message')
   
  })
})
