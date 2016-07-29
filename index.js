'use strict';

var Q = require('q');
var PokemonGO = require('pokemon-go-node-api');
var _ = require('lodash');

var geo = require('./lib/geo-helper');

function convertPokemon(input, currentTime) {
  var result = {};
  result.spawnPointId = input.SpawnPointId;
  result.longitude = input.Longitude;
  result.latitude = input.Latitude;
  result.expiration_time = Math.round((currentTime + input.TimeTillHiddenMs) / 1000);
  result.pokemonId = input.pokemon ? input.pokemon.PokemonId : null;
  if (!result.pokemonId && input.PokedexTypeId) {
    result.pokemonId = input.PokedexTypeId
  }
  var pokeInfo = PokemonGO.pokemonlist[result.pokemonId - 1];
  if (pokeInfo) {
    result.name = pokeInfo.name;
  }
  return result;
}

function locWrap(location) {
  return {
    type: 'coords',
    coords: location
  };
}

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

    return Q.Promise(function (resolve, reject) {
      if (!location.longitude || !location.latitude) {
        return reject(new Error('Invalid coordinates. Must contain longitude and latitude'));
      }
      
      var api = new PokemonGO.Pokeio();
      var locations = geo.getCoordinatesForSteps(location, steps);

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

      api.init(username, password, locWrap(locations[0]), provider, function (err) {
        if (err) {
          return reject(err);
        }
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

        visitLocations().then(function () {
          var result = _.chain(pokemonFound).flatten().uniqWith(function (a, b) {
            return a.spawnPointId === b.spawnPointId && a.pokemonId === b.pokemonId;
          }).value();
          resolve(result);
        }).catch(function (err) {
          reject(err);
        });
      })
    });
  }

  return {
    get: get
  };
}

module.exports = Pokespotter;