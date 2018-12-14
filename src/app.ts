import express from 'express'
import dotenv from 'dotenv'

// Load environment variables from .env file,
// where API keys and passwords are configured
dotenv.config({ path: '.env' })

// Controllers (route handlers)
import * as radioController from './controllers/radio'

// Create Express server
const app = express()

// Express configuration
app.set('port', process.env.PORT || 3000)

/**
 * Primary app routes.
 */
app.get('/', radioController.ping)

export default app
