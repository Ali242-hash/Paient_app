const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../dbHandler');
const { Auth } = require('./auth')


const secretKey = process.env.secretKey || "madaretosagbegad666"

router.post('/', async (req, res) => {
  const { username, password, email, fullname, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username or password is required' });
  }

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: 'This user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      email: email || '',
      fullname,
      role: role || 'patient',
      active: true
    })



    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return res.status(500).json({ message: "Internal error", error: error.message });
  }
})




router.post('/register-admin', async (req, res) => {
  try {
    const { loginUsername, loginPassword } = req.body;

   if (!username || !password || !fullname || !email) {
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



router.get('/all', async (req, res) => {
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