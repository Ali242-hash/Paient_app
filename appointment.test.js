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
  })
})

describe("PUT /appointments/:id/status", () => {
  
  test("Should return 404 when appointment does not exist", async () => {
    const response = await supertest(server)
      .put("/appointments/999/status")
      .send({ Status_Condition: "completed" })

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("No meeting found");
  });

  test("Should return 400 when invalid status is provided", async () => {
    const response = await supertest(server)
      .put("/appointments/1/status")
      .send({ Status_Condition: "invalid_status" })

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid appointment")
  })


});

describe("GET /appointments/doctor/history", () => {

  test("should return 403 if user is not a doctor", async () => {
    const patientToken = generateToken({ id: 1, role: "patient" }); 
    const response = await supertest(server)
      .get("/appointments/doctor/history")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("should return 200 with past appointments for doctor", async () => {
    const doctorToken = generateToken({ id: 2, role: "doctor" });

    await Appointment.create({
      doctorId: 2,
      userId: 10,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      Status_Condition: "completed"
    });

    const response = await supertest(server)
      .get("/appointments/doctor/history")
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body[0]).toHaveProperty("doctorId", 2)
    expect(response.body[0]).toHaveProperty("Status_Condition", "completed");
  });

  test("should return 200 with empty array if no past appointments", async () => {
    const doctorToken = generateToken({ id: 3, role: "doctor" })

    const response = await supertest(server)
      .get("/appointments/doctor/history")
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(response.statusCode).toBe(200);
   
  })

})
describe("POST /appointments/manual", () => {
  test("Should create a manual appointment successfully", async () => {
    const response = await supertest(server)
      .post("/appointments/manual")
      .send({
        doctorId: 1,
        userId: 2,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        Status_Condition: "booked"
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("message", "Manual appointment created successfully");
    expect(response.body.appointment).toHaveProperty("id");
  });

  test("Should return 400 when required fields are missing", async () => {
    const response = await supertest(server)
      .post("/appointments/manual")
      .send({ doctorId: 1 })

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("doctorId, userId, and date are required");
  });

  test("Should return 400 for invalid date format", async () => {
    const response = await supertest(server)
      .post("/appointments/manual")
      .send({
        doctorId: 1,
        userId: 2,
        date: "invalid-date"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid date format");
  });

  test("Should return 400 for invalid status", async () => {
    const response = await supertest(server)
      .post("/appointments/manual")
      .send({
        doctorId: 1,
        userId: 2,
        date: new Date(),
        Status_Condition: "invalid_status"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid appointment status");
  });

  test("Should return 409 if doctor already has an appointment at this time", async () => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);


    await supertest(server).post("/appointments/manual").send({
      doctorId: 1,
      userId: 2,
      date
    });

   
    const response = await supertest(server)
      .post("/appointments/manual")
      .send({
        doctorId: 1,
        userId: 3,
        date
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toBe("Doctor already has an appointment at this time");
  })
})
