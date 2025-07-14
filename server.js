const express = require('express')
const server = express()
const { dbHandler, User, Appointment, DoctorProfile, Shift, Timeslot, Specialization, Treatment } = require('./dbHandler')
const JWT = require('jsonwebtoken')
const cors = require('cors');
require('dotenv').config()

const PORT = process.env.PORT || 3000
const secretkey = process.env.SECRETKEY
const expiresIn = process.env.EXPIRESIN || '3h'

server.use(express.json())
server.use(cors())

User.sync({ alter: true });
DoctorProfile.sync({ alter: true });
Shift.sync({ alter: true });
Timeslot.sync({ alter: true });
Appointment.sync({ alter: true });
Specialization.sync({ alter: true });
Treatment.sync({ alter: true });

;(async () => {
  await dbHandler.sync({ alter: true })
})()

server.get('/users', async (req, res) => {
  res.status(200).json(await User.findAll()).end()
})

server.post('/shifts', async (req, res) => {
  const { doctorId, dátum, típus } = req.body;

  if (!doctorId || !dátum || !típus) {
    return res.status(400).json({ message: 'Information is incomplete' }).end();
  }

  try {
    const existingShift = await Shift.findOne({
      where: { doctorId, dátum, típus }
    });

    if (existingShift) {
      return res.status(409).json({ message: 'Shift already exists' }).end();
    }

    const newShift = await Shift.create({ doctorId, dátum, típus });

    const start = new Date(`${dátum}T09:00:00`);
    const end = new Date(`${dátum}T17:00:00`);
    const slots = [];

    while (start < end) {
      slots.push({
        doctorId,
        dátum,
        típus,
        from: new Date(start),
        to: new Date(start.getTime() + 15 * 60000)
      });
      start.setMinutes(start.getMinutes() + 15);
    }

    res.status(201).json({ message: 'shitfs created', newShift, slots }).end()
  } catch (error) {
    res.status(500).json({ message: 'Shift not created', error }).end()
  }
});

server.get('/appointments/free/:doctorId', async (req, res) => {
  const { doctorId } = req.params;

  try {
    const allslots = await Timeslot.findAll({ where: { doctorId } })
    const booked = await Appointment.findAll({ where: { doctorId } })

    const bookedslotId = booked.map(app => app.timeslotId);
    const freeslotId = allslots.filter(slot => !bookedslotId.includes(slot.id));

    return res.status(200).json(freeslotId).end()
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal error' }).end();
  }
})

server.get('/admin', async (req, res) => {
  const admins = await User.findAll({ where: { role: 'admin' } })
  res.status(200).json(admins).end()
})

server.post('/user', async (req, res) => {
  const { NewFullName, NewEmail, NewUsername, NewPassword } = req.body

  const OneUser = await User.findOne({ where: { username: NewUsername } })
  if (OneUser) {
    return res.status(409).json({ message: 'This user has already registered' }).end()
  }

  await User.create({
    fullname: NewFullName, 
    email: NewEmail,
    username: NewUsername,
    password: NewPassword,
    role: 'patient',
    active: true
  })

  res.json({ message: 'Registered Successfully' }).end()
})

server.delete('/user/:id', async (req, res) => {
  const { id } = req.params
  const OneUser = await User.findOne({ where: { id } })
  if (!OneUser) {
    return res.status(404).json({ message: 'This user has not been found in the system' }).end()
  }
  await User.destroy({ where: { id } })
  res.status(204).end()
})

server.get('/Doctorprofiles', async (req, res) => {
  const profiles = await DoctorProfile.findAll()
  res.status(200).json(profiles)
})

server.post('/Doctorprofiles', async (req, res) => {
  const {NewdocId,NewdocName,NewdocDescription,NewDocprofilekep,NewdocSpeciality,NewdocTreatment,Newdocprofikesz} = req.body;

  const oneDoctor = await DoctorProfile.findOne({
    where: { NewdocId }
  });

  if (oneDoctor) {
    return res.status(409).json({ "message": "This doctor is already in the system" }).end();
  }

  await DoctorProfile.create({
    NewdocId,
    NewdocName,
    NewdocDescription,
    NewDocprofilekep,
    NewdocSpeciality,
    NewdocTreatment,
    Newdocprofikesz
  });

  res.status(201).json({ "message": "Doctor profile has been created" }).end();
})

