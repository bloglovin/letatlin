/* jshint node: true */
/*global suite, test, before */
'use strict';

var lib = {
  assert: require('assert'),
  fs: require('fs'),
  url: require('url'),
  nock: require('nock'),
  letatlin: require('../'),
  mockfs: require('mock-fs')
};

var assert = lib.assert;
var etcd = lib.nock('http://127.0.0.1:4001');

etcd.get('/v2/keys/letatlin-test/plain?recursive=false')
  .reply(200, {"action":"get","node":{"key":"/letatlin-test/plain","value":"plain value","modifiedIndex":79318,"createdIndex":79318}}, { 'content-type': 'application/json',
  'x-etcd-index': '79326',
  'x-raft-index': '943394',
  'x-raft-term': '15',
  date: 'Tue, 29 Jul 2014 11:34:25 GMT',
  'transfer-encoding': 'chunked' });

etcd.get('/v2/keys/letatlin-test/plain?recursive=false').reply(500, {});

suite('Persist and fall back', function testLoadingAllTypes() {
  var options = {
    persistPath: 'mock/environment.config.json'
  };
  var config = {
    plain: {key:'/letatlin-test/plain'}
  };

  test('Persist', function testPersist(done) {
    lib.mockfs({
      'mock': {},
    });

    lib.letatlin(config, options, function loadResult(error, values) {
      if (error) {
        lib.mockfs.restore();
        assert.ifError(error);
      }

      var persisted = lib.fs.readFileSync(options.persistPath, {encoding:'utf8'});
      lib.mockfs.restore();

      assert.equal(persisted, JSON.stringify({
        "/letatlin-test/plain": "plain value"
      }, null, '  '));

      done();
    });
  });

  test('Fall back', function testFallback(done) {
    lib.mockfs({
      'mock/environment.config.json': '{"/letatlin-test/plain": "fallback value"}',
    });

    lib.letatlin(config, options, function loadResult(error, values) {
      lib.mockfs.restore();

      assert.ifError(error);
      assert.deepEqual(values, {"plain": "fallback value"});
      done();
    });
  });
});
