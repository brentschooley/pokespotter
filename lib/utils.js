var PokemonGO = require('pokemon-go-node-api');

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

module.exports = {
  convertPokemon: convertPokemon,
  locWrap: locWrap
}