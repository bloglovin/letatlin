/* jshint node: true, quotmark: false */
/*global suite, test */
'use strict';

var lib = {
  assert: require('assert'),
  url: require('url'),
  nock: require('nock'),
  letatlin: require('../')
};

var etcd = lib.nock('http://127.0.0.1:4001');

etcd.get('/v2/keys/letatlin-test/plain?recursive=false')
  .reply(200, {"action":"get","node":{"key":"/letatlin-test/plain","value":"plain value","modifiedIndex":79318,"createdIndex":79318}}, { 'content-type': 'application/json',
  'x-etcd-index': '79326',
  'x-raft-index': '943394',
  'x-raft-term': '15',
  date: 'Tue, 29 Jul 2014 11:34:25 GMT',
  'transfer-encoding': 'chunked' });

etcd.get('/v2/keys/letatlin-test/json?recursive=false')
  .reply(200, {"action":"get","node":{"key":"/letatlin-test/json","value":"{\"foo\":\"bar\"}","modifiedIndex":79307,"createdIndex":79307}}, { 'content-type': 'application/json',
  'x-etcd-index': '79326',
  'x-raft-index': '943394',
  'x-raft-term': '15',
  date: 'Tue, 29 Jul 2014 11:34:25 GMT',
  'transfer-encoding': 'chunked' });

etcd.get('/v2/keys/letatlin-test/url?recursive=false')
  .reply(200, {"action":"get","node":{"key":"/letatlin-test/url","value":"http://example.com","modifiedIndex":79306,"createdIndex":79306}}, { 'content-type': 'application/json',
  'x-etcd-index': '79326',
  'x-raft-index': '943394',
  'x-raft-term': '15',
  date: 'Tue, 29 Jul 2014 11:34:25 GMT',
  'transfer-encoding': 'chunked' });

etcd.get('/v2/keys/letatlin-test/dir?recursive=true')
  .reply(200, {"action":"get","node":{"key":"/letatlin-test/dir","dir":true,"nodes":[{"key":"/letatlin-test/dir/foo","value":"bar","modifiedIndex":79309,"createdIndex":79309}],"modifiedIndex":79309,"createdIndex":79309}}, { 'content-type': 'application/json',
  'x-etcd-index': '79326',
  'x-raft-index': '943394',
  'x-raft-term': '15',
  date: 'Tue, 29 Jul 2014 11:34:25 GMT',
  'transfer-encoding': 'chunked' });

var assert = lib.assert;

suite('All types', function testLoadingAllTypes() {
  var options = {
    persistConfig: false
  };

  test('Plain', function getPlainValue(done) {
    lib.letatlin({
      plain: {key:'/letatlin-test/plain'}
    }, options, function envResult(error, values) {
      assert.ifError(error);
      assert.deepEqual(values, {plain:'plain value'});
      done();
    });
  });

  test('JSON', function getJsonValue(done) {
    lib.letatlin({
      json: {key:'/letatlin-test/json', format:'json'}
    }, options, function envResult(error, values) {
      assert.ifError(error);
      assert.deepEqual(values, {json: {foo:'bar'}});
      done();
    });
  });

  test('URL', function getJsonValue(done) {
    lib.letatlin({
      url: {key:'/letatlin-test/url', format:'url'}
    }, options, function envResult(error, values) {
      assert.ifError(error);

      var expect = lib.url.parse('http://example.com');
      assert.deepEqual(values, {url: expect});
      done();
    });
  });

  test('Recursive', function getJsonValue(done) {
    lib.letatlin({
      dir: {key:'/letatlin-test/dir', recursive:true}
    }, options, function envResult(error, values) {
      assert.ifError(error);
      assert.deepEqual(values, {dir: {foo:'bar'}});
      done();
    });
  });

});
