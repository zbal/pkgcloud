/*
 * client.js: Database client for Azure Tables Cloud Databases
 *
 * (C) Microsoft Open Technologies, Inc.
 *
 */

var utile = require('utile'),
  xml2JSON = require('../../utils/xml2json.js').xml2JSON,
  azure = require('../../client');

// Azure db types for options.dbType
var AZURE_TABLE = exports.AZURE_TABLE = 'AZURE_TABLE';
var AZURE_SQL = exports.AZURE_SQL = 'AZURE_SQL';

var Client = exports.Client = function (options) {
  azure.Client.call(this, options);

  if (!options || typeof options === 'function') {
    throw ('Azure database: options required to create a database.');
  }

  if (!options.dbType) {
    throw ('Azure database: options.dbType is a required option');
  }

  // mixin the correct db module depending on requested dbType in options
  switch(options.dbType) {
    case AZURE_TABLE:
      utile.mixin(this, require('./azureTables'));
      break;

    case AZURE_SQL:
      utile.mixin(this, require('./sqlServer'));
      break;

    default:
      throw('Azure database: unsupported database type ' + options.dbType);
      break;
  }

  // initialize the client with the options
  this.init(options);
};

utile.inherits(Client, azure.Client);

//
// Gets the version of the Azure Tables API we are running against
// Parameters: callback
//
Client.prototype.getVersion = function getVersion (callback) {
  return callback(null, this.version);
};

Client.prototype.xmlRequest = function query(method, url, errback, callback) {
  if (typeof url === 'function') {
    callback = errback;
    errback = url;
    url = method;
    method = 'GET';
  }

  return this.request(method, url, errback, function (body, res) {
    xml2JSON(body,function (err, data) {
      if (err) {
        errback(err);
      } else {
        callback(data, res);
      }
    });
  });
};