server.post('/admin', async (req, res) => {
  const { NewAdminName, NewAdminEmail, NewAdminUsername, NewAdminPass } = req.body
  const oneAdmin = await User.findOne({ where: { username: NewAdminUsername } })
  if (oneAdmin) {
    return res.status(409).json({ message: 'This Admin has already registered' }).end()
  }
  await User.create({
    email: NewAdminEmail,
    username: NewAdminUsername,
    password: NewAdminPass,
    role: 'admin',
    active: true
  })
  res.json({ message: 'Registered Successfully' }).end()
})

server.post('/auth/login', async (req, res) => {
  const { loginUsername, loginPassword } = req.body
  const OneUser = await User.findOne({ where: { username: loginUsername } })
  if (OneUser && OneUser.password === loginPassword) {
    const token = JWT.sign({ username: OneUser.username, role: OneUser.role }, secretkey, { expiresIn })
    return res.json({ token, role: OneUser.role, message: 'login was successful' }).end()
  }
  res.json({ message: 'There is an issue on your login please try again' }).end()
})

server.post('/auth/register', async (req, res) => {
  const { RegisterUsername, RegisterPassword, role, RegisterEmail } = req.body
  console.log('Register data:', req.body);
  const OneUser = await User.findOne({ where: { username: RegisterUsername } })
  if (OneUser) {
    return res.status(409).json({ message: 'You have already registered please use your credentials instead' }).end()
  }
  await User.create({
    username: RegisterUsername,
    password: RegisterPassword,
    email: RegisterEmail || '',
    role: role || 'patient',
    active: true
  })
  res.status(201).json({ message: 'Registration successful' }).end()
})

server.get('/appointments', async (req, res) => {
  res.status(200).json(await Appointment.findAll()).end()
})

server.post('/appointment', async (req, res) => {
  const { timeslotId, páciensId, név, megjegyzés } = req.body
  const existingAppointment = await Appointment.findOne({ where: { timeslotId } })
  if (existingAppointment) {
    return res.status(409).json({ message: 'This slot has already been booked, please try another' }).end()
  }
  await Appointment.create({
    timeslotId,
    páciensId: páciensId || null,
    név,
    megjegyzés,
    létrehozásDátuma: new Date()
  })
  res.status(201).json({ message: 'Your appointment was successful' }).end()
})

server.delete('/appointment/:id', async (req, res) => {
  const { id } = req.params
  const oneappointment = await Appointment.findOne({ where: { id } })
  if (!oneappointment) {
    return res.status(404).json({ message: 'No appointment has been found' }).end()
  }
  await Appointment.destroy({ where: { id } })
  res.json({ message: 'Your appointment deleted successfully' }).end()
})

server.put('/save', Auth(), async (req, res) => {
  const { NewUsername, NewPassword } = req.body
  const OneUser = await User.findOne({ where: { username: NewUsername } })
  if (!OneUser) {
    return res.status(404).json({ message: 'This patient is not in the system' }).end()
  }
  OneUser.password = NewPassword
  OneUser.username = NewUsername
  await OneUser.save()
  res.json({ message: 'Your information saved successfully' }).end()
})

function Auth() {
  return (req, res, next) => {
    const authhead = req.headers.authorization
    if (!authhead) {
      return res.status(401).json({ message: 'Invalid token' }).end()
    }
    const tokenParts = authhead.split(' ')
    if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
      return res.status(401).json({ message: 'There is no valid token' }).end()
    }
    try {
      const decodedToken = JWT.verify(tokenParts[1], secretkey)
      req.username = decodedToken.username
      req.role = decodedToken.role
      next()
    } catch {
      return res.status(401).json({ message: 'Invalid token' }).end()
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
