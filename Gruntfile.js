/*jslint node: true */
'use strict';

var lintlovin = require('lintlovin');

module.exports = function (grunt) {
  lintlovin.initConfig(grunt, {}, {
    noJSCS: true,
    // Opting out of this due to: https://github.com/juliangruber/builtins/pull/6
    noDependencyCheck: true,
  });
};
