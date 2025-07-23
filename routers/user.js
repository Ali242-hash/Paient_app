const express = require('express');
const router = express.Router();
const { User } = require('../dbHandler');
const { Model } = require('sequelize');

router.get('/', (req, res) => {
  res.json({ message: 'User route works!' });
});

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const admins = await User.findAll({ where: { role: 'admin' } });
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admins', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { NewAdminName, NewAdminEmail, NewAdminUsername, NewAdminPass } = req.body;

    if (!NewAdminUsername || !NewAdminPass) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existing = await User.findOne({ where: { username: NewAdminUsername } });
    if (existing) {
      return res.status(409).json({ message: 'This Admin has already registered' });
    }

    await User.create({
      fullname: NewAdminName,
      email: NewAdminEmail,
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

router.post('/', async (req, res) => {
  try {
    const { NewFullName, NewEmail, NewUsername, NewPassword } = req.body;

    if (!NewUsername || !NewPassword) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existing = await User.findOne({ where: { username: NewUsername } });
    if (existing) {
      return res.status(409).json({ message: 'This user has already registered' });
    }

    await User.create({
      fullname: NewFullName,
      email: NewEmail,
      username: NewUsername,
      password: NewPassword, 
      role: 'patient',
      active: true
    });

    res.json({ message: 'Registered Successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { id } = req.params;

    const oneUser = await User.findOne({ where: { id } });
    if (!oneUser) {
      return res.status(404).json({ message: 'This user has not been found in the system' });
    }

    await User.destroy({ where: { id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

module.exports = router