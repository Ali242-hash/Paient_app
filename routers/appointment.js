const express = require('express')
const router = express.Router()
const { Appointment, Timeslot } = require('../dbHandler')
const { Auth } = require('./auth')

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

module.exports = router
