import dotenv from 'dotenv'
import http from 'http'
import restApp from './rest-app'
import * as socketApp from './socket-app'

// Load environment variables from .env file,
// where API keys and passwords are configured
dotenv.config({ path: '.env' })

const port = process.env.PORT || 3000
const env = process.env.NODE_ENV || 'development'

// Create a server with the express app
const server = http.createServer(restApp)

// Attach the socket app to the same server
socketApp.configure(server)

// Listen on a port
server.listen(port, () => {
  console.log(
    '  App is running at http://localhost:%d in %s mode',
      port,
      env
  )
})

export default server
