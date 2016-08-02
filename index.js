'use strict';

///
/// EXTERNAL DEPENDENCIES
///

var Q = require('q');
var PokemonGO = require('pokemon-go-node-api');
var _ = require('lodash');
var geocoder = require('node-geocoder')({ provider: 'openstreetmap' });
var chalk = require('chalk');
var warning = chalk.bold.yellow;
var info = chalk.bold.cyan;
var Spinner = require('cli-spinner').Spinner;

var api = new PokemonGO.Pokeio();
api.playerInfo.debug = false;
var searchSpinner = new Spinner('Searching.. %s');

///
/// GLOBAL
///

var DEBUG = false;

///
/// HELPERS
///

var geo = require('./lib/geo-helper');
var utils = require('./lib/utils');
var Spotter = require('./lib/spotter');
var locWrap = utils.locWrap;
var convertPokemon = utils.convertPokemon;

function printWarning(spotterCount, locationCount) {
  var batchSize = Math.ceil(locationCount/spotterCount);
  var callTime = batchSize * 5;
  console.warn('%s Important', warning('!'));
  console.warn('%s Due to limitations in the API will take roughly %d seconds.', warning('!'), callTime);
  console.warn('%s To reduce this time, pass in the constructor an array of optimally %s accounts.', warning('!'), locationCount);
}

function delayExecution(delay) {
  return Q.Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, delay);
  });
}

function debug(msg) {
  if (DEBUG) {
    console.log('%s %s', info('i'), msg);
  }
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
function Pokespotter(users, password, provider) {
  if (!Array.isArray(users) && !password) {
    if (process.env.PGO_USERNAME && process.env.PGO_PASSWORD) {
      users = [{
        username: process.env.PGO_USERNAME,
        password: process.env.PGO_PASSWORD,
        provider: (process.env.PGO_PROVIDER || 'google')
      }];
    } else {
      throw new Error('You need to pass a username and password');
    }
  } else if (!Array.isArray(users)) {
    users = [{
      username: users,
      password: password, 
      provider: (provider || 'google')
    }];
  } 
  
  if (users.length === 0) {
    throw new Error('Invalid or no credentials passed');
  }

  var spotters = users.map(function (u) { return Spotter(u, DEBUG) });
  
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

    debug('Retrieve location');
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

    function searchLocation(spotter, locs, baseLocation) {
      if (locs.length === 0 || !locs[0]) {
        return Q([]);
      }

      var result = spotter.get(locs[0], baseLocation, options);
      var pokemonList = [];
      locs.forEach(function (loc, idx) {
        if (idx !== 0) {
          result = result.then(function () {
            return delayExecution(utils.API_LIMIT_TIME).then(function () {
              return spotter.get(loc, baseLocation, options);
            });
          });
        }
        result = result.then(function (p) {
          pokemonList.push(p);
          return p;
        });
      });
      return result.then(function () {
        return _.flatten(pokemonList);
      });
    }

    return getLocation.then(function (baseLocation) {
      debug('Location retrieved');
      var locations = geo.getCoordinatesForSteps(baseLocation, options.steps);
      var batchSize = Math.ceil(locations.length / spotters.length);
      var locationCount = locations.length;
      var searchPromises;

      if (spotters.length !== locationCount) {
        printWarning(spotters.length, locationCount);
      }

      debug('Search for Pokemon in ' + locationCount + ' locations');
      
      if (DEBUG) {
        searchSpinner.start();
      }

      if (spotters.length === 1) {
        searchPromises = [searchLocation(spotters[0], locations, baseLocation)];
      } else if (spotters.length === locations.length) {
        searchPromises = spotters.map(function (spotter, idx) {
          return spotter.get(locations[idx], options);
        });
      } else {
        var spotterJobs = new Array(spotters.length);
        for (var i = 0; i < spotters.length; i++) {
          spotterJobs[i] = locations.splice(0, batchSize);
        }

        searchPromises = spotterJobs.map(function (job, idx) {
          return searchLocation(spotters[idx], job, baseLocation);
        });
      }

      return Q.all(searchPromises).then(function (pokemonFound) {
        var result = _.chain(pokemonFound).flatten().uniqWith(function (a, b) {
          return a.spawnPointId === b.spawnPointId && a.pokemonId === b.pokemonId;
        }).value();

        if (DEBUG) {
          searchSpinner.stop(true);
        }
        
        debug(result.length + ' Pokemon found.');
        return result;
      });
    });
  }

  var obj = {
    get: get,
    getNearby: get
  };

  Object.defineProperty(obj, 'DEBUG', {
    set: function (val) {
      DEBUG = val;
    },
    get: function () {
      return DEBUG
    }
  });

  return obj;
}

module.exports = Pokespotter;
module.exports.Pokespotter = Pokespotter;
module.exports.Pokedex = utils.Pokedex;
module.exports.getMapsUrl = utils.getMapsUrl;

Object.defineProperty(module.exports, 'DEBUG', {
  set: function (val) {
    DEBUG = val;
  },
  get: function () {
    return DEBUG
  }
});