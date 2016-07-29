var PokemonGO = require('pokemon-go-node-api');
var geolib = require('geolib');

function convertPokemon(input, currentTime, baseLocation) {
  var result = {};
  result.spawnPointId = input.SpawnPointId;
  result.longitude = input.Longitude;
  result.latitude = input.Latitude;
  result.expirationTime = currentTime + input.TimeTillHiddenMs;
  result.pokemonId = input.pokemon ? input.pokemon.PokemonId : null;
  if (!result.pokemonId && input.PokedexTypeId) {
    result.pokemonId = input.PokedexTypeId
  }
  var pokeInfo = PokemonGO.pokemonlist[result.pokemonId - 1];
  if (pokeInfo) {
    result.name = pokeInfo.name;
  }
  result.distance = geolib.getDistance(baseLocation, result);
  return result;
}

function locWrap(location) {
  return {
    type: 'coords',
    coords: location
  };
}

module.exports = {
  convertPokemon: convertPokemon,
  locWrap: locWrap
}