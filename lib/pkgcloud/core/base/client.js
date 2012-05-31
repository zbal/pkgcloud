/*
 * client.js: Base client from which all pkgcloud clients inherit from 
 *
 * (C) 2011 Nodejitsu Inc.
 *
 */

var fs = require('fs'),
    events = require('eventemitter2'),
    morestreams = require('morestreams'),
    request = require('request'),
    utile = require('utile'),
    qs = require('querystring'),
    common = require('../../common'),
    errs = require('errs');

var Client = exports.Client = function (options) {
  events.EventEmitter2.call(this, { delimiter: '::', wildcard: true });
  this.config = options || {};
};

utile.inherits(Client, events.EventEmitter2);

Client.prototype.request = function () {
  var self = this,
      options = {},
      callback,
      errback;
        
  //
  // Parse the arguments passed in.
  //
  parsed   = this._requestOptions.apply(this, arguments);
  options  = parsed.options;
  callback = parsed.callback;
  errback  = parsed.errback;

  if (!options.path) {
    return errs.handle(
      errs.create({ message: 'No path was provided' }), 
      errback
    );
  }

  function handleRequest(err, res, body) {
    if (err) {
      return errback(err);
    }

    var statusCode = res.statusCode.toString(),
        err2;

    if (Object.keys(self.failCodes).indexOf(statusCode) !== -1) {
      //
      // TODO: Support more than JSON errors here
      //
      err2 = {
        provider: self.provider,
        failCode: self.failCodes[statusCode],
        message: self.provider + ' Error (' + 
          statusCode + '): ' + self.failCodes[statusCode]
      };

      try {
        err2.result = typeof body === 'string' 
          ? JSON.parse(body)
          : body;
      } 
      catch (e) { 
        err2.result = { err: body }; 
      }
      
      return errback(errs.create(err2));
    }
    
    callback(body, res);
  }

  //
  // Setup any specific request options before 
  // making the request
  //
  if (this.before) {
    var errors, fn, i;
    
    for (i in this.before) {
      fn = this.before[i];
      try {
        options = fn.call(this, options) || options;
      } 
      catch (exc) { 
        //
        // on errors do error handling, break.
        //
        errs.handle(exc, errback); 
        errors = true; 
        break; 
      }
    }
    
    if (errors) { 
      return; 
    }
  }

  //
  // Set the url for the request based
  // on the `path` supplied.
  //
  if (typeof options.path === 'string') {
    options.path = [options.path];
  } 
  
  options.url = this.url.apply(this, options.path);

  //
  // Remark: Dont delete the delete. This options path thing 
  // was messing request up.
  //
  delete options.path;

  if (!errback || !callback) {
    try { return request(options) } 
    catch (exc1) { return errs.handle(exc1) }
  } 
  
  try { return request(options, handleRequest) } 
  catch (exc2) { return errs.handle(exc2, errback) }
};

Client.prototype._requestOptions = function () {
  var options = {},
      callback,
      errback,
      encoded;
  
  if (arguments.length === 3) {
    errback = arguments[1];
    callback = arguments[2];
    options = typeof arguments[0] === 'object' ? arguments[0] : {
      method: 'GET',
      path: arguments[0],
      headers: {}
    };
  }
  else if (arguments.length === 4) {
    errback = arguments[2];
    callback = arguments[3];
    options = {
      method: arguments[0],
      path: arguments[1],
      headers: {}
    };
  }
  else if (arguments.length === 5) {
    encoded = qs.encode(arguments[2]);
    errback = arguments[3];
    callback = arguments[4];
    options = {
      method: arguments[0],
      path: arguments[1] + (encoded ? '?' + encoded : ''),
      headers: {}
    };
  }
  
  return {
    callback: callback,
    errback: errback,
    options: options
  };
}
