const express = require('express');
const cors = require('cors')
const server = express()

server.use(express.json());
server.use(cors());

const db = require('./dbHandler');
require('dotenv').config();

const userRouters = require('./routers/user');
const RouterAppointment = require('./routers/appointment');
const DoctorProRoute = require('./routers/Doctorprofile');
const Shiftrouter = require('./routers/Shift');
const authRouter = require('./routers/auth')
const treatRouter = require("./routers/treatment")
const adminrouter = require("./routers/admin")

const {
  User,
  Appointment,
  Specialization,
  Shift,
  DoctorProfile,
  Treatment,
  Timeslot
} = db;

User.sync({ alter: true });
Appointment.sync({ alter: true });
Specialization.sync({ alter: true });
Shift.sync({ alter: true });
DoctorProfile.sync({ alter: true });
Treatment.sync({ alter: true });
Timeslot.sync({ alter: true });

server.use('/users', userRouters);
server.use('/appointments', RouterAppointment);
server.use('/doctorProfiles', DoctorProRoute);
server.use('/auth', authRouter);
server.use('/shifts', Shiftrouter);
server.use('/treatments', treatRouter)
server.use("/admin",adminrouter)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
