const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const sequelize = db.dbHandler;
const { User, DoctorProfile, Shift, Timeslot, Appointment } = db;
const bcrypt = require('bcrypt');

const server = express();
server.use(express.json());
const appointmentRouter = require('./routers/appointment');
server.use('/appointments', appointmentRouter);

describe('POST /appointments', () => {
  test('should return 409 if timeslot is already booked', async () => {
    const unique = Date.now();

    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      fullname: 'Test Doctor',
      email: `doctor${unique}@test.com`,
      username: `testdoctor${unique}`,
      password: hashedPassword,
      role: 'doctor',
      active: true
    });

    const testDoctor = await DoctorProfile.create({
      userId: user.id,
      Docname: 'Dr. Test',
      specialty: 'Cardiology',
      treatments: 'Heart'
    });

    const testShift = await Shift.create({
      doctorId: testDoctor.id,
      dátum: '2025-01-01',
      típus: 'délelőtt',
      active: true
    });

    const testTimeslot = await Timeslot.create({
      shiftId: testShift.id,
      doctorId: testDoctor.id,
      kezdes: '10:00',
      veg: '10:30',
      foglalt: false
    });


    await Appointment.create({
      timeslotId: testTimeslot.id,
      név: 'Existing Patient',
      létrehozásDátuma: new Date()
    });

    await testTimeslot.update({ foglalt: true });



    const response = await supertest(server)
      .post('/appointments')
      .send({
        timeslotId: testTimeslot.id,
        név: 'New Patient',
        doctorId: testDoctor.id,
        megjegyzés: 'Test note'
      });

    expect(response.status).toBe(409);
 


    await Appointment.destroy({ where: { timeslotId: testTimeslot.id } });
    await Timeslot.destroy({ where: { id: testTimeslot.id } });
    await Shift.destroy({ where: { id: testShift.id } });
    await DoctorProfile.destroy({ where: { id: testDoctor.id } });
    await User.destroy({ where: { id: user.id } });
  });

  test('should return 201 when creating new appointment', async () => {
    const unique = Date.now();

    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      fullname: 'Test Doctor',
      email: `doctor${unique}@test.com`,
      username: `testdoctor${unique}`,
      password: hashedPassword,
      role: 'doctor',
      active: true
    });

    const testDoctor = await DoctorProfile.create({
      userId: user.id,
      Docname: 'Dr. Test',
      specialty: 'Cardiology',
      treatments: 'Heart'
    });

    const testShift = await Shift.create({
      doctorId: testDoctor.id,
      dátum: '2025-01-01',
      típus: 'délelőtt',
      active: true
    });

    const newTimeslot = await Timeslot.create({
      shiftId: testShift.id,
      doctorId: testDoctor.id,
      kezdes: '11:00',
      veg: '11:30',
      foglalt: false
    });

    const response = await supertest(server)
      .post('/appointments')
      .send({
        timeslotId: newTimeslot.id,
        név: 'New Patient',
        doctorId: testDoctor.id,
        megjegyzés: 'Test note'
      });

    expect(response.status).toBe(201);


    await Appointment.destroy({ where: { timeslotId: newTimeslot.id } });
    await Timeslot.destroy({ where: { id: newTimeslot.id } });
    await Shift.destroy({ where: { id: testShift.id } });
    await DoctorProfile.destroy({ where: { id: testDoctor.id } });
    await User.destroy({ where: { id: user.id } });
  });
});
