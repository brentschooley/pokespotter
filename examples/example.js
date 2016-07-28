'use strict';

var username = process.env.PGO_USERNAME || '';
var password = process.env.PGO_PASSWORD || '';
var provider = process.env.PGO_PROVIDER || '';

var location = {
  latitude: 52.52376761438714,
  longitude: 13.411720991134644
};

var Pokespotter = require('../')(username, password, provider);

Pokespotter.get(location).then(function (pokemon) {
  console.log(pokemon);
}).catch(function (err) {
  console.error(err);
})