import {
    default as RadioController,
    Event,
    EventType,
    PlayerState
} from '../src/controllers/radio-controller'
import { Observable, zip } from 'rxjs';
import { map, bufferTime } from 'rxjs/operators';

console.log = jest.fn()

let radioController: RadioController
let examplePlayerState: PlayerState = {
    timestamp: 0,
    isPaused: false,
    trackURI: 'lol',
    playbackPosition: 0
}

beforeEach(() => {
    radioController = new RadioController()
})

describe('creating broadcast', () => {
    test('happy path', () => {
        radioController.addClient('broadcaster'),
            expect(radioController.startBroadcasting('broadcaster', { name: "station" })).toBeUndefined()
    })

    test('adds station', () => {
        radioController.addClient('broadcaster')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        expect(
            radioController.getStations()
        ).toHaveLength(1)
    }) 

    test('errors if blank name', () => {
        radioController.addClient('broadcaster')
        expect(
            radioController.startBroadcasting('broadcaster', { name: '' })
        ).toBeInstanceOf(Error)
    })

    test('errors if same name as existing broadcast', () => {
        radioController.addClient('broadcaster1')
        radioController.addClient('broadcaster2')
        radioController.startBroadcasting('broadcaster1', { name: 'station' })
        expect(
            radioController.startBroadcasting('broadcaster2', { name: 'station' })
        ).toBeInstanceOf(Error)
    })

    test('when broadcasting ends existing broadcast first', () => {
        radioController.addClient('broadcaster')
        radioController.startBroadcasting('broadcaster', { name: 'station-1' })
        expect(
            radioController.getStations()[0].name
        ).toEqual('station-1')
        radioController.startBroadcasting('broadcaster', { name: 'station-2' })
        expect(
            radioController.getStations()
        ).toHaveLength(1)
        expect(
            radioController.getStations()[0].name
        ).toEqual('station-2')
    })

    test('when tuned in leaves that broadcast first', () => {
        radioController.addClient('self')
        radioController.addClient('broadcaster')
        radioController.startBroadcasting('broadcaster', { name: 'station-1' })
        radioController.updatePlayerState('broadcaster', examplePlayerState)
        radioController.joinBroadcast('self', 'station-1')
        expect(
            radioController.getStations()[0].listeners
        ).toHaveLength(1)
        radioController.startBroadcasting('self', { name: 'station-2' })
        expect(
            radioController.getStations()[0].listeners
        ).toHaveLength(0)
    })
})

describe('updating player state', () => {
    test('happy path', () => {
        radioController.addClient('broadcaster')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        expect(
            radioController.updatePlayerState('broadcaster', examplePlayerState)
        ).toBeUndefined()
    })

    test('errors when not broadcasting', () => {
        radioController.addClient('broadcaster'),
        expect(
            radioController.updatePlayerState('broadcaster', examplePlayerState)
        ).toBeInstanceOf(Error)
    })

    test('errors if no payload', () => {
        radioController.addClient('broadcaster')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        expect(
            radioController.updatePlayerState('broadcaster', <PlayerState> <unknown> undefined)
        ).toBeInstanceOf(Error)
    })

    test('notifies listeners', (done) => {
        radioController.addClient('broadcaster')
        radioController.addClient('listener')
            .subscribe(val => {
                expect(val.type).toBe(EventType.BroadcastChanged)
                done()
            })
        radioController.startBroadcasting('broadcaster', { name: "station" })
        radioController.updatePlayerState('broadcaster', examplePlayerState)
        radioController.joinBroadcast('listener', 'station')
        radioController.updatePlayerState('broadcaster', examplePlayerState)
    }) 
})

