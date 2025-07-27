const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const { DoctorProfile, User, Shift, sequelize } = db; 

const app = express();
app.use(express.json());
const shiftRouter = require('./routers/Shift');
app.use('/shifts', shiftRouter);

describe('Shift Routes', () => {
  let testUser;
  let testDoctor;
  const doctorId = 9999;

  beforeAll(async () => {

    await Shift.destroy({ where: { doctorId } });
    await DoctorProfile.destroy({ where: { id: doctorId } });
    await User.destroy({ where: { email: 'testdoctor@example.com' } });

    
    testUser = await User.create({
      fullname: 'Test Doctor',
      email: 'testdoctor@example.com',
      username: 'testdoctor',
      password: 'password',
      role: 'doctor',
      active: true
    });

    testDoctor = await DoctorProfile.create({
      id: doctorId,
      userId: testUser.id, 
      Docname: 'Dr. Test Doctor',
      description: 'Test doctor',
      profilKépUrl: 'test.jpg',
      specialty: 'General', 
      treatments: 'General', 
      profilKész: true
    });
  });

  afterAll(async () => {
    await Shift.destroy({ where: { doctorId } });
    await DoctorProfile.destroy({ where: { id: doctorId } });
    await User.destroy({ where: { id: testUser.id } });
    if (sequelize) await sequelize.close(); 
  });

  test('should return 409 if shift already exists', async () => {

    await supertest(app)
      .post('/shifts')
      .send({
        doctorId: testDoctor.id,
        dátum: '2023-01-01',
        típus: 'délelőtt'
      });

  
    const response = await supertest(app)
      .post('/shifts')
      .send({
        doctorId: testDoctor.id,
        dátum: '2023-01-01',
        típus: 'délelőtt'
      });

    expect(response.status).toBe(409);
  });

  test('should return 201 and create shift with time slots', async () => {
    const response = await supertest(app)
      .post('/shifts')
      .send({
        doctorId: testDoctor.id,
        dátum: '2023-01-02',
        típus: 'délután'
      });

  console.log('Response status:', response.status);
  console.log('Response body:', response.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('shift');
    expect(response.body).toHaveProperty('timeslots');
  });
});