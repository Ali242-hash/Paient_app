const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const sequelize = db.dbHandler;
const { User, DoctorProfile, Shift, Timeslot } = db


const app = express();
app.use(express.json());
const shiftRouter = require('./routers/Shift');
app.use('/shifts', shiftRouter);


beforeAll(async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true })
    } else {
      await sequelize.sync(); 
    }
  } catch (error) {
    console.error('Database sync failed:', error);
    process.exit(1);
  }
});

describe('Shift Routes', () => {
  let testUser;
  let testDoctorProfile;

  beforeAll(async () => {
    try {
      // Unique username/email for safety (can run multiple times)
      const unique = Date.now();
      testUser = await User.create({
        fullname: 'Test Doctor',
        email: `testdoctor_${unique}@example.com`,
        username: `testdoctor_${unique}`,
        password: 'password123',
        role: 'doctor',
        active: true
      });

      testDoctorProfile = await DoctorProfile.create({
        userId: testUser.id,
        Docname: 'Dr. Test',
        specialty: 'General',
        treatments: 'General',
        profilKész: true
      });
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      await Timeslot.destroy({ where: {}, force: true });
      await Shift.destroy({ where: {}, force: true });
      await DoctorProfile.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  test('should return 409 if shift already exists', async () => {
    await Shift.create({
      doctorId: testDoctorProfile.id,
      dátum: '2025-01-01',
      típus: 'délelőtt',
      active: true
    });

    const response = await supertest(app)
      .post('/shifts')
      .send({
        doctorId: testDoctorProfile.id,
        dátum: '2025-01-01',
        típus: 'délelőtt'
      });

    expect(response.status).toBe(409);
  });

  test('should return 201 and create shift with time slots', async () => {
    const response = await supertest(app)
      .post('/shifts')
      .send({
        doctorId: testDoctorProfile.id,
        dátum: '2023-01-02',
        típus: 'délután',
        active: true,
        timeSlots: [
          { kezdes: '14:00', veg: '14:30' },
          { kezdes: '14:30', veg: '15:00' }
        ]
      });

    expect(response.status).toBe(201);
  });
});

afterAll(async () => {
  await sequelize.close();
});
