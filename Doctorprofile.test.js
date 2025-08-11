const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const { User, DoctorProfile } = db;
const bcrypt = require('bcrypt');

const server = express();
server.use(express.json());
const DoctorProRoute = require('./routers/Doctorprofile');
server.use('/doctorprofiles', DoctorProRoute);

const request = supertest(server);

describe('POST /doctorprofiles', () => {
  test('should return 409 if doctor profile already exists', async () => {
    const unique = Date.now();
    const hashedPassword = await bcrypt.hash('password123', 10);

    const testUser = await User.create({
      fullname: 'Test Doctor',
      email: `testdoctor${unique}@example.com`,
      username: `testdoctor${unique}`,
      password: hashedPassword,
      role: 'doctor',
      active: true,
    });

    await DoctorProfile.create({
      userId: testUser.id,
      Docname: 'Dr. Test',
      description: 'Test description',
      profilKépUrl: 'https://example.com/doctor.jpg',
      specialty: 'General',
      treatments: 'General',
      profilKész: true,
    });

    const response = await request.post('/doctorprofiles').send({
      userId: testUser.id,
      Docname: 'Dr Test Duplicate',
      specialty: 'General',
      treatments: 'General',
    });

    expect(response.status).toBe(409);
   

   
  });

  test('should create a new doctor profile and return 201', async () => {
    const unique = Date.now();
    const hashedPassword = await bcrypt.hash('securepass', 10);

    const newUser = await User.create({
      fullname: 'Anna',
      email: `anna${unique}@example.com`,
      username: `annak${unique}`,
      password: hashedPassword,
      role: 'doctor',
      active: true,
    });

    const response = await request.post('/doctorprofiles').send({
      userId: newUser.id,
      Docname: 'Dr. Anna Kovacs',
      description: 'Cardiology specialist',
      profilKépUrl: 'https://example.com/anna.jpg',
      specialty: 'Cardiology',
      treatments: 'Heart Disease',
      profilKész: true,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId', newUser.id);
    expect(response.body).toHaveProperty('Docname', 'Dr. Anna Kovacs');

    await DoctorProfile.destroy({ where: { userId: newUser.id } });
    await User.destroy({ where: { id: newUser.id } });
  })
})
