const express = require('express')
const router = express.Router()
const { User } = require('../dbHandler')
const JWT = require('jsonwebtoken')

const secretkey = 'KHARETO'
const expiresIn = '3h'

router.post('/', async (req, res) => {
  const { loginUsername, loginPassword } = req.body
  console.log('Incoming login request:', loginUsername)

  const OneUser = await User.findOne({ where: { username: loginUsername } })

  if (!OneUser || OneUser.password !== loginPassword) {
    return res.status(401).json({ message: 'Invalid username or password' }).end()
  }

  const token = JWT.sign(
    { username: OneUser.username, role: OneUser.role },
    secretkey,
    { expiresIn }
  )

  return res.json({
    id: OneUser.id,
    fullname: OneUser.fullname,
    email: OneUser.email,
    username: OneUser.username,
    role: OneUser.role,
    active: OneUser.active,
    létrehozásDátuma: OneUser.createdAt,
    token,
    message: 'Login was successful'
  }).end()
})

router.post('/', async (req, res) => {
  const { RegisterUsername, RegisterPassword, role, RegisterEmail } = req.body
  console.log('Register data:', req.body)

  const OneUser = await User.findOne({ where: { username: RegisterUsername } })
  if (OneUser) {
    return res.status(409).json({ message: 'You have already registered. Please login.' }).end()
  }

  await User.create({
    username: RegisterUsername,
    password: RegisterPassword, 
    email: RegisterEmail || '',
    role: role || 'patient',
    active: true
  })

  res.status(201).json({ message: 'Registration successful' }).end()
})

router.put('/', Auth(), async (req, res) => {
  const { NewUsername, NewPassword } = req.body

  const OneUser = await User.findOne({ where: { username: NewUsername } })
  if (!OneUser) {
    return res.status(404).json({ message: 'This patient is not in the system' }).end()
  }

  OneUser.password = NewPassword // plain text
  OneUser.username = NewUsername
  await OneUser.save()

  res.status(200).json({ message: 'Your information has been saved successfully' }).end()
})

function Auth() {
  return (req, res, next) => {
    const authhead = req.headers.authorization
    if (!authhead) {
      return res.status(401).json({ message: 'Missing Authorization header' }).end()
    }

    const tokenParts = authhead.split(' ')
    if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
      return res.status(401).json({ message: 'Invalid token format' }).end()
    }

    try {
      const decodedToken = JWT.verify(tokenParts[1], secretkey)
      req.username = decodedToken.username
      req.role = decodedToken.role
      next()
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' }).end()
    }
  }
}

module.exports = router
