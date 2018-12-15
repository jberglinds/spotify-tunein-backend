import http from 'http'
import socketIO from 'socket.io'
import RadioController from './controllers/radio-controller'

export const configure = (server: http.Server) => {
    const controller = new RadioController()
    const radio = socketIO(server).of('/radio')
    radio.clients
    radio.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`)
        const subscription = controller.addClient(socket.id)
            .subscribe(event => {
                console.log(event)
            })

        socket.on('disconnect', (reason) => {
            console.log('Client disconnected')
            controller.removeClient(socket.id)
            subscription.unsubscribe()
        })

        socket.on('start-broadcast', (stationName: string) => {
            controller.startBroadcasting(socket.id, stationName)
        })

        socket.on('end-broadcast', () => {
            controller.stopBroadcasting(socket.id)
        })

        socket.on('join-broadcast', (stationName: string) => {
            controller.joinBroadcast(socket.id, stationName)
        })

        socket.on('leave-broadcast', () => {
            controller.leaveBroadcast(socket.id)
        })

        socket.on('player-state-changed', (newState) => {
            controller.updatePlayerState(socket.id, newState)
        })
    })
}
