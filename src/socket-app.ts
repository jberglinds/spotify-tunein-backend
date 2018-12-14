import http from 'http'
import socketIO from 'socket.io'

const isBroadcasting = (socket: SocketIO.Socket) => {
    // Socket is broadcasting if it has joined a room with its own id
    const stationName = socket.id
    const rooms = Object.keys(socket.rooms)
    return rooms.includes(stationName)
}

const stopBroadcasting = (socket: SocketIO.Socket) => {
    // If not broadcasting, do nothing
    if (!isBroadcasting(socket)) return
    const stationName = socket.id

    // Send ended message
    socket.to(stationName).emit('broadcast-ended')

    // Remove all listeners from station
    const namespace = socket.nsp
    namespace.in(stationName).clients((err?: Error, socketIds?: string[]) => {
        if (err) {
            console.error('Error fetching clients in room', err)
            return
        }
        socketIds.forEach(id => {
            namespace.sockets[id].leave(stationName)
            console.log(`${id} kicked from broadcast: ${stationName}`)
        })
    })
    console.log(`Broadcast ended: ${stationName}`)
}

const startBroadcasting = (socket: SocketIO.Socket, stationName: string) => {
    // If already broadcasting to that station, do nothing
    if (socket.id === stationName) return

    // Stop broadcasting to previous station if any
    stopBroadcasting(socket)
    if (!stationName) return

    // Start broadcasting to new channel
    socket.id = stationName
    socket.join(stationName)
    console.log(`Broadcast started: ${stationName}`)
}

const getCurrentStation = (socket: SocketIO.Socket) => {
    return Object.keys(socket.rooms)[0]
}

const getListenerCount = (socket: SocketIO.Socket, stationName: string,
    callback: (value: number) => void) => {
    const namespace = socket.nsp
    namespace.in(stationName).clients((err?: Error, socketIds?: string[]) => {
        if (err) {
            console.error('Error fetching clients in room', err)
            return
        }
        callback(socketIds.length)
    })
}

const joinBroadcast = (socket: SocketIO.Socket, stationName: string) => {
    if (!stationName) return
    // If already listening, do nothing
    if (getCurrentStation(socket) === stationName) return

    // Stop broadcasting to previous station if any
    stopBroadcasting(socket)
    socket.join(stationName)
    getListenerCount(socket, stationName, (count) => {
        socket.to(stationName).emit('listener-count-changed', count)
    })
    console.log(`${socket.id} joined broadcast: ${stationName}`)
}

const leaveBroadcast = (socket: SocketIO.Socket) => {
    const stationName = getCurrentStation(socket)
    if (!stationName) return
    socket.leave(stationName)
    getListenerCount(socket, stationName, (count) => {
        socket.to(stationName).emit('listener-count-changed', count)
    })
    console.log(`${socket.id} left broadcast: ${stationName}`)
}

export const configure = (server: http.Server) => {
    const radio = socketIO(server).of('/radio')
    radio.clients
    radio.on('connection', (socket) => {
        console.log('Client connected')

        socket.on('disconnect', (reason) => {
            console.log('Client disconnected')
            stopBroadcasting(socket)
            leaveBroadcast(socket)
        })

        socket.on('start-broadcast', (stationName: string) => {
            startBroadcasting(socket, stationName)
        })

        socket.on('end-broadcast', () => {
            stopBroadcasting(socket)
        })

        socket.on('join-broadcast', (stationName: string) => {
            joinBroadcast(socket, stationName)
        })

        socket.on('leave-broadcast', () => {
            leaveBroadcast(socket)
        })

        socket.on('player-state-changed', (newState) => {
            if (!isBroadcasting(socket)) {
                return
            }
            // TODO: Do validation of what we pass along
            if (!newState) {
                return
            }
            // Pass the new state along to all listeners
            const stationName = socket.id
            socket.to(stationName).emit('player-state-changed', newState)
        })
    })
}
