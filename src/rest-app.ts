import express from 'express'
import dotenv from 'dotenv'

// Controllers (route handlers)
import * as radioController from './controllers/radio'

// Create Express server
const app = express()

/**
 * Primary app routes.
 */
app.get('/', radioController.ping)

export default app
