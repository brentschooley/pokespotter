'use strict';

///
/// EXTERNAL DEPENDENCIES
///

var Q = require('q');
var PokemonGO = require('pokemon-go-node-api');
var _ = require('lodash');
var geocoder = require('node-geocoder')({ provider: 'openstreetmap' });

var api = new PokemonGO.Pokeio();

///
/// HELPERS
///

var geo = require('./lib/geo-helper');
var utils = require('./lib/utils');
var locWrap = utils.locWrap;
var convertPokemon = utils.convertPokemon;

var IS_LOGGED_IN = false;

///
/// API INTERACTION
///

function logIn(config, location) {
  return Q.Promise(function (resolve, reject) {
    if (IS_LOGGED_IN) {
      return resolve();
    }
    api.init(config.username, config.password, locWrap(location), config.provider, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function getPokemon(currentTime, baseLocation) {
  return function() {
    return Q.Promise(function (resolve, reject) {
      var pokemonFound = [];
      api.Heartbeat(function (err, hb) {
        if (err) {
          return reject(err);
        }

        if (hb && Array.isArray(hb.cells)) {
          hb.cells.forEach(function (cell) {
            ['WildPokemon', 'MapPokemon'].forEach(function (pokeType) {
              if (cell && Array.isArray(cell[pokeType])) {
                cell[pokeType].forEach(function (pokemon) {
                  pokemonFound.push(convertPokemon(pokemon, currentTime, baseLocation));
                });
              }
            });
          });
        }

        resolve(pokemonFound);
      });
    });
  }
}

function setLocation(stepLocation) {
  return Q.Promise(function (resolve, reject) {
    api.SetLocation(locWrap(stepLocation), function (err, c) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

///
/// MODULE
///

function Pokespotter(username, password, provider) {
  var CONFIG = {
    username: username || process.env.PGO_USERNAME,
    password: password || process.env.PGO_PASSWORD,
    provider: provider || process.env.PGO_PROVIDER || 'google'
  };

  if (!CONFIG.username || !CONFIG.password) {
    throw new Error('You need to pass a username and password');
  }

  function get(location, steps) {
    steps = steps || 1;

    var getLocation;
    if (typeof location === 'string') {
      getLocation = geocoder.geocode(location).then(function (result) {
        result = result[0] || { longitude: 0, latitude: 0 };
        return {
          longitude: result.longitude,
          latitude: result.latitude
        };
      });
    } else if (location.longitude && location.latitude) {
      getLocation = Q.when(location);
    } else {
      return Q.reject(new Error('Invalid coordinates. Must contain longitude and latitude'));
    }

    return getLocation.then(function (baseLocation) {
      var locations = geo.getCoordinatesForSteps(baseLocation, steps);

      return logIn(CONFIG, locations[0]).then(function () {
        var currentTime = Date.now();
        var pokemonFound = [];

        function visitLocations() {
          var p = Q();
          locations.forEach(function (stepLocation) {
            p = p.then(function () { 
              return setLocation(stepLocation)
                .then(getPokemon(currentTime, baseLocation))
                .then(function (found) {
                  pokemonFound.push(found);
                  return true;
                }); 
              })
          });
          return p;
        }

        return visitLocations().then(function () {
          var result = _.chain(pokemonFound).flatten().uniqWith(function (a, b) {
            return a.spawnPointId === b.spawnPointId && a.pokemonId === b.pokemonId;
          }).value();
          return result
        });
      });
    });
  }

  return {
    get: get,
    getNearBy: get
  };
}

module.exports = Pokespotter;

