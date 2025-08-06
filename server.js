const express = require('express');
const server = express();
const db = require('./dbHandler');



const JWT = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();


const userRouters = require('./routers/user');
const RouterAppointment = require('./routers/appointment');
const DoctorProRoute = require('./routers/Doctorprofile');
const Shiftrouter = require('./routers/Shift');
const { router: authRouter} = require('./routers/auth')

const {
  User,
  Appointment,
  Specialization,
  Shift,
  DoctorProfile,
  Treatment,
  Timeslot
} = db


server.use(express.json());
server.use(cors());

User.sync({alter:true})
Appointment.sync({alter:true})
Specialization.sync({alter:true})
Shift.sync({alter:true})
DoctorProfile.sync({alter:true})
Treatment.sync({alter:true})
Timeslot.sync({alter:true})


server.use('/users', userRouters);
server.use('/appointments', RouterAppointment);
server.use('/doctorProfiles', DoctorProRoute);
server.use('/auth', authRouter);
server.use('/shifts', Shiftrouter);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})