const express = require("express")
const router = express.Router()
const { Appointment, User, DoctorProfile } = require("../dbHandler")
const{Auth}=require("./auth")
const bcrypt = require("bcrypt")



router.get("/appointments",Auth("admin"),async(req,res)=>{

  try{

    const Admin_Appointments = await Appointment.findAll({

      include:[

        {model:User,as:"admin",attributes:["id","email"]},
        {model:DoctorProfile,as:"doctor",attributes:["id","name"]}
      ]

    })

    return res.json(Admin_Appointments)

  }

  catch(error){

       return res.status(500).json({message:"error,fetching appointments",error:error.message})
  }

})

router.post("/users",Auth(),async(req,res)=>{

  try{
      const{name,email,password,role}=req.body

  if(!name || !email || !password || !role){

    return res.status(400).json({message:"name,email,pass or role is required"}).end()
  }

  const existinguser = await User.findOne({where:{email}})

  if(existinguser){

    return res.status(409).json({message:"This user already exist"}).end()
  }

  const hashedpassword = await bcrypt.hash(password,10)

  const newuser = await User.create({

    name,
    email,
    password:hashedpassword,
    role
  })

  return res.status(201).json({message:"user created successfully",

    User:{id:newuser.id,name:newuser.name,email:newuser.email,role:newuser.role}
  }).end()

  }

  catch(error){

       return res.status(500).json({message:"error,fetching appointments",error:error.message})
  }


})

router.put("/users/:id/active",async(req,res)=>{

  
  try{
    const{id}=req.params

    const user =  await User.findByPk(id)

    if(!user){

      return res.status(404).json({message:"no user found"}).end()
    }

    user.isActive = true
    await user.save()

    return res.status(200).json({message:"user activated successfully"}).end()

  }

    catch(error){

       return res.status(500).json({message:"error,fetching appointments",error:error.message})
  }

})

router.put("/users/:id/inactive",async(req,res)=>{
  try{

    const{id}=req.params

    const user =  await User.findByPk(id)

    if(!user){

      return res.status(404).json({message:"no user found"}).end()
    }

    user.isActive = false
   await user.save()

    return res.status(200).json({message:"user deactivated successfully"}).end()

  }

      catch(error){

       return res.status(500).json({message:"error,fetching appointments",error:error.message})
  }
})

module.exports = router