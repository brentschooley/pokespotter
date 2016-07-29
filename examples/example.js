'use strict';

var username = process.env.PGO_USERNAME || '';
var password = process.env.PGO_PASSWORD || '';
var provider = process.env.PGO_PROVIDER || '';

var location = process.env.PGO_LOCATION || 'Central Park, New York';

var stepsInEachDirection = 2;

var Pokespotter = require('../')(username, password, provider);

Pokespotter.get(location, {
  steps: stepsInEachDirection,
  requestDelay: 0
}).then(function (pokemon) {
  pokemon.forEach(function(p) {
    console.log(p.pokemonId, p.spawnPointId, p.name, p.distance + 'm');
  })
}).catch(function (err) {
  console.error(err);
})