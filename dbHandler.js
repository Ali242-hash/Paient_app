const { Sequelize, DataTypes } = require('sequelize')

const dbHandler = new Sequelize('patientproject', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'test' ? false : console.log,
})

module.exports.User = dbHandler.define('users', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  fullname: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('patient', 'doctor', 'admin'), allowNull: false, defaultValue: 'patient' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
})

module.exports.DoctorProfile = dbHandler.define('doctorprofiles', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  Docname: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  profilKépUrl: { type: DataTypes.STRING, defaultValue: 'https://cdn.pixabay.com/photo/2015/05/26/09/05/doctor-784329_1280.png' },
  specialty: { type: DataTypes.STRING, allowNull: false },
  treatments: { type: DataTypes.STRING, allowNull: false },
  profilKész: { type: DataTypes.BOOLEAN, defaultValue: false },
})

module.exports.Shift = dbHandler.define('shifts', {
  id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  dátum: { type: DataTypes.DATEONLY, allowNull: false },
  típus: { type: DataTypes.ENUM('délelőtt', 'délután'), allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
})

module.exports.Timeslot = dbHandler.define('timeslots', {
  id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
   doctorId: { type: DataTypes.INTEGER, allowNull: false },
  shiftId: { type: DataTypes.INTEGER, allowNull: false },
  kezdes: { type: DataTypes.STRING, allowNull: false },
  veg: { type: DataTypes.STRING, allowNull: false },
  foglalt: { type: DataTypes.BOOLEAN, defaultValue: false },

})

module.exports.Appointment = dbHandler.define('appointments', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  timeslotId: { type: DataTypes.INTEGER, allowNull: false },
  páciensId: { type: DataTypes.INTEGER, allowNull: true },
  név: { type: DataTypes.STRING, allowNull: false },
  megjegyzés: { type: DataTypes.TEXT },
  létrehozásDátuma: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  Status: {
  type: DataTypes.ENUM("booked", "completed", "cancelled", "no_show"),
  allowNull: false,
  defaultValue: "booked"
}
})

module.exports.Specialization = dbHandler.define('specializations', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  név: { type: DataTypes.STRING, allowNull: false },
})

module.exports.Treatment = dbHandler.define('treatments', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  név: { type: DataTypes.STRING, allowNull: false },
})

module.exports.dbHandler = dbHandler
