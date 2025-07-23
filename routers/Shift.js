const express = require('express');
const router = express.Router();
const { Shift, Timeslot } = require('../dbHandler');

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

    const start = new Date(`${dátum}T09:00:00`);
    const end = new Date(`${dátum}T17:00:00`);
    const slots = [];

    while (start < end) {
      const to = new Date(start.getTime() + 15 * 60000);
      const timeslot = await Timeslot.create({
        doctorId,
        shiftId:newShift.id,
        dátum,
        típus,
        from: new Date(start),
        to
      });

      slots.push(timeslot);
      start.setMinutes(start.getMinutes() + 15);
    }

    res.status(201).json({ message: 'Shifts created', newShift, slots });
  } catch (error) {
    console.error('Shift creation failed:', error)
    res.status(500).json({ message: 'Shift not created', error: error.message })
  }
});

module.exports = router;