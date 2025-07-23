const express = require('express');
const Shiftrouter = require('./routers/Shift');
const supertest = require('supertest');
const dbHandler = require('./dbHandler');

const { Shift, DoctorProfile } = dbHandler;

const app = express();
app.use(express.json());
app.use('/shifts', Shiftrouter);

const doctorId = 9999;

describe('/shifts', () => {
  beforeAll(async () => {
  
    await DoctorProfile.create({
      id: doctorId,
      Docname: 'Dr. Test Doctor',
      description: 'Test doctor for shift tests',
      profilKépUrl: 'https://example.com/test.jpg',
      specialty: 'Test Specialty',
      treatments: 'Test Treatments',
      profilKész: true
    });
  });

  afterAll(async () => {
  
    await DoctorProfile.destroy({ where: { id: doctorId } });
    await dbHandler.close()
  });

  test('should return 409 if shift already exists', async () => {
    await supertest(app).post('/shifts').send({
      doctorId,
      dátum: '2025-07-17',
      típus: 'délelőtt',
    });

    const response = await supertest(app).post('/shifts').send({
      doctorId,
      dátum: '2025-07-17',
      típus: 'délelőtt',
    });

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message.toLowerCase()).toMatch(/shift.*exist/);
  });

  test('should return 201 and create shift with time slots', async () => {
    const response = await supertest(app).post('/shifts').send({
      doctorId,
      dátum: '2025-07-18',
      típus: 'délelőtt',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'shifts created');
    expect(Array.isArray(response.body.slots)).toBe(true);
    expect(response.body.slots.length).toBeGreaterThan(0);
  })
})
