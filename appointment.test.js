const express = require('express');
const supertest = require('supertest');
const RouterAppointment = require('./routers/appointment');
const db = require('./dbHandler');

const sequelize = db.dbHandler;
const { User, DoctorProfile, Shift, Timeslot, Appointment } = db;

if (!sequelize) {
  throw new Error("Sequelize instance not found in dbHandler");
}

const app = express();
app.use(express.json());
app.use('/appointments', RouterAppointment);

let testDoctor;
let testUser;
let testShift;
let timeslot1, timeslot2;
let testAppointment;

beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });

    testUser = await User.create({
      fullname: 'Test Doctor User',
      email: `testdoctor${Date.now()}@example.com`,
      username: `testdoctor${Date.now()}`, 
      password: 'ValidPassword123!',
      role: 'doctor',
      active: true
    });

    testDoctor = await DoctorProfile.create({
      userId: testUser.id,
      Docname: 'Dr. Test',
      description: 'Test description',
      profilKépUrl: 'https://example.com/doctor.jpg',
      specialty: 'General',
      treatments: 'General',
      profilKész: true
    });

    testShift = await Shift.create({
      doctorId: testDoctor.id,
      dátum: new Date(),
      típus: 'délelőtt',
      active: true
    });

    timeslot1 = await Timeslot.create({
      shiftId: testShift.id,
      kezdes: '09:00',
      veg: '10:00',
      foglalt: false,
      doctorId: testDoctor.id
    });
    
    timeslot2 = await Timeslot.create({ 
      shiftId: testShift.id,
      kezdes: '10:00',
      veg: '11:00',
      foglalt: false,
      doctorId: testDoctor.id
    });

    testAppointment = await Appointment.create({
      doctorId: testDoctor.id,
      timeslotId: timeslot1.id,
      név: 'Test Patient',
      megjegyzés: 'Initial test appointment',
      létrehozásDátuma: new Date()
    });

    // Mark timeslot1 as booked
    await Timeslot.update(
      { foglalt: true },
      { where: { id: timeslot1.id } }
    );
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await Appointment.destroy({ where: {} });
    await Timeslot.destroy({ where: {} });
    await Shift.destroy({ where: {} });
    await DoctorProfile.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
})

describe('GET /appointments/free/:doctorId', () => {
  it('should return 200 and free time slots', async () => {
   
    const freeTimeslot = await Timeslot.create({
      shiftId: testShift.id,
      kezdes: '11:00',
      veg: '12:00',
      foglalt: false,
      doctorId: testDoctor.id
    });


    const response = await supertest(app)
      .get(`/appointments/free/${testDoctor.id}`);
    

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    

    const returnedSlot = response.body.find(slot => slot.id === freeTimeslot.id);
    expect(returnedSlot).toBeDefined();
    expect(returnedSlot.foglalt).toBe(false);
    
   
    await freeTimeslot.destroy();
  });
});



describe('POST /appointments', () => {
  it('should return 409 if timeslot is already booked', async () => {
    const response = await supertest(app)
      .post('/appointments')
      .send({
        timeslotId: timeslot1.id, // Already booked in beforeAll
        név: 'Test Patient',
        doctorId: testDoctor.id
      });
    
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty(
      'message',
      'This slot has already been booked, please try another'
    );
  });

  it('should return 201 when creating new appointment', async () => {
    // Ensure timeslot2 is free
    await Timeslot.update(
      { foglalt: false },
      { where: { id: timeslot2.id } }
    );

    const response = await supertest(app)
      .post('/appointments')
      .send({
        timeslotId: timeslot2.id,
        név: 'New Patient',
        doctorId: testDoctor.id
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});

describe('DELETE /appointments/:id', () => {
  it('should return 404 if appointment not found', async () => {
    const response = await supertest(app)
      .delete('/appointments/999999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      'message',
      'No appointment has been found'
    );
  });

  it('should delete existing appointment and return 200', async () => {
    const tempAppointment = await Appointment.create({
      doctorId: testDoctor.id,
      timeslotId: timeslot2.id,
      név: 'Temp Patient',
      létrehozásDátuma: new Date()
    });
    
    const response = await supertest(app)
      .delete(`/appointments/${tempAppointment.id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Appointment deleted successfully'
    );
  });
});