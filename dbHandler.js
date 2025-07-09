
const { Sequelize, DataTypes } = require('sequelize')
const dbHandler = new Sequelize('patientproject', 'root', '', {
  host: '127.1.1.1',
  dialect: 'mysql'
})

exports.User = dbHandler.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
   fullname: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('patient', 'doctor', 'admin'), allowNull: false, defaultValue: 'patient' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
})

exports.DoctorProfile = dbHandler.define('DoctorProfile', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  Docname: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  profilKépUrl: { type: DataTypes.STRING, defaultValue: 'https://cdn.pixabay.com/photo/2015/05/26/09/05/doctor-784329_1280.png' },
  specialty: { type: DataTypes.STRING, allowNull: false },
  treatments: { type: DataTypes.STRING, allowNull: false },
  profilKész: { type: DataTypes.BOOLEAN, defaultValue: false }
})

exports.Shift = dbHandler.define('Shift', {
  id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  dátum: { type: DataTypes.DATEONLY, allowNull: false },
  típus: { type: DataTypes.ENUM('délelőtt', 'délután'), allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
})

exports.Timeslot = dbHandler.define('Timeslot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  shiftId: { type: DataTypes.INTEGER, allowNull: false },
  kezdes: { type: DataTypes.STRING, allowNull: false },
  veg: { type: DataTypes.STRING, allowNull: false },
  foglalt: { type: DataTypes.BOOLEAN, defaultValue: false }
})

exports.Appointment = dbHandler.define('Appointment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  timeslotId: { type: DataTypes.INTEGER, allowNull: false },
  páciensId: { type: DataTypes.INTEGER, allowNull: true },
  név: { type: DataTypes.STRING, allowNull: false },
  megjegyzés: { type: DataTypes.TEXT },
  létrehozásDátuma: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
})

exports.Specialization = dbHandler.define('Specialization', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  név: { type: DataTypes.STRING, allowNull: false }
})

exports.Treatment = dbHandler.define('Treatment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  név: { type: DataTypes.STRING, allowNull: false }
})

exports.dbHandler = dbHandler
