/*
 * client.js: Base client from which all Linode clients inherit from
 *
 */

var utile = require('utile'),
    request = require('request'),
    base = require('../core/base');

var Client = exports.Client = function (options) {
  base.Client.call(this, options);

  options = options || {};

  // Allow overriding serversUrl in child classes
  this.provider   = 'linode';
  this.version = options.version || '2012-04-01';
  this.serversUrl = options.serversUrl 
    || this.serversUrl
    || 'api.linode.com';
    
  if (!this.before) {
    this.before = [];
  }
};

utile.inherits(Client, base.Client);

Client.prototype._toArray = function toArray(obj) {
  if (typeof obj === 'undefined') {
    return [];
  }
  
  return Array.isArray(obj) ? obj : [obj];
};

// TODO
Client.prototype.failCodes = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Resize not allowed',
  404: 'Item not found',
  409: 'Build in progress',
  413: 'Over Limit',
  415: 'Bad Media Type',
  500: 'Fault',
  503: 'Service Unavailable'
};

Client.prototype.successCodes = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-authoritative information',
  204: 'No content'
};
