const express = require('express');
const router = express.Router();
const { User } = require('../dbHandler');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const secretkey = 'madaretosagbegad666';
const expiresIn = '3h';

function Auth() {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      console.log('Auth header:', authHeader);

      if (!authHeader) {
        console.log('Authorization header missing');
        return res.status(401).json({ message: 'Authorization header missing' });
      }

      const tokenParts = authHeader.split(' ');
      console.log('Token parts:', tokenParts);

      if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
        console.log('Invalid token format');
        return res.status(401).json({ message: 'Invalid token format' });
      }

      const decodedToken = JWT.verify(tokenParts[1], secretkey);
      console.log('Decoded token:', decodedToken);

      req.user = { username: decodedToken.username, role: decodedToken.role };

      next();
    } catch (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

const isAdmin = (req, res, next) => {
  console.log('User in isAdmin check:', req.user);
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  console.log('Access denied, user is not admin');
  return res.status(403).json({ message: 'Access denied, only admin' });
};


router.post('/login', async (req, res) => {
  try {
    const { loginUsername, loginPassword } = req.body;

    if (!loginUsername || !loginPassword) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username: loginUsername } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(loginPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = JWT.sign(
      { username: user.username, role: user.role },
      secretkey,
      { expiresIn }
    );

    return res.json({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      username: user.username,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/register', async (req, res) => {
  try {
    const { RegisterUsername, RegisterPassword, role, RegisterEmail, fullname } = req.body;

    if (!RegisterUsername || !RegisterPassword || !fullname) {
      return res.status(400).json({ message: 'Username, password, and fullname are required' });
    }

    const existingUser = await User.findOne({ where: { username: RegisterUsername } });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already registered. Please login.' });
    }

    const hashedPassword = await bcrypt.hash(RegisterPassword, 10);

    await User.create({
      username: RegisterUsername,
      password: hashedPassword,
      email: RegisterEmail || '',
      fullname: fullname,
      role: role || 'patient',
      active: true
    });

    return res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/update', Auth(), async (req, res) => {
  try {
    const { NewUsername, NewPassword } = req.body;

    if (!NewUsername && !NewPassword) {
      return res.status(400).json({ message: 'New username or password required' });
    }

    const user = await User.findOne({ where: { username: req.user.username } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (NewUsername) user.username = NewUsername;
    if (NewPassword) {
      const hashedNewPassword = await bcrypt.hash(NewPassword, 10);
      user.password = hashedNewPassword;
    }

    await user.save()

    return res.status(200).json({ message: 'User information updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = {
  authRouter: router,
  Auth
}
