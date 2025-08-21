const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { User } = require('../dbHandler')
const bcrypt = require('bcrypt')


const secretkey = process.env.secretkey || "madaretosagbegad666"

function Auth() {
  return (req, res, next) => {
    const authead = req.headers.authorization;

    if (!authead) {
      return res.status(401).json({ message: 'Authorization header is missing' })
    }

    const tokenparts = authead.split(' ')

    if (tokenparts[0] !== "Bearer" || !tokenparts[1]) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    const token = tokenparts[1];
    try {
      const decodToken = jwt.verify(token, secretkey)
      req.userId = decodToken.id;
      req.role = decodToken.role;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' })
    }
  }
}

router.post('/login', async (req, res) => {
   
  try {
   
    const loginUsername = req.body?.logiUsername;
    const loginPassword = req.body?.logiPassword;

     

    if (!loginUsername || !loginPassword) {
      return res.status(400).json({ message: 'Missing credentials' }).end()

    }

    
     

    const user = await User.findOne({ where: { username: loginUsername } })

    if (!user) {
      return res.status(404).json({ message: 'User not found' }).end()
    }

    const validPassword = await bcrypt.compare(loginPassword, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Missing credentials' }).end()
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secretkey, { expiresIn: '3h' })

    return res.status(200).json({ message: 'Login was successful', token }).end()
  } catch (error) {
    res.status(500).json({ message: "Internal error", error: error.message })
  }
})

router.post('/register', async (req, res) => {
  const { RegisterUsername, RegisterPassword, RegisterEmail, fullname, role } = req.body

  try {
    if (!RegisterUsername || !RegisterPassword) {
      return res.status(400).json({ message: 'Username or password is required' }).end()
    }

    const existingUser = await User.findOne({ where: { username: RegisterUsername } })

    if (existingUser) {
      return res.status(409).json({ message: 'This user already exists' }).end()
    }

    const hashedPassword = await bcrypt.hash(RegisterPassword, 10)

    await User.create({
      username: RegisterUsername,
      password: hashedPassword,
      email: RegisterEmail || '',
      fullname,
      role: role || 'patient',
      active: true,
    })

    return res.status(201).json({ message: 'User created successfully' }).end()
  } catch (error) {
    res.status(500).json({ message: "Internal error", error: error.message })
  }
})

router.put('/put', Auth(), async (req, res) => {
  res.json({ message: 'This should not be reached with invalid token' })
})

module.exports = { Auth, router }
