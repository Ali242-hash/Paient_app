const express = require('express');
const router = express.Router();
const { User } = require('../dbHandler');
const bcrypt = require('bcrypt')
const {Auth} =require('./auth')


const isAdmin = (req, res, next) => {
  if (req.user && req.user.role == 'admin') {
    return  next()
  }

  return res.status(403).json({'message':'Access denied, only admin'})
 
}



router.post('/register',Auth(), isAdmin, async(req,res)=>{
  try{
       const{RegisterUsername,RegisterPassword,RegisterEmail,fullname,role}=req.body

       if(!RegisterUsername || !RegisterPassword){
        return res.status(400).json({'message':'username or password require'})
       }

       const existinguser = await User.findOne({ where: { username: RegisterUsername } })

       if(existinguser){

        return res.status(409).json({'message':'user alreay exist'})
       }

      const hashedPassword = await bcrypt.hash(RegisterPassword,10)

      await User.create({
      username: RegisterUsername,
      password: hashedPassword,
      email: RegisterEmail || '',
      fullname,
      role: role || 'patient',
      active: true
      })
  
     return res.status(201).json({'message':'user created successfully'})
      
  }

  catch(error){
   
    res.status(500).json({'message':'internal error',error:error.message})
  }
})


router.get('/status', (req, res) => {
  res.json({ message: 'User route works!' });
});


router.get('/all', Auth(), isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});


router.get('/admins', async (req, res) => {
  try {
    const admins = await User.findAll({ where: { role: 'admin' } });
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admins', error: err.message });
  }
});


router.post('/register-admin',Auth(), isAdmin, async (req, res) => {
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

    const existing = await User.findOne({ where: { username: finalUsername } });
    if (existing) {
      return res.status(409).json({ message: 'This admin has already registered' });
    }

     const hashedPassword = await bcrypt.hash(finalPassword, 10)

    await User.create({
      fullname: finalFullname,
      email: finalEmail,
      username: finalUsername,
      password: hashedPassword ,
      role: 'admin',
      active: true
    });

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering admin', error: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.status(204).json();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

module.exports = router;
