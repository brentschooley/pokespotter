'use strict';

var PokemonGO = require('pokemon-go-node-api');

// using var so you can login with multiple users
var a = new PokemonGO.Pokeio();

//Set environment variables or replace placeholder text
var location = {
    type: 'name',
    name: process.env.PGO_LOCATION || ''
};

var username = process.env.PGO_USERNAME || '';
var password = process.env.PGO_PASSWORD || '';
var provider = process.env.PGO_PROVIDER || '';

a.init(username, password, location, provider, function(err) {
    if (err) throw err;

    console.log('1[i] Current location: ' + a.playerInfo.locationName);
    console.log('1[i] lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);

    a.GetProfile(function(err, profile) {
        if (err) throw err;

        console.log('1[i] Username: ' + profile.username);
        console.log('1[i] Poke Storage: ' + profile.poke_storage);
        console.log('1[i] Item Storage: ' + profile.item_storage);

        var poke = 0;
        if (profile.currency[0].amount) {
            poke = profile.currency[0].amount;
        }

        console.log('1[i] Pokecoin: ' + poke);
        console.log('1[i] Stardust: ' + profile.currency[1].amount);

        setInterval(function(){
            a.Heartbeat(function(err,hb) {
                if(err) {
                    console.log(err);
                }

                hb.cells.forEach(function (cell) {
                   cell.WildPokemon.forEach(function (pokemon) {
                       console.log(pokemon);
                   });
                });

            });
        }, 5000);

    });
});

