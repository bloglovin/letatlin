/* jshint node: true */
'use strict';

var lib = {
  url: require('url'),
  path: require('path'),
  async: require('async'),
  minimist: require('minimist'),
  semver: require('semver'),
  Etcd: require('node-etcd'),
  formats: require('./lib/formats')
};

var internal = {};

function letatlin(env, callback) {
  // Get information on the application that's hosting us
  // We check for an etcd-flag that tells us to connect to a non-local etcd.
  var args = lib.minimist(process.argv.slice(2));
  // And get the package.json info for the application.
  var packageInfo = require(process.cwd() + '/package.json');

  // Create an etcd client
  var url = args.etcd ? lib.url.parse(args.etcd) : {hostname: '127.0.0.1'};
  var etcd = new lib.Etcd(url.hostname, url.port || 4001);

  // Worker function for our config fetcher
  function getConfig(info, callback) {
    etcd.get(info.key, {
      recursive: !!info.recursive
    }, function getResult(error, result) {
      if (error) return callback(error);

      var value;

      if (result.node.dir) {
        // Recursively map etcd nodes in a dir to an object.
        value = internal.dirToObject(result.node);
      }
      else {
        value = result.node.value;
        // If a format has been specified we try to parse the
        if (value !== undefined && info.format && lib.formats[info.format]) {
          value = lib.formats[info.format](value);
        }
      }

      callback(null, value);
    });
  }

  // Perform config GETs as a series of tasks.
  var tasks = {};
  for (var name in env) {
    tasks[name] = lib.async.apply(getConfig, env[name]);
  }
  lib.async.series(tasks, callback);
}

// Recursively map etcd nodes in a dir to an object.
internal.dirToObject = function dirToObject(dir) {
  var o = {};

  dir.nodes.forEach(function useNode(node) {
    var name = lib.path.basename(node.key);
    if (node.dir) {
      o[name] = dirToObject(node);
    }
    else {
      o[name] = node.value;
    }
  });

  return o;
};

module.exports = letatlin;
