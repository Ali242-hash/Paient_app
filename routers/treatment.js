const express = require('express')
const router = express.Router()
const { Treatment } = require("../dbHandler")
const { Auth } = require('./auth')


router.get("/me", async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" })
    }

    const treatments = await Treatment.findAll({
      where: { doctorId: req.user.id }
    })

    return res.status(200).json({ message: "List of treatments", treatments })
  } catch (error) {
    return res.status(500).json({ message: "Error fetching treatments", error: error.message })
  }
})


router.post("/me", async (req, res) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied only doctor can assign treatments" })
    }

    const { név } = req.body
    if (!név) {
      return res.status(400).json({ message: "Name is required" })
    }

    if (név.length > 100) {
      return res.status(400).json({ message: "Name must be at least 100 characters" })
    }

    const existingTreatment = await Treatment.findOne({
      where: { doctorId: req.user.id, név }
    })

    if (existingTreatment) {
      return res.status(409).json({ message: "Treatment already exists for this doctor" })
    }

    const new_treatment = await Treatment.create({
      doctorId: req.user.id,
      név
    })

    return res.status(201).json({ message: "Treatment created", new_treatment })
  } catch (error) {
    return res.status(500).json({ message: "Error creating treatment", error: error.message })
  }
})


router.get("/doctors/:doctorId", async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId)
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" })
    }

    const treatments = await Treatment.findAll({
      where: { doctorId },
      attributes: ['id', 'doctorId', 'név']
    })

    return res.status(200).json(treatments)
  } catch (error) {
    return res.status(500).json({ message: "Error fetching treatments", error: error.message })
  }
})


router.delete("/me/:id",Auth(),async(req,res)=>{

  try{

  if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const{id}=req.params

    const treatment = await Treatment.findOne({where:{id}})

    if(!treatment){

      return res.status(404).json({message:"no treatment found"}).end()
    }

 if (treatment.doctorId !== req.user.id)
  {

      return res.status(403).json({message:"you can only delete your own treatment"}).end()
    }

    await Treatment.destroy({where:{id}})

    return res.status(200).json({message:"Treatment delete it successfully"}).end()

  }

  catch (error) {
    return res.status(500).json({ message: "Error fetching treatments", error: error.message })
  }


})

router.put("/me/:id",Auth(),async(req,res)=>{

  try{

    const{id}=req.params
    const { név } = req.body

    const treatment = await Treatment.findOne({where:{id}})

    if(!treatment){

      return res.status(404).json({message:"no treatment found"}).end()
    }

    if(!név){

         return res.status(400).json({ message: "Name is required" }).end()
    }

    if (név.length > 100) {
      return res.status(400).json({ message: "Name cannot exceed 100 characters" }).end();
    }
    
    treatment.név =  név
   await treatment.save()

    return res.status(200).json({message:"Treatment saved",treatment})

  }

    catch (error) {
    return res.status(500).json({ message: "Error fetching treatments", error: error.message })
  }


})

module.exports = router
