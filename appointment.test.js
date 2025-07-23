const express = require('express');
const supertest = require('supertest');
const RouterAppointment = require('./routers/appointment');
const dbHandler = require('./dbHandler');
const { Timeslot, Appointment, DoctorProfile } = dbHandler;

const app = express();
app.use(express.json());
app.use('/appointments', RouterAppointment);

let testDoctor;
let timeslot1, timeslot2;

beforeAll(async () => {
  testDoctor = await DoctorProfile.create({
    name: 'Dr. Smith',
    specializationId: 1,
  });

  timeslot1 = await Timeslot.create({ doctorId: testDoctor.id, time: '09:00' });
  timeslot2 = await Timeslot.create({ doctorId: testDoctor.id, time: '09:15' });

  await Appointment.create({
    doctorId: testDoctor.id,
    timeslotId: timeslot1.id,
    név: 'Test Patient',
  });
});

describe('GET /appointments/free/:doctorId', () => {
  test('should return 200 and free time slots', async () => {
    const response = await supertest(app).get(`/appointments/free/${testDoctor.id}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('GET /appointments', () => {
  test('should return 200 and list all appointments', async () => {
    const response = await supertest(app).get('/appointments');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('POST /appointment', () => {
  test('should return 409 if timeslot is already booked', async () => {
    await supertest(app).post('/appointment').send({
      timeslotId: timeslot1.id,
      páciensId: 2,
      név: 'Ali',
      megjegyzés: 'Test note',
      létrehozásDátuma: '2025-07-17',
    });

    const response = await supertest(app).post('/appointment').send({
      timeslotId: timeslot1.id,
      páciensId: 3,
      név: 'Ali2',
      megjegyzés: 'Second booking',
      létrehozásDátuma: '2025-07-17',
    });

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('message', 'This slot has already been booked, please try another');
  });
});

describe('DELETE /appointment/:id', () => {
  test('should return 404 if appointment not found', async () => {
    const response = await supertest(app).delete('/appointment/999999');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message', 'No appointment has been found');
  });

  test('should delete existing appointment and return 200', async () => {
    const newAppointment = await Appointment.create({
      timeslotId: timeslot2.id,
      név: 'Test Deletion',
      páciensId: null,
      megjegyzés: 'delete test',
      létrehozásDátuma: new Date(),
    });

    const response = await supertest(app).delete(`/appointment/${newAppointment.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Your appointment was deleted successfully');
  });
});
