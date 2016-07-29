'use strict';

///
/// EXTERNAL DEPENDENCIES
///

var Q = require('q');
var PokemonGO = require('pokemon-go-node-api');
var _ = require('lodash');
var geocoder = require('node-geocoder')({ provider: 'openstreetmap' });

var api = new PokemonGO.Pokeio();
api.playerInfo.debug = false;

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

function getPokemon(currentTime, baseLocation, options) {
  return function() {
    return Q.Promise(function (resolve, reject) {
      setTimeout(function () {
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
      }, options.requestDelay);
    });
  }
}

function setLocation(stepLocation, options) {
  return Q.Promise(function (resolve, reject) {
    setTimeout(function () {
      api.SetLocation(locWrap(stepLocation), function (err, c) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    }, options.requestDelay);
  });
}

///
/// MODULE
///


/**
 * Initializer for Pokespotter.
 * Credentials can be passed as arguments or stored in the ENV variables:
 * PGO_USERNAME, PGO_PASSWORD, PGO_PROVIDER
 * 
 * @param {string} username Your Pokemon GO / Google username
 * @param {string} password Your Pokemon Go / Google password
 * @param {string} provider Can be 'ptc' or 'google'
 * @returns Pokespotter instance
 */
function Pokespotter(username, password, provider) {
  if (username || password || provider) {
    console.warn("You should save your Pokemon GO credentials in Environment variables rather than passing them in the code.\nStore them as PGO_USERNAME, PGO_PASSWORD, and PGO_PROVIDER and you don't have to pass them anymore.");
  }
  var CONFIG = {
    username: username || process.env.PGO_USERNAME,
    password: password || process.env.PGO_PASSWORD,
    provider: provider || process.env.PGO_PROVIDER || 'google'
  };

  if (!CONFIG.username || !CONFIG.password) {
    throw new Error('You need to pass a username and password');
  }

  
  /**
   * Gets all the Pokemon around a certain location.
   * The location can be latitude, longitude or an address that will be checked with openstreetmap
   * The options are:
   *  - steps: How much you should step in each direction
   *  - requestDelay: Artificially delays execution of calls to avoid limitations of API
   * 
   * @param {string | {latitude, longitude}} location The central location to check
   * @param {{steps, requestDelay}} options Alter behavior of the call
   * @returns
   */
  function get(location, options) {
    options = _.defaults(options, {
      steps: 1,
      requestDelay: 0
    });

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
      var locations = geo.getCoordinatesForSteps(baseLocation, options.steps);

      return logIn(CONFIG, locations[0]).then(function () {
        var currentTime = Date.now();
        var pokemonFound = [];

        function visitLocations() {
          var p = Q();
          locations.forEach(function (stepLocation) {
            p = p.then(function () { 
              return setLocation(stepLocation, options)
                .then(getPokemon(currentTime, baseLocation, options))
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
    getNearby: get
  };
}

module.exports = Pokespotter;
module.exports.Pokespotter = Pokespotter;
module.exports.Pokedex = utils.Pokedex;

