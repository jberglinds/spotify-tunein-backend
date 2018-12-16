import express from 'express'
import dotenv from 'dotenv'

// Controllers (route handlers)
import * as radioController from './controllers/radio'

// Create Express server
const app = express()

/**
 * Primary app routes.
 */
app.get('/', (req, res) => {
    res.status(200).send('We have a signal!')
})

export default app
