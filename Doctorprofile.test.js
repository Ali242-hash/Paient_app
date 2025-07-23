const request = require('supertest');
const express = require('express');

const db = require('./dbHandler'); 
const { DoctorProfile, User } = db;  

const app = express();
app.use(express.json());
const  DoctorProRoute = require('./routers/Doctorprofile')
app.use('/doctorprofiles', DoctorProRoute)

const testDoctorId = 9999;
const testUserId = 1;

describe('POST /doctorprofiles', () => {
  beforeAll(async () => {
 
    await User.create({
      id: testUserId,
      fullname: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password',
      role: 'doctor',
      active: true
    });
  });

  afterAll(async () => {
   
    await DoctorProfile.destroy({ where: { userId: testUserId } });
    await User.destroy({ where: { id: testUserId } });
    await db.sequelize.close()
  });

  test('should create a new doctor profile and return 201', async () => {
    const response = await request(app)
      .post('/doctorprofiles')
      .send({
        userId: testUserId,  
        Docname: 'Dr. Anna Kovacs',
        description: 'Cardiology',
        profilKépUrl: 'https://cdn.pixabay.com/photo/2024/01/19/18/52/ai-generated-8519596_1280.png',
        specialty: 'Cardiology',
        treatments: 'Heart Disease',
        profilKész: true
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Doctor profile has been created');
  });

  test('should return 409 if doctor already exists', async () => {
    const response = await request(app)
      .post('/doctorprofiles')
      .send({
        userId: testUserId,
        Docname: 'Dr. Anna Kovacs',
        description: 'Cardiology',
        profilKépUrl: 'https://cdn.pixabay.com/photo/2024/01/19/18/52/ai-generated-8519596_1280.png',
        specialty: 'Cardiology',
        treatments: 'Heart Disease',
        profilKész: true
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('This doctor is already in the system');
  });
});