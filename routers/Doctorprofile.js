const express = require('express');
const router = express.Router();
const { DoctorProfile, User } = require('../dbHandler');
const { Auth } = require('./auth')

router.get('/', async (req, res) => {
  try {
    const profiles = await DoctorProfile.findAll();
    res.status(200).json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch doctor profiles' });
  }
});


router.post('/', async (req, res) => {
  const { userId, Docname, description, profilKépUrl, specialty, treatments } = req.body;
  if (!userId || !Docname) {
    return res.status(400).json({ message: 'userId and Docname are required' });
  }
  const existingDoctor = await DoctorProfile.findOne({ where: { userId } });
  if (existingDoctor) {
    return res.status(409).json({ message: 'Doctor profile already exists for this user' });
  }
  const newDoctor = await DoctorProfile.create({
    userId,
    Docname,
    description,
    profilKépUrl,
    specialty,
    treatments,
    profilKész: true
  });
  res.status(201).json(newDoctor);
});

module.exports = router
