const express = require('express');
const router = express.Router();
const { Appointment, Timeslot } = require('../dbHandler');


router.get('/free/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const allSlots = await Timeslot.findAll({ 
      where: { 
        doctorId,
        foglalt: false 
      }
    });
    
    const bookedSlots = await Appointment.findAll({ 
      where: { doctorId },
      include: [Timeslot]
    });

    const bookedSlotIds = bookedSlots.map(app => app.timeslotId);
    const freeSlots = allSlots.filter(slot => !bookedSlotIds.includes(slot.id));

    return res.status(200).json(freeSlots);
  } catch (error) {
    console.error('Error fetching free slots:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [Timeslot] 
    });
    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { timeslotId, páciensId, név, megjegyzés } = req.body;

    if (!timeslotId || !név) {
      return res.status(400).json({ message: 'Timeslot ID and patient name are required' });
    }

    const existingAppointment = await Appointment.findOne({ where: { timeslotId } });
    if (existingAppointment) {
      return res.status(409).json({ 
        message: 'This slot has already been booked, please try another' 
      });
    }


    await Timeslot.update(
      { foglalt: true },
      { where: { id: timeslotId } }
    );

    const newAppointment = await Appointment.create({
      timeslotId,
      páciensId: páciensId || null,
      név,
      megjegyzés,
      létrehozásDátuma: new Date()
    });

    return res.status(201).json({ 
      message: 'Appointment created successfully',
      appointment: newAppointment 
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({ 
      where: { id },
      include: [Timeslot]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

   
    await Timeslot.update(
      { foglalt: false },
      { where: { id: appointment.timeslotId } }
    );

    await Appointment.destroy({ where: { id } });
    return res.status(200).json({ 
      message: 'Appointment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;