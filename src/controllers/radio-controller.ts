import { Subject, Observable } from 'rxjs';

enum EventType {
    BroadcastEnded,
    PlayerStateChanged
}

class Event {
    type: EventType
    payload?: any

    constructor(type: EventType, payload?: any) {
        this.type = type
        this.payload = payload
    }
}

type Client = {
    id: string,
    handler: Subject<Event>
}

type RadioStation = {
    name: string,
    ownerId: string,
    listeners: string[]
}

class RadioController {
    private clients: Client[] = []
    private radioStations: RadioStation[] = []

    /**
     * Sends an event to a specific client
     */
    private notifyClient(id: string, event: Event) {
        const client = this.clients.find(client => client.id === id)
        if (!client) return
        const handler = client.handler
        handler.next(event)
    }

    /**
     * Sends an event to all clients listening to a station
     */
    private notifyStation(name: string, event: Event) {
        const station = this.radioStations.find(station => station.name === name)
        if (!station) return
        station.listeners.forEach(listener => this.notifyClient(listener, event))
    }

    /**
     * Adds a new client and returns a stream of events related to the client
     */
    addClient(id: string): Observable<Event> {
        const handler = new Subject<Event>()
        this.clients = [
            ...this.clients,
            { id, handler }
        ]
        return handler.asObservable()
    }

    /**
     * Removes a client, stops broadcasting and listening if doing that
     */
    removeClient(id: string) {
        const client = this.clients.find(client => client.id === id)
        this.leaveBroadcast(id)
        this.stopBroadcasting(id)
        client.handler.complete()
        this.clients = this.clients.filter(client => client.id !== id)
    }

    /**
     * Checks if the client with the given id is currently broadcasting
     */
    private isBroadcasting(id: string): boolean {
        return Boolean(this.getBroadcastStationForClient(id))
    }

    /**
     * Gets the radio station that a client is currently broadcasting to
     */
    private getBroadcastStationForClient(id: string): RadioStation | undefined {
        let station = this.radioStations.find(station => station.ownerId === id)
        return station ? station : undefined
    }

    /**
     * Gets the radio station that a client is currently listening to.
     */
    private getListenerStationForClient(id: string): RadioStation | undefined {
        let station = this.radioStations.find(station => 
            station.listeners.some(listener => listener === id)
        )
        return station ? station : undefined
    }

    /**
     * Starts a broadcast for the client with the given id.
     * Stops any previous broadcast or leaves any stations that it listens to.
     */
    startBroadcasting(id: string, stationName: string) {
        let activeStation = this.getBroadcastStationForClient(id)
        // Already broadcasting to that station, do nothing
        if (activeStation && activeStation.name === stationName) return
        if (!stationName) return
        this.leaveBroadcast(id)
        this.stopBroadcasting(id)

        // Start broadcasting to new channel
        this.radioStations = [
            ...this.radioStations,
            {
                name: stationName,
                ownerId: id,
                listeners: []
            }
        ]
        console.log(`Broadcast started: ${stationName}`)
    }

    /**
     * Stops any ongoing broadcast for the client with the given id.
     */
    stopBroadcasting(id: string) {
        const station = this.getBroadcastStationForClient(id)
        // If not broadcasting, do nothing
        if (!station) return

        // Send ended message to all listeners
        this.notifyStation(station.name, new Event(EventType.BroadcastEnded))

        // Remove the station
        this.radioStations = this.radioStations.filter(s => s.name != station.name)
        console.log(`Broadcast ended: ${station.name}`)
    }

    /**
     * Subscribes the client with the given id to the station with the given
     * name. Stops broadcasting if doing that. If tuned in to other station,
     * stops listening to that.
     */
    joinBroadcast(id: string, stationName: string) {
        // Stop broadcasting to previous station if any
        this.stopBroadcasting(id)

        // Already listening, do nothing
        const listeningStation = this.getListenerStationForClient(id)
        if (listeningStation && listeningStation.name === stationName) return

        // Leave any current broadcast
        this.leaveBroadcast(id)

        // Add as listener to correct station
        this.radioStations = this.radioStations.reduce((acc: RadioStation[], station) => {
            if (station.name === stationName) {
                // Add listener
                return [...acc, {
                    ...station,
                    listeners: [...station.listeners, id]
                }]
            } else {
                // Thread through
                return [...acc, station]
            }
        }, [])
        console.log(`Client ${id} joined broadcast: ${stationName}`)
    }

    /**
     * Updates the player state for the broadcast that the client with the
     * given id is currently running.
     */
    updatePlayerState(id: string, newState: any) {
        const station = this.getBroadcastStationForClient(id)
        // Not broadcasting, do nothing
        if (!station) return
        
        // TODO: Do validation of what we pass along
        if (!newState) {
            return
        }
        // Pass the new state along to all listeners
        this.notifyStation(station.name, new Event(EventType.PlayerStateChanged, newState))
    }

    /**
     * Leaves the broadcast that the client with the given id is currently
     * listening to, if any.
     */
    leaveBroadcast(id: string) {
        const listeningStation = this.getListenerStationForClient(id)
        if (!listeningStation) return

        // Remove as listener from all stations
        this.radioStations = this.radioStations.reduce((acc: RadioStation[], station) => {
            return [
                ...acc,
                {
                    ...station,
                    listeners: station.listeners.filter(l => l !== id)
                }
            ]
        }, [])
        console.log(`Client ${id} left broadcast: ${listeningStation.name}`)
    }
}

export default RadioController
