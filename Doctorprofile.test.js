const express = require('express');
const supertest = require('supertest');
const db = require('./dbHandler');
const sequelize = db.dbHandler;
const { User, DoctorProfile } = db;

const app = express();
app.use(express.json());
const DoctorProRoute = require('./routers/Doctorprofile');
app.use('/doctorprofiles', DoctorProRoute);

beforeAll(async()=>{
  try{
       await sequelize.sync({alter:true})
       console.log('Database synced successfully')
  }

  catch(error){
  console.error('Database sync failed:', error);
    process.exit(1)
  }
})

const request = supertest(app);

describe('POST /doctorprofiles', () => {
  let testUser;
  let testDoctorProfile;

  beforeAll(async () => {
    try {

      testUser = await User.create({
        fullname: 'Test Doctor',
        email: 'testdoctor@example.com',
        username: 'testdoctor',
        password: 'password123',
        role: 'doctor',
        active: true,
      });

  
      testDoctorProfile = await DoctorProfile.create({
        userId: testUser.id,
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
      await DoctorProfile.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  test('should return 409 if doctor already exists', async () => {
    const response = await request.post('/doctorprofiles').send({
      userId: testUser.id,
      Docname: 'Dr Test Duplicate',
      specialty: 'General',
      treatments: 'General'
    })

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('message', 'Doctor profile already exists for this user');
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
      description: 'Cardiology specialist',
      profilKépUrl: 'https://example.com/anna.jpg',
      specialty: 'Cardiology',
      treatments: 'Heart Disease',
      profilKész: true,
    });

    expect(response.status).toBe(201);
    

    await DoctorProfile.destroy({ where: { userId: newUser.id } });
    await User.destroy({ where: { id: newUser.id } });
  });
});

afterAll(async () => {
  await sequelize.close();
});