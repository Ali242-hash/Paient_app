const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const sequelize = db.dbHandler;
const { User, DoctorProfile, Shift, Timeslot, Appointment } = db;

const app = express();
app.use(express.json());
const appointmentRouter = require('./routers/appointment');
app.use('/appointments', appointmentRouter);

beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Database sync failed:', error);
    process.exit(1);
  }
});

describe('POST /appointments', () => {
  let testDoctor;
  let testShift;
  let testTimeslot;

  beforeAll(async () => {
    const user = await User.create({
      fullname: 'Test Doctor',
      email: 'doctor@test.com',
      username: 'testdoctor',
      password: 'password123',
      role: 'doctor',
      active: true
    });

    testDoctor = await DoctorProfile.create({
      userId: user.id,
      Docname: 'Dr. Test',
      specialty: 'Cardiology',
      treatments: 'Heart'
    });

    testShift = await Shift.create({
      doctorId: testDoctor.id,
      dátum: '2025-01-01',
      típus: 'délelőtt',
      active: true
    });

    testTimeslot = await Timeslot.create({
      shiftId: testShift.id,
      doctorId: testDoctor.id,
      kezdes: '10:00',
      veg: '10:30',
      foglalt: false
    });
  });

  test('should return 409 if timeslot is already booked', async () => {
    
    await Appointment.create({
      timeslotId: testTimeslot.id,
      név: 'Existing Patient',
      létrehozásDátuma: new Date()
    });

  
    await testTimeslot.update({ foglalt: true });

    const response = await supertest(app)
      .post('/appointments')
      .send({
        timeslotId: testTimeslot.id,
        name: 'New Patient'  
      });

    expect(response.status).toBe(409);
  });

  test('should return 201 when creating new appointment', async () => {
    const newTimeslot = await Timeslot.create({
      shiftId: testShift.id,
      doctorId: testDoctor.id,
      kezdes: '11:00',
      veg: '11:30',
      foglalt: false
    });

    const response = await supertest(app)
      .post('/appointments')
      .send({
        timeslotId: newTimeslot.id,
        name: 'New Patient',  
        note: 'Test note'     
      });

    expect(response.status).toBe(201);
  });
});

afterAll(async () => {
  await sequelize.close();
});