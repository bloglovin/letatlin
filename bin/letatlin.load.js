/* jshint node: true */
'use strict';

var lib = {
  url: require('url'),
  readline: require('readline'),
  Etcd: require('bletcd'),
  errors: require('./cli-errors'),
  utils: require('./letatlin.utils')
};

module.exports = function loadCommands(opt) {
  return new Load(opt);
};

function Load(opt) {
  this.opt = opt;
}

Load.prototype.config = function loadConfig(object) {
  var config = lib.utils.flattenKeys(object);
  var keys = Object.getOwnPropertyNames(config);
  var setFunc = this.opt['--interactive'] ? this.setKeyInteractive : this.setKey;

  // Create an etcd client
  var url = lib.url.parse(this.opt['--etcd']);
  var etcd = new lib.Etcd(url.hostname, url.port || 4001);
  setFunc = setFunc.bind(this, etcd);

  loadNext();

  function loadNext() {
    var key = keys.shift();
    setFunc(key, config[key], function setDone(abort) {
      if (!abort && keys.length) {
        process.nextTick(loadNext);
      }
    });
  }
};

Load.prototype.setKey = function setKey(etcd, key, value, callback) {
  if (this.opt['--overwrite']) {
    etcd.set(key, value, callback);
  }
  else {
    etcd.set(key, value, {prevExist:false}, setDone);
  }

  function setDone(error) {
    if (error) {
      console.error('Skipped', key + ':', error.message);
    }
    callback();
  }
};

Load.prototype.setKeyInteractive = function setKeyInteractive(etcd, key, value, callback) {
  etcd.get(key, function currentResult(error, result) {
    var exists = true;
    if (error && error.errorCode === 100) {
      exists = false;
    }
    else if (error) {
      console.error('Could not check if value exists');
      callback(true);
      return;
    }

    var rl = lib.readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    ask();

    function ask() {
      console.log('Setting', JSON.stringify(key));
      if (result.node) {
        console.log('Current value:', result.node.value);
      }
      console.log('New value:', value);

      rl.question('What do you want to do (w)rite, (m)odify, (c)ancel or (q)uit?\n> ', function reply(answer) {
        switch (answer) {
        case 'w':
          etcd.set(key, value, function setResult(error) {
            if (error) {
              console.error('Could not set', JSON.stringify(key));
              done(true);
            }
            else {
              done();
            }
          });
          break;
        case 'm':
          newValue();
          break;
        case 'c':
          done();
          break;
        case 'q':
          done(true);
          break;
        default:
          process.nextTick(ask);
        }
      });
    }

    function newValue() {
      rl.question('Enter a new value:\n> ', function reply(answer) {
        value = answer;
        ask();
      });
    }

    function done(abort) {
      rl.close();
      callback(abort);
    }
  });
};
