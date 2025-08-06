const express = require('express');
const router = express.Router();
const { User } = require('../dbHandler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Auth } = require('./auth');


const secretKey = process.env.secretKey

router.post('/auth/register', async (req, res) => {
  const { RegisterUsername, RegisterPassword, RegisterEmail, fullname, role } = req.body;

  try {
    if (!RegisterUsername || !RegisterPassword) {
      return res.status(401).json({ message: 'Username or password are required' }).end();
    }

    const existingUser = await User.findOne({ where: { username: RegisterUsername } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists in our database' }).end();
    }

    const hashedPassword = await bcrypt.hash(RegisterPassword, 10);

    await User.create({
      username: RegisterUsername,
      password: hashedPassword,
      email: RegisterEmail || '',
      fullname,
      role: role || 'patient',
      active: true,
    });

    return res.status(201).json({ message: 'User created successfully' }).end();
  } catch (error) {
    res.status(500).json({ message: 'Internal error', error: error.message });
  }
})

router.post('/register-admin', async (req, res) => {
  try {
    const { loginUsername, loginPassword } = req.body;

    if (!loginUsername || !loginPassword) {
      return res.status(401).json({ message: 'Admin not found' }).end();
    }

    const AdminUser = await User.findOne({ where: { username: loginUsername } });

    if (AdminUser) {
      return res.status(409).json({ message: 'Admin already exists' }).end();
    }

    if (loginUsername === 'admin@admin.com' && loginPassword === '123qwe') {
      const token = jwt.sign(
        { id: 0, username: 'admin@admin.com', role: 'admin' },
        secretKey,
        { expiresIn: '3h' }
      );

      return res.status(201).json({ message: 'Admin created successfully', token }).end();
    } else {
      return res.status(400).json({ message: 'Admin not found' }).end();
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal error', error: error.message });
  }
})

router.post('/auth/login', async (req, res) => {
  try {
    const { loginUsername, loginPassword } = req.body;

    if (loginUsername && loginPassword) {
      const user = await User.findOne({ where: { username: loginUsername } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' }).end();
      }

      const passwordMatch = await bcrypt.compare(loginPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' }).end();
      }

      const token = jwt.sign(
        { username: user.username, role: user.role },
        secretKey,
        { expiresIn: '5h' }
      );

      return res.status(200).json({ message: 'Login was successful', token }).end();
    } else {
      return res.status(400).json({ message: 'Missing credentials' }).end();
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal error', error: error.message });
  }
})

router.get('/all', Auth(), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
})


router.delete('/:id', Auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id } })

    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy()

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});



module.exports = router;