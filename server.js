const express = require('express')
const server = express()
const db = require('./dbHandler')    

const { 
  dbHandler, 
  User, 
  DoctorProfile, 
  Appointment, 
  Shift, 
  Timeslot, 
  Treatment, 
  Specialization 
} = db;

const JWT = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()

const userRouters = require('./routers/user')
const RouterAppointment = require('./routers/appointment')
const DoctorProRoute = require('./routers/Doctorprofile')
const Shiftrouter = require('./routers/Shift')
const authRouter = require('./routers/auth')

const PORT = process.env.PORT || 3000

server.use(express.json())
server.use(cors())

server.use('/users', userRouters)
server.use('/appointments', RouterAppointment)
server.use('/doctorProfiles', DoctorProRoute)
server.use('/auth', authRouter)
server.use('/shifts', Shiftrouter)


Promise.all([
  User.sync({ alter: true }),
  DoctorProfile.sync({ alter: true }),
  Shift.sync({ alter: true }),
  Timeslot.sync({ alter: true }),
  Appointment.sync({ alter: true }),
  Specialization.sync({ alter: true }),
  Treatment.sync({ alter: true })
])
.then(() => {
  console.log('All models were synchronized successfully');
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('Model synchronization failed:', err);
});


;(async () => {
  try {
    await dbHandler.sync({ alter: true })
    console.log('Database synced successfully.')
  } catch (err) {
    console.error('Database sync failed:', err)
  }
})()

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = server 