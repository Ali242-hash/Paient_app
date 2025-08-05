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
const { router: authRouter, Auth } = require('./routers/auth')




server.use(express.json());
server.use(cors());




server.use('/users', userRouters);
server.use('/appointments', RouterAppointment);
server.use('/doctorProfiles', DoctorProRoute);
server.use('/auth', authRouter);
server.use('/shifts', Shiftrouter);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})