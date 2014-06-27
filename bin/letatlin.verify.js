/* jshint node: true */
'use strict';

var lib = {
  letatlin: require('../'),
  errors: require('./cli-errors'),
  utils: require('./letatlin.utils'),
};

module.exports = function verifyCommands(opt) {
  return new Verify(opt);
};

function Verify(opt) {
  this.opt = opt;
}

Verify.prototype.config = function verifyConfig(object) {
  var config = lib.utils.flattenKeys(object);
  var keys = Object.getOwnPropertyNames(config);
  var env = {};

  keys.forEach(function createEnvEntry(key) {
    env[key] = {key:key};
  });

  lib.letatlin.load(env, {
    etcd: this.opt['--etcd']
  }, handleLetatlinLoadResult);
};

Verify.prototype.amoreEnv = function verifyAmoreEnv(object) {
  lib.letatlin.load(object.environment, {
    etcd: this.opt['--etcd']
  }, handleLetatlinLoadResult);
};

function handleLetatlinLoadResult(error, values) {
  if (error) {
    console.error('Failed to load values from etcd', error);
    process.exit(lib.errors.UNEXPECTED);
  }
  else {
    console.error('Successfully loaded:\n - ', Object.getOwnPropertyNames(values).join('\n  - '));
  }
}
