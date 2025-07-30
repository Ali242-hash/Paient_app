const express = require('express');
const router = express.Router();
const { Shift, Timeslot } = require('../dbHandler');

router.get('/:doctorId/timeslots', async (req, res) => {
  try {
    const timeslots = await Timeslot.findAll({
      where: { doctorId: req.params.doctorId, foglalt: false }, 
      order: [['kezdes', 'ASC']]
    })
    res.json(timeslots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timeslots', error: error.message });
  }
})

router.post('/', async (req, res) => {
  const { doctorId, dátum, típus } = req.body;

  if (!doctorId || !dátum || !típus) {
    return res.status(400).json({ message: 'Information is incomplete' });
  }

  try {
    const existingShift = await Shift.findOne({
      where: { doctorId, dátum, típus }
    });

    if (existingShift) {
      return res.status(409).json({ message: 'Shift already exists' });
    }

    const newShift = await Shift.create({ doctorId, dátum, típus });
    const shiftId = newShift.id;

    const startHour = típus === 'délelőtt' ? 9 : 13
    const endHour = típus === 'délután' ? 13: 18
    const slots = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const kezdes = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const vegMinute = minute + 15;
        const vegHour = vegMinute >= 60 ? hour + 1 : hour;
        const veg = `${vegHour.toString().padStart(2, '0')}:${(vegMinute % 60).toString().padStart(2, '0')}`;

        const timeslot = await Timeslot.create({
          doctorId,
          shiftId,
          dátum,
          típus,
          kezdes, 
          veg,  
          foglalt: false
        });

        slots.push(timeslot);
      }
    }

    res.status(201).json({ 
      shift: newShift,
      timeslots: slots 
    });
  } catch (error) {
    console.error('Shift creation failed:', error);
    res.status(500).json({ 
      message: 'Shift not created', 
      error: error.message 
    });
  }
});

module.exports = router;