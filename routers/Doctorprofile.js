const express = require('express');
const router = express.Router();
const db = require('../dbHandler');
const DoctorProfile = db.DoctorProfile;

router.get('/', async (req, res) => {
  try {
    const profiles = await DoctorProfile.findAll({
      include: [{ model: db.User }] 
    });
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch doctor profiles', 
      error: err.message 
    });
  }
});

router.post('/', async (req, res) => {
  const { userId, Docname, description, profilKépUrl, specialty, treatments } = req.body;

  try {
   
    const existingDoctor = await DoctorProfile.findOne({ 
      where: { userId } 
    });

    if (existingDoctor) {
      return res.status(409).json({ 
        message: 'Doctor profile already exists for this user'
      });
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
    
  } catch (error) {
    console.error('Error creating doctor profile:', error);
    res.status(500).json({ 
      message: 'Error creating doctor profile',
      error: error.message 
    });
  }
});

module.exports = router;