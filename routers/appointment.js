const express = require('express');
const router = express.Router();
const { Appointment, Timeslot } = require('../dbHandler')


router.get('/', async (req, res) => {
  const { doctorId } = req.params;

  try {
    const allslots = await Timeslot.findAll({ where: { doctorId } })
    const booked = await Appointment.findAll({ where: { doctorId } })

    const bookedslotId = booked.map(app => app.timeslotId);
    const freeslots = allslots.filter(slot => !bookedslotId.includes(slot.id))

    return res.status(200).json(freeslots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal error' });
  }
});


router.get('/', async (req, res) => {
  const allAppointments = await Appointment.findAll();
  res.status(200).json(allAppointments);
});


router.post('/', async (req, res) => {
  const { timeslotId, páciensId, név, megjegyzés } = req.body;

  const existingAppointment = await Appointment.findOne({ where: { timeslotId } })
  if (existingAppointment) {
    return res.status(409).json({ message: 'This slot has already been booked, please try another' })
  }

  await Appointment.create({
    timeslotId,
    páciensId: páciensId || null,
    név,
    megjegyzés,
    létrehozásDátuma: new Date()
  });

  res.status(201).json({ message: 'Your appointment was successful' });
});


router.delete('/', async (req, res) => {
  const { id } = req.params;

  const oneAppointment = await Appointment.findOne({ where: { id } })
  if (!oneAppointment) {
    return res.status(404).json({ message: 'No appointment has been found' })
  }

  await Appointment.destroy({ where: { id } })
  res.status(200).json({ message: 'Your appointment was deleted successfully' })
});

module.exports = router
