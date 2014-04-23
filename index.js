/* jshint node: true */
'use strict';

var lib = {
  url: require('url'),
  fs: require('fs'),
  path: require('path'),
  async: require('async'),
  minimist: require('minimist'),
  semver: require('semver'),
  Etcd: require('node-etcd'),
  formats: require('./lib/formats')
};

var internal = {};

function letatlin(env, options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  options.persistConfig = options.persistConfig === undefined ? true : options.persistConfig;
  options.persistPath = options.persistPath || './environment.config.json';

  // The raw key-values from etcd
  var raw = {};
  // Get information on the application that's hosting us
  // We check for an etcd-flag that tells us to connect to a non-local etcd.
  var args = lib.minimist(process.argv.slice(2));
  // And get the package.json info for the application.
  var packageInfo = require(process.cwd() + '/package.json');

  // Create an etcd client
  var url = args.etcd ? lib.url.parse(args.etcd) : {hostname: '127.0.0.1'};
  var etcd = new lib.Etcd(url.hostname, url.port || 4001);

  // Worker function for our config fetcher
  function getConfig(info, done) {
    etcd.get(info.key, {
      recursive: !!info.recursive
    }, function getResult(error, result) {
      if (error) return done(error);

      var value;

      if (result.node.dir) {
        // Recursively map etcd nodes in a dir to an object.
        value = internal.dirToObject(result.node, raw);
        raw[result.node.key] = value;
      }
      else {
        raw[result.node.key] = value = result.node.value;
        // If a format has been specified we try to parse the value.
        if (value !== undefined && info.format && lib.formats[info.format]) {
          value = lib.formats[info.format](value);
        }
      }

      done(null, value);
    });
  }

  // Perform config GETs as a series of tasks.
  var tasks = {};
  for (var name in env) {
    tasks[name] = lib.async.apply(getConfig, env[name]);
  }
  lib.async.series(tasks, function loadResult(error, values) {
    if (error) {
      internal.storedConfigFallback(error, options, env, callback);
      return;
    }

    // Persist the raw config if we're configured to do so.
    if (options.persistConfig) {
      lib.fs.writeFile(options.persistPath,
        JSON.stringify(raw, null, '  '),
        {encoding:'utf8'},
        function persistResult(error) {
          if (error) {
            console.error('Failed to persist configuration', error);
          }
        }
      );
    }

    callback(null, values);
  });
}

// If we fail to read config off etcd we still want to start the application
// if we have a config on file. This might happen if the process i restarted.
internal.storedConfigFallback = function (error, options, env, callback) {
  if (!options.persistConfig) return callback(error);

  lib.fs.readFile(options.persistPath,
    {encoding:'utf8'},
    function readResult(readError, data) {
      if (readError) return callback(error);

      try {
        var config = {};
        var rawConfig = JSON.parse(data);
        for (var name in env) {
          var info = env[name];
          var value = rawConfig[info.key];
          // If a format has been specified we try to parse the value.
          if (value !== undefined && info.format && lib.formats[info.format]) {
            value = lib.formats[info.format](value);
          }
          config[name] = value;
        }
        callback(null, config);
      } catch (transformError) {
        callback(transformError);
      }
    });
};

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
