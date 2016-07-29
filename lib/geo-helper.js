// This file is based on the work of https://github.com/AHAAAAAAA/PokemonGo-Map and ported to JS

var _ = require('lodash');

var RADIUS_WORLD = 6378.1; // in km
var BEARINGS = {
  NORTH: 0,
  EAST: 90,
  SOUTH: 180,
  WEST: 270
};
var PLAYER_PULSE_RADIUS = 0.07; // 70m
var xDistance = Math.sqrt(3)*PLAYER_PULSE_RADIUS;
var yDistance = 3*(PLAYER_PULSE_RADIUS/2);

function degreeToRadian(degrees) {
  return degrees * Math.PI / 180;
};

function radianToDegrees(radians) {
  return radians * 180 / Math.PI;
}

function getNewCoordinate(location, distance, bearing) {
  bearing = degreeToRadian(bearing);

  var coordinates = [degreeToRadian(location.latitude),degreeToRadian(location.longitude)];
  var newLatitudeInRadian = Math.asin(Math.sin(coordinates[0])*Math.cos(distance/RADIUS_WORLD) + Math.cos(coordinates[0])*Math.sin(distance/RADIUS_WORLD)*Math.cos(bearing));
  var newLongitudeInRadian = coordinates[1] + Math.atan2(Math.sin(bearing)*Math.sin(distance/RADIUS_WORLD)*Math.cos(coordinates[0]), Math.cos(distance/RADIUS_WORLD) - Math.sin(coordinates[0]) * Math.sin(newLatitudeInRadian));

  return {
    latitude: radianToDegrees(newLatitudeInRadian),
    longitude: radianToDegrees(newLongitudeInRadian)
  };
}

function getCoordinatesForSteps(initialLocation, steps) {
  var coordinates = [initialLocation];

  var ring = 1;
  var location = initialLocation;

  while(ring < steps) {
    location = getNewCoordinate(location, yDistance, BEARINGS.NORTH);
    location = getNewCoordinate(location, xDistance/2, BEARINGS.WEST);

    for (var direction = 0; direction < 6; direction++) {
      for (var i = 0; i < ring; i++) {
        switch (direction) {
          case 0:
            location = getNewCoordinate(location, xDistance, BEARINGS.EAST);
            break;
          case 1:
            location = getNewCoordinate(location, yDistance, BEARINGS.SOUTH);
            location = getNewCoordinate(location, xDistance/2, BEARINGS.EAST);
            break;
          case 2:
            location = getNewCoordinate(location, yDistance, BEARINGS.SOUTH);
            location = getNewCoordinate(location, xDistance/2, BEARINGS.WEST);
            break;
          case 3:
            location = getNewCoordinate(location, xDistance, BEARINGS.WEST);
            break;
          case 4:
            location = getNewCoordinate(location, yDistance, BEARINGS.NORTH);
            location = getNewCoordinate(location, xDistance/2, BEARINGS.WEST);
            break;
          case 5:
            location = getNewCoordinate(location, yDistance, BEARINGS.NORTH);
            location = getNewCoordinate(location, xDistance/2, BEARINGS.EAST);
          break;
        }
        coordinates.push(location);
      }
    }
    ring++;
  }

  return _.uniqWith(coordinates, function (a, b) {
    return a.longitude === b.longitude && a.latitude === b.latitude;
  });
}

module.exports = {
  getCoordinatesForSteps: getCoordinatesForSteps
};