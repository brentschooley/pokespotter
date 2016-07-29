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

function getMapsUrl(center, pokemon, steps, size) {
  var zoom = 18 - steps;
  size = size || '512x512';

  if (center.longitude && center.latitude) {
    center = `${center.latitude},${center.longitude}`;
  }

  var markers = pokemon.map((p, idx) => {
    var label;
    if (idx <= 9) {
      label = String.fromCharCode(idx + 49);
    } else {
      label = String.fromCharCode(idx + 55);
    }
    return `&markers=color:red|label:${label}|${p.latitude},${p.longitude}`
  }).join('');
  return `http://maps.google.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=512x512&maptype=roadmap&sensor=false${markers}`;
}

var Pokedex = ",Bulbasaur,Ivysaur,Venusaur,Charmander,Charmeleon,Charizard,Squirtle,Wartortle,Blastoise,Caterpie,Metapod,Butterfree,Weedle,Kakuna,Beedrill,Pidgey,Pidgeotto,Pidgeot,Rattata,Raticate,Spearow,Fearow,Ekans,Arbok,Pikachu,Raichu,Sandshrew,Sandslash,Nidoran♀,Nidorina,Nidoqueen,Nidoran♂,Nidorino,Nidoking,Clefairy,Clefable,Vulpix,Ninetales,Jigglypuff,Wigglytuff,Zubat,Golbat,Oddish,Gloom,Vileplume,Paras,Parasect,Venonat,Venomoth,Diglett,Dugtrio,Meowth,Persian,Psyduck,Golduck,Mankey,Primeape,Growlithe,Arcanine,Poliwag,Poliwhirl,Poliwrath,Abra,Kadabra,Alakazam,Machop,Machoke,Machamp,Bellsprout,Weepinbell,Victreebel,Tentacool,Tentacruel,Geodude,Graveler,Golem,Ponyta,Rapidash,Slowpoke,Slowbro,Magnemite,Magneton,Farfetch'd,Doduo,Dodrio,Seel,Dewgong,Grimer,Muk,Shellder,Cloyster,Gastly,Haunter,Gengar,Onix,Drowzee,Hypno,Krabby,Kingler,Voltorb,Electrode,Exeggcute,Exeggutor,Cubone,Marowak,Hitmonlee,Hitmonchan,Lickitung,Koffing,Weezing,Rhyhorn,Rhydon,Chansey,Tangela,Kangaskhan,Horsea,Seadra,Goldeen,Seaking,Staryu,Starmie,Mr. Mime,Scyther,Jynx,Electabuzz,Magmar,Pinsir,Tauros,Magikarp,Gyarados,Lapras,Ditto,Eevee,Vaporeon,Jolteon,Flareon,Porygon,Omanyte,Omastar,Kabuto,Kabutops,Aerodactyl,Snorlax,Articuno,Zapdos,Moltres,Dratini,Dragonair,Dragonite,Mewtwo,Mew".split(',');

module.exports = {
  convertPokemon: convertPokemon,
  locWrap: locWrap,
  Pokedex: Pokedex,
  getMapsUrl: getMapsUrl
}