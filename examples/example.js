'use strict';

var username = process.env.PGO_USERNAME || '';
var password = process.env.PGO_PASSWORD || '';
var provider = process.env.PGO_PROVIDER || '';

var location = process.env.PGO_LOCATION || 'Central Park, New York';

var stepsInEachDirection = 1;

// var Pokespotter = require('../')(username, password, provider);
var Pokespotter = require('../')([
{
  username: username,
  password: password,
  provider: provider
}, 
{
  username: process.env.PGO_USERNAME_1,
  password: process.env.PGO_PASSWORD_1,
  provider: process.env.PGO_PROVIDER_1
}
]);

Pokespotter.DEBUG = true;

var startTime = process.hrtime();
Pokespotter.get(location, {
  steps: stepsInEachDirection,
  requestDelay: 0
}).then(function (pokemon) {
  var time = process.hrtime(startTime);
  console.log('Time needed for request %d seconds and %d nanoseconds', time[0], time[1]);
  pokemon.forEach(function(p) {
    console.log(p.pokemonId, p.spawnPointId, p.name, p.distance + 'm', new Date(p.expirationTime));
  });
}).catch(function (err) {
  console.error(err);
});