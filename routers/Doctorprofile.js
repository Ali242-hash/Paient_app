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
  try {
    const {
      userId,
      Docname,
      description,
      profilKépUrl,
      specialty,
      treatments,
      profilKész = true
    } = req.body;


    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

   
    const existingProfile = await DoctorProfile.findOne({ 
      where: { userId } 
    });
    
    if (existingProfile) {
      return res.status(409).json({ 
        message: 'Doctor profile already exists for this user' 
      });
    }

    const newProfile = await DoctorProfile.create({
      userId,
      Docname,
      description,
      profilKépUrl,
      specialty,
      treatments,
      profilKész
    });

    res.status(201).json({
      message: 'Doctor profile created successfully',
      profile: newProfile
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Doctor profile creation failed', 
      error: err.message 
    });
  }
});

module.exports = router;