describe('ending broadcast', () => {
    test('removes station', () => {
        radioController.addClient('broadcaster')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        radioController.stopBroadcasting('broadcaster')
        expect(
            radioController.getStations()
        ).toHaveLength(0)
    }) 

    test('notifies listeners', (done) => {
        radioController.addClient('broadcaster')
        radioController.addClient('listener')
            .subscribe(val => {
                expect(val.type).toBe(EventType.BroadcastEnded)
                done()
            })
        radioController.startBroadcasting('broadcaster', { name: "station" })
        radioController.updatePlayerState('broadcaster', examplePlayerState)
        radioController.joinBroadcast('listener', 'station')
        radioController.stopBroadcasting('broadcaster')
    }) 
})

describe('joining broadcast', () => {
    test('happy path', () => {
        radioController.addClient('broadcaster')
        radioController.addClient('listener')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        radioController.updatePlayerState('broadcaster', examplePlayerState)
        expect(
            radioController.joinBroadcast('listener', 'station')
        ).toEqual(examplePlayerState)
    }) 

    test('adds listener to station', () => {
        radioController.addClient('broadcaster')
        radioController.addClient('listener')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        radioController.updatePlayerState('broadcaster', examplePlayerState)
        radioController.joinBroadcast('listener', 'station')
        expect(
            radioController.getStations()[0].listeners
        ).toHaveLength(1)
    }) 

    test('errors if broadcast hasn\'t started', () => {
        radioController.addClient('broadcaster')
        radioController.addClient('listener')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        expect(
            radioController.joinBroadcast('listener', 'station')
        ).toBeInstanceOf(Error)
    }) 

    test('errors if broadcast doesn\'t exist', () => {
        radioController.addClient('listener')
        expect(
            radioController.joinBroadcast('listener', 'station')
        ).toBeInstanceOf(Error)
    }) 

    test('errors if broadcast is our own', () => {
        radioController.addClient('listener')
        radioController.startBroadcasting('listener', { name: "station" })
        expect(
            radioController.joinBroadcast('listener', 'station')
        ).toBeInstanceOf(Error)
    }) 

    test('while tuned in to other broadcast leaves that broadcast', () => {
        radioController.addClient('listener')
        radioController.addClient('broadcaster-1')
        radioController.addClient('broadcaster-2')
        radioController.startBroadcasting('broadcaster-1', { name: "station-1" })
        radioController.startBroadcasting('broadcaster-2', { name: "station-2" })
        radioController.updatePlayerState('broadcaster-1', examplePlayerState)
        radioController.updatePlayerState('broadcaster-2', examplePlayerState)
        radioController.joinBroadcast('listener', 'station-1')
        expect(
            radioController.getStations()[0].listeners
        ).toHaveLength(1)
        expect(
            radioController.getStations()[1].listeners
        ).toHaveLength(0)

        radioController.joinBroadcast('listener', 'station-2')
        expect(
            radioController.getStations()[0].listeners
        ).toHaveLength(0)
        expect(
            radioController.getStations()[1].listeners
        ).toHaveLength(1)
    })

    test('while broadcasting ends own broadcast', () => {
        radioController.addClient('broadcaster-listener')
        radioController.addClient('broadcaster')
        radioController.startBroadcasting('broadcaster-listener', { name: "station-1" })
        radioController.startBroadcasting('broadcaster', { name: "station-2" })
        radioController.updatePlayerState('broadcaster', examplePlayerState)
        // Two broadcasts live before starting
        expect(
            radioController.getStations()
        ).toHaveLength(2)
        radioController.joinBroadcast('broadcaster-listener', 'station-2')
        // One broadcast live with one listener after joining
        expect(
            radioController.getStations()
        ).toHaveLength(1)
        expect(
            radioController.getStations()[0].listeners
        ).toHaveLength(1)
    })
})

describe('leaving broadcast', () => {
    test('removes listener from station', () => {
        radioController.addClient('broadcaster')
        radioController.addClient('listener')
        radioController.startBroadcasting('broadcaster', { name: "station" })
        radioController.updatePlayerState('broadcaster', examplePlayerState)
        radioController.joinBroadcast('listener', 'station')
        radioController.leaveBroadcast('listener')
        expect(
            radioController.getStations()[0].listeners
        ).toHaveLength(0)
    }) 
})
