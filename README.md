# spotify-tunein-backend
[![CircleCI](https://circleci.com/gh/jberglinds/spotify-tunein-backend.svg?style=svg&circle-token=3b3bc0a28e53345af8b1e7553d2a9fcf99752955)](https://circleci.com/gh/jberglinds/spotify-tunein-backend)

This is the backend for [Spotify TuneIn](https://github.com/jberglinds/spotify-tunein-ios), a radio app for Spotify.

## Getting Started
### Prerequisites
- [Yarn (Package Manager)](https://yarnpkg.com/en/docs/install)

### Installing
```sh
# Install dependencies
yarn install

# Start server for development (compiles and reloads on changes)
yarn watch
```

## API
### Socket.IO
#### Actions
- **start-broadcast** `station: { name: string, coordinate?: { lat: number, lng: number } }`
  - Starts a broadcast with the specified name at a specific location
- **end-broadcast**
  - Ends the current broadcast if any
- **update-player-state**  
`state: { timestamp: number, isPaused: boolean, trackURI: string, playbackPosition: number }`
  - Updates the player state for a broadcast, notifies listeners
- **join-broadcast** `station: string`
  - Tunes in to the broadcast with the given name if any
- **leave-broadcast**
  - Leaves any broadcast currently tuned in to

#### Events
- **player-state-updated**  
`state: { timestamp: number, isPaused: boolean, trackURI: string, playbackPosition: number }`
  - Sent when the player state is updated for the station the user is tuned in to
- **broadcast-ended**
  - Sent when the broadcast the user is tuned in to ends

### REST
- GET **/radio/stations**
  - Returns a list of radio stations that are currently live
