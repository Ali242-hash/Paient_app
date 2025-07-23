const express = require('express');
const router = express.Router();
const { DoctorProfile } = require('../dbHandler');

router.get('/', async (req, res) => {
  try {
    const profiles = await DoctorProfile.findAll();
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doctor profiles', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    id,
    userId,
    Docname,
    description,
    profilKépUrl,
     specialty,
     treatments,
    profilKész = true;

    const existingDoctor = await DoctorProfile.findOne({ where: { id } });

    if (existingDoctor) {
      return res.status(409).json({ message: 'This doctor is already in the system' });
    }

    await DoctorProfile.create({
      id,
      userId,
      Docname,
      description,
      profilKépUrl,
      specialty,
      treatments,
      profilKész
    });

    res.status(201).json({ message: 'Doctor profile has been created' });
  } catch (err) {
    res.status(500).json({ message: 'Doctor profile creation failed', error: err.message });
  }
});


module.exports = router;
