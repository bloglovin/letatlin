/* jshint node: true */
'use strict';

// Parse the auth part of an url and provide the result as
// `user` and `password` attributes on the url object.
exports.parseUrlAuth = function (url) {
  if (url.auth) {
    var components = url.auth.split(':');
    url.user = components[0];
    if (components.length > 1) {
      url.password = components.slice(1).join(':');
    }
  }
  return url;
};
