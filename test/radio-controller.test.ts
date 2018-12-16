import {
    default as RadioController,
    Event,
    EventType
} from '../src/controllers/radio-controller'
import { Observable, zip } from 'rxjs';
import { map, bufferTime } from 'rxjs/operators';

console.log = jest.fn()

let radioController: RadioController

beforeEach(() => {
    radioController = new RadioController()
})

function checkStream<T>(observable: Observable<T>, values: T[], done: () => void) {
    const subscription = observable
        .pipe(bufferTime(0))
        .subscribe(result => {
            expect(result).toEqual(values)
            subscription.unsubscribe()
            done()
    })
}

test('creating and destroying broadcast works', (done) => {
    checkStream(
        radioController.addClient('broadcaster').pipe(map(val => val.type)),
        [EventType.BroadcastCreated, EventType.BroadcastDestroyed],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.stopBroadcasting('broadcaster')
})

test('joining and leaving broadcast works', (done) => {
    radioController.addClient('broadcaster'),
    checkStream(
        radioController.addClient('listener').pipe(map(val => val.type)),
        [EventType.DidJoinBroadcast, EventType.DidLeaveBroadcast],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.joinBroadcast('listener', 'station')
    radioController.leaveBroadcast('listener')
})

test('joining non-existing broadcast errors', (done) => {
    checkStream(
        radioController.addClient('listener').pipe(map(val => val.type)),
        [EventType.BroadcastJoinError],
        done
    )

    radioController.joinBroadcast('listener', 'station')
})

test('creating broadcast with same name as existing broadcast errors', (done) => {
    radioController.addClient('broadcaster1')
    checkStream(
        radioController.addClient('broadcaster2').pipe(map(val => val.type)),
        [EventType.BroadcastCreationError],
        done
    )

    radioController.startBroadcasting('broadcaster1', 'station')
    radioController.startBroadcasting('broadcaster2', 'station')
})

test('ending broadcast notifies listeners', (done) => {
    radioController.addClient('broadcaster')
    checkStream(
        radioController.addClient('listener').pipe(map(val => val.type)),
        [EventType.DidJoinBroadcast, EventType.BroadcastEnded],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.joinBroadcast('listener', 'station')
    radioController.stopBroadcasting('broadcaster')
})

test('joining broadcast when broadcasting ends own broadcast', (done) => {
    radioController.addClient('broadcaster1')
    checkStream(
        radioController.addClient('broadcaster2').pipe(map(val => val.type)),
        [
            EventType.BroadcastCreated,
            EventType.BroadcastDestroyed,
            EventType.DidJoinBroadcast
        ],
        done
    )

    radioController.startBroadcasting('broadcaster1', 'station1')
    radioController.startBroadcasting('broadcaster2', 'station2')
    radioController.joinBroadcast('broadcaster2', 'station1')
})

test('creating broadcast when having joined one leaves that one before creating', (done) => {
    radioController.addClient('broadcaster')
    checkStream(
        radioController.addClient('client').pipe(map(val => val.type)),
        [
            EventType.DidJoinBroadcast,
            EventType.DidLeaveBroadcast,
            EventType.BroadcastCreated
        ],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.joinBroadcast('client', 'station')
    radioController.startBroadcasting('client', 'station2')
})

test('sending updates on broadcast notifies all clients', (done) => {
    radioController.addClient('broadcaster')

    checkStream(
        zip(
            radioController.addClient('listener1').pipe(map(val => val.type)),
            radioController.addClient('listener2').pipe(map(val => val.type)),
        ),
        [
            [EventType.DidJoinBroadcast, EventType.DidJoinBroadcast],
            [EventType.BroadcastChanged, EventType.BroadcastChanged]
        ],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.joinBroadcast('listener1', 'station')
    radioController.joinBroadcast('listener2', 'station')
    radioController.updatePlayerState('broadcaster', 'state')
})

test('sending invalid player update does nothing', (done) => {
    checkStream(
        radioController.addClient('broadcaster').pipe(map(val => val.type)),
        [EventType.BroadcastCreated],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.updatePlayerState('broadcaster', undefined)
})

test('removing client with broadcast ends that broadcast', (done) => {
    checkStream(
        radioController.addClient('broadcaster').pipe(map(val => val.type)),
        [
            EventType.BroadcastCreated,
            EventType.BroadcastDestroyed
        ],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.removeClient('broadcaster')
})

test('removing client having joined broadcast leaves that broadcast', (done) => {
    radioController.addClient('broadcaster')
    checkStream(
        radioController.addClient('listener').pipe(map(val => val.type)),
        [
            EventType.DidJoinBroadcast,
            EventType.DidLeaveBroadcast
        ],
        done
    )

    radioController.startBroadcasting('broadcaster', 'station')
    radioController.joinBroadcast('listener', 'station')
    radioController.removeClient('listener')
})
