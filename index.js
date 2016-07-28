'use strict';

var Q = require('q');
var PokemonGO = require('pokemon-go-node-api');

function convertPokemon(input, currentTime) {
  var result = {};
  result.longitude = input.Longitude;
  result.latitude = input.Latitude;
  result.expiration_time = Math.round((currentTime + input.TimeTillHiddenMs) / 1000);
  result.pokemonId = input.pokemon ? input.pokemon.PokemonId : null;

  return result;
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

  function get(location) {
    return Q.Promise(function (resolve, reject) {
      if (!location.longitude || !location.latitude) {
        return reject(new Error('Invalid coordinates. Must contain longitude and latitude'));
      }
      
      var api = new PokemonGO.Pokeio();
      var locationWrapper = {
        type: 'coords',
        coords: location
      };
      
      api.init(username, password, locationWrapper, provider, function (err) {
        if (err) {
          return reject(err);
        }

        var pokemonFound = [];
        var currentTime = Date.now();

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
            });
          }

          resolve(pokemonFound);
        });
      })
    });
  }

  return {
    get: get
  };
}

module.exports = Pokespotter;