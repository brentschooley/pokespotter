'use strict';

///
/// EXTERNAL DEPENDENCIES
///

var Q = require('q');
var PokemonGO = require('pokemon-go-node-api');
var _ = require('lodash');

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

function getPokemon(currentTime) {
  return function() {
    return Q.Promise(function (resolve, reject) {
      var pokemonFound = [];
      api.Heartbeat(function (err, hb) {
        if (err) {
          return reject(err);
        }

        if (hb && Array.isArray(hb.cells)) {
          hb.cells.forEach(function (cell) {
            if (cell && Array.isArray(cell.WildPokemon)) {
              cell.WildPokemon.forEach(function (pokemon) {
                pokemonFound.push(convertPokemon(pokemon, currentTime));
              });
            }

            if (cell && Array.isArray(cell.MapPokemon)) {
              cell.MapPokemon.forEach(function (pokemon) {
                pokemonFound.push(convertPokemon(pokemon, currentTime));
              });
            }
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
  if (!username || !password) {
    throw new Error('You need to pass a username and password');
  }

  var CONFIG = {
    username: username,
    password: password,
    provider: provider || 'google'
  };

  function get(location, steps) {
    steps = steps || 1;

    if (!location.longitude || !location.latitude) {
      return reject(new Error('Invalid coordinates. Must contain longitude and latitude'));
    }
    
    var locations = geo.getCoordinatesForSteps(location, steps);

    return logIn(CONFIG, locations[0]).then(function () {
      var currentTime = Date.now();
      var pokemonFound = [];

      function visitLocations() {
        var p = Q();
        locations.forEach(function (stepLocation) {
          p = p.then(function () { 
            return setLocation(stepLocation)
              .then(getPokemon(currentTime))
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
      })
    });
  }

  return {
    get: get
  };
}

module.exports = Pokespotter;

