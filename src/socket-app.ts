import http from 'http'
import socketIO from 'socket.io'
import {
    default as RadioController,
    PlayerState,
    APIRadioStation
} from './controllers/radio-controller'

enum IncomingEvent {
    startBroadcast = 'start-broadcast',
    endBroadcast = 'end-broadcast',
    updatePlayerState = 'update-player-state',
    joinBroadcast = 'join-broadcast',
    leaveBroadcast = 'leave-broadcast'
}

export const configure = (server: http.Server) => {
    const controller = RadioController.shared()
    const radio = socketIO(server).of('/radio')
    radio.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`)
        const subscription = controller.addClient(socket.id)
            .subscribe(event => {
                socket.emit(event.type, event.payload)
            })

        socket.on('disconnect', (reason) => {
            console.log(`Client disconnected: ${socket.id}`)
            controller.removeClient(socket.id)
            subscription.unsubscribe()
        })

        socket.on(IncomingEvent.startBroadcast, (station: APIRadioStation, ack: AckCallback) => {
            const error = controller.startBroadcasting(socket.id, station)
            ack(error && error.message)
        })

        socket.on(IncomingEvent.endBroadcast, (ack: AckCallback) => {
            controller.stopBroadcasting(socket.id)
            ack()
        })

        socket.on(IncomingEvent.joinBroadcast, (stationName: string, ack: (retval: string | PlayerState) => void) => {
            const retval = controller.joinBroadcast(socket.id, stationName)
            if (retval instanceof Error) {
                ack(retval.message)
            } else {
                ack(retval)
            }
        })

        socket.on(IncomingEvent.leaveBroadcast, (ack: AckCallback) => {
            controller.leaveBroadcast(socket.id)
            ack()
        })

        socket.on(IncomingEvent.updatePlayerState, (newState: PlayerState, ack: AckCallback) => {
            const error = controller.updatePlayerState(socket.id, newState)
            ack(error && error.message)
        })
    })
}

type AckCallback = (error?: string) => void

