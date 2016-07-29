# Pokespotter - Node.js library for finding Pokemon in Pokemon GO

This module allows you to easily determine the Pokemon that are around a certain location. It uses the [Node.js wrapper for the Pokemon GO API](https://github.com/Armax/Pokemon-GO-node-api).

# Installation

### 1. Install Node Module

```bash
npm install pokespotter --save
```

## 2. Get Credentials
You need either a Google account or Pokemon Trainer Club account. Best save these as environment variables:

| Variable | Purpose |
| -------- | ------- |
| PGO_USERNAME | Your Pokemon GO / Google username |
| PGO_PASSWORD | Your Pokemon GO / Google password |
| PGO_PROVIDER | 'ptc' for Pokemon Trainer Club or 'google' for Google |

## 3. Require and initialize module

```js
var Pokespotter = require('pokespotter')(); // add username, password, provider if necessary
```

# Example using Google

```js
var Pokespotter = require('pokespotter')('username@gmail.com', 'mypassword', 'google');

Pokespotter.get('Central Park, New York').then(function (pokemon) {
  console.log(pokemon);
});
```

# API Documentation

## `Pokespotter(username, password, provider)` ⇒ Pokespotter
Initializer for Pokespotter.
Credentials can be passed as arguments or stored in the ENV variables:
PGO_USERNAME, PGO_PASSWORD, PGO_PROVIDER

| Param | Type | Description |
| --- | --- | --- |
| PGO_USERNAME | `string` | Your Pokemon GO / Google username |
| PGO_PASSWORD | `string` | Your Pokemon GO / Google password |
| PGO_PROVIDER | `string` | 'ptc' for Pokemon Trainer Club or 'google' for Google |

## `Pokespotter` methods

### `get(location, options)` ⇒ `Promise<Pokemon[]>`

Gets all the Pokemon around a certain location.
The location can be latitude, longitude or an address that will be checked with Open Street Map.

| Param | Type | Description |
| --- | --- | --- |
| location | `string` | [`Location`](#location) | Actual location (lat/long) or an address to look up |
| options | [`GetOptions`](#getoptions) | Options to alter call behavior |

### `getNearby(location, options)` ⇒ `Promise<`[`Pokemon`](#pokemon)`[]>`
Alias for [`get(location, options)`](#getlocation-options--promisepokemon)

## `Pokedex`

Array of all Pokemon with their Pokedex number as index.

## `getMapsUrl()` ⇒ string

| Param | Type | Description |
| --- | --- | --- |
| center | `string` or [`Location`](#location) | Central location of the map |
| pokemon | [`Pokemon`](#pokemon)`[]` | List of Pokemon to mark on the map |
| steps | `number` | The amount of steps used to search |
| size | `string` | Size of the map. Default `512x512` |

## Types

### `Location`

| Field | Type | Description |
| --- | --- | --- |
| longitude | `number` | Location longitude |
| latitude | `number` | Location latitude |

### `GetOptions`

| Field | Type | Description |
| --- | --- | --- |
| steps | `number` | Number of steps the API should explore in each direction from the base |
| requestDelay | `number` | Timeout in milliseconds before each API call. Needed for more steps. |

### `Pokemon`

| Field | Type | Description |
| --- | --- | --- |
| spawnPointId | `string` | Internal ID for the place a Pokemon spawned |
| longitude | `number` | Longitude of the current location of a Pokemon |
| latitude | `number` | Latitude of the current location of a Pokemon |
| expirationTime | `number` | UNIX timestamp in milliseconds when a Pokemon disappears |
| pokemonId | `number` | Official Pokedex Number |
| name | `string` | English name of Pokemon |
| distance | `number` | Distance in meters to the requested location |

# Shoutouts and Thanks

Python API work by [tejado](https://github.com/tejado/pokemongo-api-demo)
Node library we based our work on by [Armax](https://github.com/Armax/Pokemon-GO-node-api)
Pokemon Go Map code we learned from by [AHAAAAAAA](https://github.com/AHAAAAAAA/PokemonGo-Map)

# Disclaimer

The used API wrapper uses an unofficial Niantic API. They might block you for using this. Therefore it is not recommended to use this or any other API with your actual account.

# Contributors

- Dominik Kundel
- Brent Schooley
