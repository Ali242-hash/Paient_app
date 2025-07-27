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

 
    const start = new Date(`${dátum}T${típus === 'délelőtt' ? '09:00:00' : '13:00:00'}`);
    const end = new Date(`${dátum}T${típus === 'délelőtt' ? '12:00:00' : '17:00:00'}`);
    const slots = [];

    let current = new Date(start);
    while (current < end) {
      const slotEnd = new Date(current.getTime() + 15 * 60000);
      
      try {
        const timeslot = await Timeslot.create({
          doctorId,
          shiftId,
          dátum,
          típus,
          from: current,
          to: slotEnd,
          foglalt: false
        });
        slots.push(timeslot);
      } catch (err) {
        console.error('Failed to create timeslot:', err);
        continue;
      }
      
      current = new Date(slotEnd);
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