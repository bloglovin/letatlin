/* jshint node: true */
'use strict';

var lib = {
  fs: require('fs'),
  path: require('path'),
  util: require('util'),
  errors: require('./cli-errors')
};

exports.loadJson = function loadJson(path) {
  var file = lib.path.resolve(process.cwd(), path);

  if (!lib.fs.existsSync(file)) {
    console.error('No such file: ', file);
    process.exit(lib.errors.NOT_FOUND);
  }

  var json;
  try {
    json = lib.fs.readFileSync(file);
  } catch (error) {
    console.error('Could not read', path);
    console.error(error.message);
    process.exit(lib.errors.READ);
  }

  var result;
  try {
    result = JSON.parse(json);
  } catch (error) {
    console.error('Syntax error in', path);
    console.error(error.message);
    console.log(lib.util.inspect(error, { showHidden: true, depth: null }));
    process.exit(lib.errors.SYNTAX);
  }

  return result;
};

exports.flattenKeys = function flattenKeys(object, root, keys) {
  keys = keys || {};

  for (var key in object) {
    var value = object[key];
    var path = lib.path.join(root || '', key);

    if (typeof value === 'object') {
      flattenKeys(value, path, keys);
    }
    else if (typeof value === 'string') {
      keys[path] = value;
    }
  }

  return keys;
};
