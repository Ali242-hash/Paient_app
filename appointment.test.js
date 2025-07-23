const express = require('express');
const supertest = require('supertest');
const RouterAppointment = require('./routers/appointment');
const db = require('./dbHandler');
const { Timeslot, Appointment, DoctorProfile, User } = db;

const app = express();
app.use(express.json());
app.use('/appointments', RouterAppointment);

let testDoctor;
let testUser;
let timeslot1, timeslot2;
let testAppointment;

beforeAll(async () => {
  // Create test user
  testUser = await User.create({
    fullname: 'Test Doctor User',
    email: 'testdoctor@example.com',
    username: 'testdoctor',
    password: 'password',
    role: 'doctor',
    active: true
  });

  // Create doctor profile
  testDoctor = await DoctorProfile.create({
    userId: testUser.id,
    Docname: 'Dr. Test',
    description: 'Test description',
    profilKépUrl: 'https://example.com/doctor.jpg',
    specialty: 'General',
    treatments: 'General',
    profilKész: true
  });

 
  timeslot1 = await Timeslot.create({
    shiftId: 1,
    kezdes: '09:00',
    veg: '10:00',
    foglalt: false,
    doctorId: testDoctor.id
  });
  
  timeslot2 = await Timeslot.create({ 
    shiftId: 1,
    kezdes: '10:00',
    veg: '11:00',
    foglalt: false,
    doctorId: testDoctor.id
  });

  // Create test appointment
  testAppointment = await Appointment.create({
    doctorId: testDoctor.id,
    timeslotId: timeslot1.id,
    név: 'Test Patient',
    megjegyzés: 'Initial test appointment',
    létrehozásDátuma: new Date()
  });
});

afterAll(async () => {
  try {
    await Appointment.destroy({ 
      where: { doctorId: testDoctor.id },
      force: true
    });
    
    await Timeslot.destroy({ 
      where: { doctorId: testDoctor.id },
      force: true 
    });
    
    await DoctorProfile.destroy({ 
      where: { id: testDoctor.id },
      force: true
    });
    
    await User.destroy({ 
      where: { id: testUser.id },
      force: true
    });
    
    await db.sequelize.close();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

describe('GET /appointments/free/:doctorId', () => {
  test('should return 200 and free time slots', async () => {
    const response = await supertest(app)
      .get(`/appointments/free/${testDoctor.id}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some(slot => 
      slot.kezdes === timeslot2.kezdes && 
      slot.veg === timeslot2.veg
    )).toBe(true);
  });
});

describe('POST /appointment', () => {
  test('should return 409 if timeslot is already booked', async () => {
    const response = await supertest(app)
      .post('/appointment')
      .send({
        timeslotId: timeslot1.id,
        páciensId: 3,
        név: 'Ali2',
        megjegyzés: 'Second booking'
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty(
      'message', 
      'This slot has already been booked, please try another'
    );
  });

  test('should return 201 when creating new appointment', async () => {
    const response = await supertest(app)
      .post('/appointment')
      .send({
        timeslotId: timeslot2.id,
        páciensId: 4,
        név: 'New Patient',
        megjegyzés: 'New booking'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      'message', 
      'Appointment created successfully'
    );
  });
});

describe('DELETE /appointment/:id', () => {
  test('should return 404 if appointment not found', async () => {
    const response = await supertest(app)
      .delete('/appointment/999999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      'message', 
      'No appointment has been found'
    );
  });

  test('should delete existing appointment and return 200', async () => {
    const response = await supertest(app)
      .delete(`/appointment/${testAppointment.id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      'message', 
      'Your appointment was deleted successfully'
    );
  });
});