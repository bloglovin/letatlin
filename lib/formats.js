/* jshint node: true */
'use strict';

var lib = {
  url: require('url'),
  utils: require('./utils')
};

// Parse URL values with the additional behaviour that we parse the
// auth part as well.
exports.url = function parseUrl(value) {
  var url = lib.url.parse(value);
  lib.utils.parseUrlAuth(url);
  return url;
};

// Parse JSON blobs.
exports.json = function parseJson(value) {
  try {
    value = JSON.parse(value);
  } catch (variable) {
    value = null;
  }
  return value;
};
