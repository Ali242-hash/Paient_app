const express = require('express');
const router = express.Router();
const { User } = require('../dbHandler');
const { Model } = require('sequelize');

router.get('/users/all', (req, res) => {
  res.json({ message: 'User route works!' });
});

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({  message: 'Forbidden: Admin access required' });
  }
  next();
};

router.get('/all', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

router.get('/users/all', async (req, res) => {
  try {
    const admins = await User.findAll({ where: { role: 'admin' } });
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admins', error: err.message });
  }
});

router.post('/users/register-admin', async (req, res) => {
  try {
      const { 
      fullname, 
      NewAdminName,
      email,
      NewAdminEmail,
      username,
      NewAdminUsername,
      password,
      NewAdminPass
    } = req.body;

    const finalFullname = fullname || NewAdminName;
    const finalEmail = email || NewAdminEmail;
    const finalUsername = username || NewAdminUsername;
    const finalPassword = password || NewAdminPass;

  if (!finalUsername || !finalPassword) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existing = await User.findOne({ where: { username: NewAdminUsername } });
    if (existing) {
      return res.status(409).json({ message: 'This Admin has already registered' });
    }

    await User.create({
      fullname: finalFullname,
      email: finalEmail,
      username: NewAdminUsername,
      password: NewAdminPass,  
      role: 'admin',
      active: true
    });

    res.status(201).json({ message: 'Registered Successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering admin', error: err.message });
  }
});

router.post('/register-admin', async (req, res) => {
  try {
        const { 
      fullname = req.body.NewAdminName,
      email = req.body.NewAdminEmail,
      username = req.body.NewAdminUsername,
      password = req.body.NewAdminPass
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existing = await User.findOne({where:{username}})
    if (existing) {
      return res.status(409).json({ message: 'This Admin has already registered' });
    }

    await User.create({
      fullname,
      email,
      username,
      password,
      role: 'admin',
      active: true
    });

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const oneUser = await User.findByPk(id); 
    
    if (!oneUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await oneUser.destroy();
    return res.status(204).json();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});
module.exports = router