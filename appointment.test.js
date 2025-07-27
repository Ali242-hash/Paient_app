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
    
    await Timeslot.destroy({where:{id:timeslotId.id}})
    await Shift.destroy({where:{id:testShift.id}})
    await DoctorProfile.destroy({where:{id:testDoctor.id}})
    await sequelize.close();
  } catch (error) {
    console.error('Global cleanup failed:', error);
  }
});

describe('GET /appointments/free/:doctorId', () => {
  let testDoctor;
  let freeTimeslot;
  let testShift

  beforeEach(async () => {
    testDoctor = await DoctorProfile.create({
      userId: testUser.id,
      Docname: 'Dr. Test',
      profilKész: true,
      specialty:'Dor profile',
      treatments:'khare nanat'
    });

    testShift = await Shift.create({
      doctorId:testDoctor.id,
      dátum: new Date(),
      típus: 'délelőtt',
      active: true
    })

    freeTimeslot = await Timeslot.create({
      doctorId: testDoctor.id,
      shiftId:testShift.id,
      kezdes: '11:00',
      veg: '12:00',
      foglalt: false
    });
  });

afterEach(async () => {
  try {
    if (freeTimeslot?.id) {
      await Timeslot.destroy({ where: { id: freeTimeslot.id } });
    }
    if (testDoctor?.id) {
      await DoctorProfile.destroy({ where: { id: testDoctor.id } });
    }

    if(testShift?.id){
      await Shift.destroy({where:{id:testShift.id}})
    }
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});

  it('should return 200 and free time slots', async () => {
    const response = await supertest(app)
      .get(`/appointments/free/${testDoctor.id}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some(slot => slot.id === freeTimeslot.id)).toBe(true);
  });
});

describe('POST /appointments', () => {
  it('should return 409 if timeslot is already booked', async () => {
    const response = await supertest(app)
      .post('/appointments')
      .send({
        timeslotId: timeslot1.id, 
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