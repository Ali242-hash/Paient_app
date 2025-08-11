const express = require('express');
const request = require('supertest');
const db = require('./dbHandler');
const { User, DoctorProfile, Shift, Timeslot } = db;
const shiftRouter = require('./routers/Shift');
const server = express();
server.use(express.json());
server.use('/shifts', shiftRouter)

describe('Shift Routes', () => {

  test('should return 409 if shift already exists', async () => {
    
    const testUser = await User.create({
      fullname: 'Test Doctor',
      email: 'doctor409@example.com',
      username: 'doctor409',
      password: 'password123',
      role: 'doctor',
      active: true,
    });

    const testDoctorProfile = await DoctorProfile.create({
      userId: testUser.id,
      Docname: 'Dr. Conflict',
      specialty: 'General',
      treatments: 'General',
      profilKész: true,
    });

    await Shift.create({
      doctorId: testDoctorProfile.id,
      dátum: '2025-01-01',
      típus: 'délelőtt',
      active: true,
    });

    try {
      const response = await request(server)
        .post('/shifts')
        .send({
          doctorId: testDoctorProfile.id,
          dátum: '2025-01-01',
          típus: 'délelőtt',
        });

      expect(response.status).toBe(409);
    } finally {
      await Shift.destroy({ where: { doctorId: testDoctorProfile.id } });
      await DoctorProfile.destroy({ where: { userId: testUser.id } });
      await User.destroy({ where: { id: testUser.id } });
    }
  });

  test('should return 201 and create shift with timeslots', async () => {
    await db.dbHandler.sync({ force: true });

    const testUser = await User.create({
      fullname: 'Test Doctor',
      email: 'doctor201@example.com',
      username: 'doctor201',
      password: 'password123',
      role: 'doctor',
      active: true,
    });

    const testDoctorProfile = await DoctorProfile.create({
      userId: testUser.id,
      Docname: 'Dr. 201',
      specialty: 'General',
      treatments: 'General',
      profilKész: true,
    });

    try {
      const response = await request(server)
        .post('/shifts')
        .send({
          doctorId: testDoctorProfile.id,
          dátum: '2025-01-02',
          típus: 'délután',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('shift');
      expect(response.body).toHaveProperty('timeslots');
    } finally {
      await Timeslot.destroy({ where: {} });
      await Shift.destroy({ where: { doctorId: testDoctorProfile.id } });
      await DoctorProfile.destroy({ where: { userId: testUser.id } });
      await User.destroy({ where: { id: testUser.id } });
    }
  });
});
