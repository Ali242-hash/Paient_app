const express = require('express');
const router = express.Router();
const { User } = require('../dbHandler');
const JWT = require('jsonwebtoken');
const secretkey = 'KHARETO';
const expiresIn = '3h';

router.post('/login', async (req, res) => {
  try {
    const { loginUsername, loginPassword } = req.body;
    console.log('Incoming login request:', loginUsername);

    if (!loginUsername || !loginPassword) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username: loginUsername } });

    if (!user || user.password !== loginPassword) {
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
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { RegisterUsername, RegisterPassword, role, RegisterEmail, fullname } = req.body;
    console.log('Register data:', req.body);

    if (!RegisterUsername || !RegisterPassword || !fullname) {
      return res.status(400).json({ message: 'Username, password and fullname are required' });
    }

    const existingUser = await User.findOne({ where: { username: RegisterUsername } });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already registered. Please login.' });
    }

    await User.create({
      username: RegisterUsername,
      password: RegisterPassword,
      email: RegisterEmail || '',
      fullname: fullname,
      role: role || 'patient',
      active: true 
    });

    return res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/update', Auth(), async (req, res) => {
  try {
    const { NewUsername, NewPassword } = req.body;

    if (!NewUsername && !NewPassword) {
      return res.status(400).json({ message: 'New username or password required' });
    }

    const user = await User.findOne({ where: { username: req.username } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (NewUsername) user.username = NewUsername;
    if (NewPassword) user.password = NewPassword;
    
    await user.save();

    return res.status(200).json({ message: 'User information updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

function Auth() {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
      }

      const tokenParts = authHeader.split(' ');
      if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
        return res.status(401).json({ message: 'Invalid token format' });
      }

      const decodedToken = JWT.verify(tokenParts[1], secretkey);
      req.username = decodedToken.username;
      req.role = decodedToken.role;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

router.get('/protected', Auth(), (req, res) => {
  res.json({ 
    message: 'Protected content',
    user: req.username,
    role: req.role
  });
});


router.Auth = Auth;
module.exports = router;