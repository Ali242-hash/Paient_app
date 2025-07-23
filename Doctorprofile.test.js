const request = require('supertest');
const express = require('express');
const router = require('../routes/DoctorProfile')
const dbHandler = require('../dbHandler')
const { DoctorProfile } = dbHandler;

const app = express();
app.use(express.json());
app.use('/doctorprofiles', router)

const testDoctorId = 9999;

describe('POST /doctorprofiles', () => {
  afterAll(async () => {
    
    await DoctorProfile.destroy({ where: { id: testDoctorId } });
    await dbHandler.close();
  });

  test('should create a new doctor profile and return 201', async () => {
    const response = await request(app)
      .post('/doctorprofiles')
      .send({
        id: testDoctorId,
        userId: 1,
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
        id: testDoctorId,
        userId: 1,
        Docname: 'Dr. Anna Kovacs',
        description: 'Cardiology',
        profilKépUrl: 'https://cdn.pixabay.com/photo/2024/01/19/18/52/ai-generated-8519596_1280.png',
        specialty: 'Cardiology',
        treatments: 'Heart Disease',
        profilKész: true
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('This doctor is already in the system');
  })
})

