
const { Sequelize, DataTypes } = require('sequelize');

const dbHandler = new Sequelize('patientproject', 'root', '', {
  host: '127.0.0.1',  
  dialect: 'mysql',
});

const user = dbHandler.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  fullname: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('patient', 'doctor', 'admin'), allowNull: false, defaultValue: 'patient' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const doctorProfile = dbHandler.define('DoctorProfile', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  Docname: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  profilKépUrl: { type: DataTypes.STRING, defaultValue: 'https://cdn.pixabay.com/photo/2015/05/26/09/05/doctor-784329_1280.png' },
  specialty: { type: DataTypes.STRING, allowNull: false },
  treatments: { type: DataTypes.STRING, allowNull: false },
  profilKész: { type: DataTypes.BOOLEAN, defaultValue: false },
});


const shift = dbHandler.define('Shift', {
  id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  dátum: { type: DataTypes.DATEONLY, allowNull: false },
  típus: { type: DataTypes.ENUM('délelőtt', 'délután'), allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

const timeslot = dbHandler.define('Timeslot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  shiftId: { type: DataTypes.INTEGER, allowNull: false },
  kezdes: { type: DataTypes.STRING, allowNull: false },
  veg: { type: DataTypes.STRING, allowNull: false },
  foglalt: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const appointment = dbHandler.define('Appointment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  timeslotId: { type: DataTypes.INTEGER, allowNull: false },
  páciensId: { type: DataTypes.INTEGER, allowNull: true },
  név: { type: DataTypes.STRING, allowNull: false },
  megjegyzés: { type: DataTypes.TEXT },
  létrehozásDátuma: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const specialization = dbHandler.define('Specialization', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  név: { type: DataTypes.STRING, allowNull: false },
});

const treatment = dbHandler.define('Treatment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  név: { type: DataTypes.STRING, allowNull: false },
});


user.hasOne(doctorProfile, { foreignKey: 'userId' });
doctorProfile.belongsTo(user, { foreignKey: 'userId' });

doctorProfile.hasMany(timeslot, { foreignKey: 'doctorId' });
timeslot.belongsTo(doctorProfile, { foreignKey: 'doctorId' });

doctorProfile.hasMany(shift, { foreignKey: 'doctorId' });
shift.belongsTo(doctorProfile, { foreignKey: 'doctorId' });

shift.hasMany(timeslot, { foreignKey: 'shiftId' });
timeslot.belongsTo(shift, { foreignKey: 'shiftId' });

timeslot.hasOne(appointment, { foreignKey: 'timeslotId' });
appointment.belongsTo(timeslot, { foreignKey: 'timeslotId' });

user.hasMany(appointment, { foreignKey: 'páciensId' });
appointment.belongsTo(user, { foreignKey: 'páciensId' });

doctorProfile.hasMany(treatment, { foreignKey: 'doctorId' });
treatment.belongsTo(doctorProfile, { foreignKey: 'doctorId' });

timeslot.hasMany(appointment, { foreignKey: 'timeslotId' })


module.exports = {
  dbHandler,
  User: user,
  DoctorProfile: doctorProfile,
  Shift: shift,
  Timeslot: timeslot,
  Appointment: appointment,
  Specialization: specialization,
  Treatment: treatment
}