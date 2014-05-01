/*!
 * Expressjs | Connect - favicon
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var crypto = require('crypto');
var fresh = require('fresh');
var fs = require('fs');
var path = require('path');
var resolve = path.resolve;

/**
 * Serves the favicon located by the given `path`.
 *
 * @param {String} path
 * @param {Object} options
 * @return {Function} middleware
 * @api public
 */

module.exports = function favicon(path, options){
  var options = options || {}
    , maxAge = options.maxAge || 86400000
    , icon; // favicon cache
  var stat;

  if (!path) throw new TypeError('path to favicon.ico is required');

  path = resolve(path);
  stat = fs.statSync(path);

  if (!stat) throw createNoExistsError(path);
  if (stat.isDirectory()) throw createIsDirError(path);

  return function favicon(req, res, next){
    if ('/favicon.ico' !== req.url) return next();

    if ('GET' !== req.method && 'HEAD' !== req.method) {
      var status = 'OPTIONS' === req.method ? 200 : 405;
      res.writeHead(status, {'Allow': 'GET, HEAD, OPTIONS'});
      res.end();
      return;
    }

    if (icon) return send(req, res, icon);

    fs.readFile(path, function(err, buf){
      if (err) return next(err);
      icon = {
        headers: {
          'Content-Type': 'image/x-icon',
          'Content-Length': buf.length,
          'Cache-Control': 'public, max-age=' + (maxAge / 1000),
          'etag': '"' + md5(buf) + '"'
        },
        body: buf
      };
      send(req, res, icon);
    });
  };
};

function createIsDirError(path) {
  var error = new Error('EISDIR, illegal operation on directory \'' + path + '\'');
  error.code = 'EISDIR';
  error.errno = 28;
  error.path = path;
  error.syscall = 'open';
  return error;
}

function createNoExistsError(path) {
  var error = new Error('ENOENT, no such file or directory \'' + path + '\'');
  error.code = 'ENOENT';
  error.errno = 34;
  error.path = path;
  error.syscall = 'open';
  return error;
}

function md5(str, encoding){
  return crypto
    .createHash('md5')
    .update(str, 'utf8')
    .digest(encoding || 'hex');
}

function send(req, res, icon){
  var _fresh = fresh(req.headers, icon.headers);
  var buf = _fresh ? '' : icon.body;
  var status = _fresh ? 304 : 200;

  res.writeHead(status, icon.headers);
  res.end(buf);
}
