'use strict';

///
/// EXTERNAL DEPENDENCIES
///

var Q = require('q');
var PokemonGO = require('pokemon-go-node-api');
var _ = require('lodash');
var geocoder = require('node-geocoder')({ provider: 'openstreetmap' });

///
/// HELPERS
///

var geo = require('./geo-helper');
var utils = require('./utils');
var locWrap = utils.locWrap;
var convertPokemon = utils.convertPokemon;

function Spotter(config) {
  var isLoggedIn = false;
  config = _.defaults(config, { provider: 'google' });

  if (!config.username || !config.password) {
    throw new Error('You need to pass a username and password');
  }

  var api = new PokemonGO.Pokeio();
  api.playerInfo.debug = false;

  /**
   * Gets all the Pokemon around a certain location.
   * The location has to be latitude, longitude
   * The options are:
   *  - requestDelay: Artificially delays execution of calls to avoid limitations of API
   * 
   * @param {{latitude, longitude}} location The central location to check
   * @param {{requestDelay}} options Alter behavior of the call
   * @returns
   */
  function get(location, options) {
    options = _.defaults(options, {
      requestDelay: 0,
      currentTime: Date.now()
    });
    return logIn(config, location, options)
      .then(getPokemon(options.currentTime, location, options));
  }

  ///
  /// API INTERACTION
  ///

  function logIn(config, location, options) {
    return Q.Promise(function (resolve, reject) {
      if (isLoggedIn) {
        setLocation(location, options).then(resolve);
        return;
      }
      api.init(config.username, config.password, locWrap(location), config.provider, function (err) {
        if (err) {
          return reject(err);
        }
        isLoggedIn = true;
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

  return {
    get: get,
    getNearby: get
  };
}

module.exports = Spotter;