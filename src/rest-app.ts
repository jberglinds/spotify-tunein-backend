import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import RadioController from './controllers/radio-controller'

// Create Express server
const app = express()
app.use(morgan('dev'))

const radio = RadioController.shared()

/**
 * Primary app routes.
 */
app.get('/', (req, res) => {
    res.status(200).send('We have a signal!')
})

app.get('/radio/stations', (req, res) => {
    res.json(radio.getStations())
})

export default app
