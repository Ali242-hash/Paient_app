const express = require('express');
const supertest = require('supertest');
const DoctorProRoute = require('./routers/Doctorprofile');
const db = require('./dbHandler');

const sequelize = db.dbHandler;
const { User, DoctorProfile } = db;

if (!sequelize) {
  throw new Error("Sequelize instance not found in dbHandler");
}

const app = express();
app.use(express.json());
app.use('/doctorprofiles', DoctorProRoute);

const request = supertest(app);

describe('POST /doctorprofiles', () => {
  let testUserId;

  beforeAll(async () => {
    try {
     
      await DoctorProfile.destroy({ where: {} });
      await User.destroy({ where: {} });

      
      const testUser = await User.create({
        fullname: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
        role: 'doctor',
        active: true,
      });
      testUserId = testUser.id;

   
      await DoctorProfile.create({
        userId: testUserId,
        Docname: 'Dr. Test',
        description: 'Test description',
        profilKépUrl: 'https://example.com/doctor.jpg',
        specialty: 'General',
        treatments: 'General',
        profilKész: true,
      });
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
 
      if (testUserId) {
        await DoctorProfile.destroy({ where: { userId: testUserId } });
        await User.destroy({ where: { id: testUserId } });
      }
      await sequelize.close();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  test('should return 409 if doctor already exists', async () => {
    const response = await request.post('/doctorprofiles').send({
      userId: testUserId,
      Docname: 'Dr. Test',
      specialty: 'General',
      treatments: 'General'
    });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('message', 'Doctor profile already exists for this user'); // Updated message
  });

  test('should create a new doctor profile and return 201', async () => {
    const newUser = await User.create({
      fullname: 'Anna',
      email: 'anna@example.com',
      username: 'annak',
      password: 'secure',
      role: 'doctor',
      active: true,
    });

    const response = await request.post('/doctorprofiles').send({
      userId: newUser.id,
      Docname: 'Dr. Anna Kovacs',
      description: 'Cardiology',
      profilKépUrl: 'https://cdn.pixabay.com/photo/2024/01/19/18/52/ai-generated-8519596_1280.png',
      specialty: 'Cardiology',
      treatments: 'Heart Disease',
      profilKész: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Doctor profile created successfully');


    await DoctorProfile.destroy({ where: { userId: newUser.id } });
    await User.destroy({ where: { id: newUser.id } });
  });
});