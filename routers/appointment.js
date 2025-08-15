const express = require('express')
const router = express.Router()
const { Appointment, Timeslot } = require('../dbHandler')
const { Auth } = require('./auth')
const { where, Sequelize } = require('sequelize')

router.get('/free/:doctorId', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId)
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' })
    }

    const freeSlots = await Timeslot.findAll({
      where: { 
        doctorId,
        foglalt: false 
      },
      attributes: ['id', 'kezdes', 'veg', 'foglalt']
    })

    return res.status(200).json(freeSlots)
  } catch (error) {
    console.error('Error fetching free slots:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { timeslotId, név } = req.body

    if (!timeslotId || !név) {
      return res.status(400).json({ message: 'Timeslot ID and patient name are required' })
    }

    const timeslot = await Timeslot.findOne({ where: { id: timeslotId } })
    if (!timeslot) {
      return res.status(404).json({ message: 'Timeslot not found' })
    }

    if (timeslot.foglalt) {
      return res.status(409).json({ message: 'This slot has already been booked, please try another' })
    }

    const newAppointment = await Appointment.create({
      timeslotId,
      név,
      létrehozásDátuma: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await Timeslot.update(
      { foglalt: true },
      { where: { id: timeslotId } }
    )

    return res.status(201).json({ 
      id: newAppointment.id,
      message: 'Appointment created successfully'
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const appointment = await Appointment.findOne({ where: { id } })

    if (!appointment) {
      return res.status(404).json({ message: 'No appointment has been found' })
    }

    await Timeslot.update(
      { foglalt: false },
      { where: { id: appointment.timeslotId } }
    )

    await Appointment.destroy({ where: { id } })
    return res.status(200).json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { Status_Condition } = req.body;

    const allowed_appointments = ["booked", "completed", "cancelled", "no_show"];


    if (!allowed_appointments.includes(Status_Condition)) {
      return res.status(400).json({ message: "Invalid appointment status" }).end();
    }

    const one_appointment = await Appointment.findOne({ where: { id } });

    if (!one_appointment) {
      return res.status(404).json({ message: "No meeting found" }).end();
    }


    if (req.user.role === "patient") {
      if (Status_Condition !== "cancelled") {
        return res.status(403).json({ message: "Patients can only cancel appointments" }).end();
      }
      if (one_appointment.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only cancel your own appointments" }).end();
      }

    
      if (new Date(one_appointment.date) < new Date()) {
        return res.status(400).json({ message: "You cannot cancel past appointments" }).end();
      }
    }


    if (req.user.role === "doctor") {
      if (!["completed", "no_show"].includes(Status_Condition)) {
        return res.status(403).json({ message: "Doctors can only mark appointments as completed or no_show" }).end()
      }
      if (one_appointment.doctorId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own appointments" }).end()
      }
    }


    one_appointment.Status_Condition = Status_Condition;
    await one_appointment.save();

    return res.status(200).json({ message: "Status updated", one_appointment: one_appointment });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
})

router.get("/doctor/history",async(req,res)=>{

  try{

    if(req.user.role !== "doctor"){

      return res.status(403).json({"message":"Access denied"}).end()
    }

    const pastappointment = await Appointment.findAll({
      where:{
        doctorId:req.user.id,
        date:{[Sequelize.Op.lt]:Date()}
      },

      order:[["date","DESC"]]
    })

    return res.status(200).json(pastappointment)
  }

  catch(error){

    res.status(500).json({message:"Internal error",error:error.message})
  }
})

router.post("/manual", async (req, res) => {
  try {
    const { doctorId, userId, date, Status_Condition } = req.body;

   
    if (!doctorId || !userId || !date) {
      return res.status(400).json({ message: "doctorId, userId, and date are required" });
    }


    const allowedStatuses = ["booked", "completed", "cancelled", "no_show"];
    const status = Status_Condition || "booked";
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status" });
    }


    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

  
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        date: appointmentDate
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: "Doctor already has an appointment at this time" });
    }


    const newAppointment = await Appointment.create({
      doctorId,
      userId,
      date: appointmentDate,
      Status_Condition: status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      message: "Manual appointment created successfully",
      appointment: newAppointment
    });
  } catch (error) {
    console.error("Error creating manual appointment:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
})


module.exports = router
