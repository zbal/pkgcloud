/*
 * sqlServer.js: Database methods for working with sql servers from Azure Cloud
 *
 * (C) Microsoft Open Technologies, Inc.
 *
 */

var errs = require('errs'),
  async = require('async'),
  auth = require('../../../common/auth'),
  templates = require('../../utils/templates'),
  keyfile = require('../../utils/keyfile.js'),
  azureApi = require('../../utils/azureApi.js'),
  PATH = require('path'),
  xml2JSON = require('../../utils/xml2json.js').xml2JSON,
  _ = require('underscore'),
  url = require('url');

exports.init = function (options) {
  this.serversUrl = options.serversUrl || azureApi.SQL_MANAGEMENT_ENDPOINT;
  this.version = azureApi.SQL_MANAGEMENT_API_VERSION;

  // add the auth keys for request authorization
  this.azureKeys = {};
  this.subscriptionId = this.config.subscriptionId;

  // add the auth keys for request authorization
  this.azureKeys = keyfile.readFromFile(this.config.managementCertificate);
  this.azureKeys.subscriptionId = this.config.subscriptionId;
  this.azureKeys.storageAccount = this.config.storageAccount;
  this.azureKeys.storageAccessKey = this.config.storageAccessKey;

  this.before.push(auth.azure.sqlSignature);
};

//  Create a new Azure SQL Server
//  Need name of table to create
//  ### @options {Object} table create options.
//  ##### @options['name'] {String} Name of the new table.(required)
exports.create = function (options, callback) {

  var params = {},
    headers = {},
    self = this,
    body;

  if (!options || typeof options === 'function') {
    return errs.handle(errs.create({
      message: 'Options required to create a database.'
    }), Array.prototype.slice.call(arguments).pop());
  }

  // Check for dbUsername
  if (!options['dbUsername']) {
    return errs.handle(errs.create({
      message: 'options.dbUsername is a required option'
    }), Array.prototype.slice.call(arguments).pop());
  }

  // Check for dbPassword
  if (!options['dbPassword']) {
    return errs.handle(errs.create({
      message: 'options.dbPassword is a required option'
    }), Array.prototype.slice.call(arguments).pop());
  }

   // Check for dbLocation
  if (!options['dbLocation']) {
    return errs.handle(errs.create({
      message: 'options.dbLocation is a required option'
    }), Array.prototype.slice.call(arguments).pop());
  }

  this.username = params.username = options.dbUsername;
  params.password = options.dbPassword;
  params.location = options.dbLocation;

  // async execute the following tasks one by one and bail if there is an error
  async.waterfall([
    function (next) {
      var path = PATH.join(__dirname, 'templates/createSqlServer.xml');
      templates.load(path, next);
    },
    function (template, next) {
      // compile template with params
      body = _.template(template, params);
      //console.log(body);
      headers['content-length'] = body.length;
      self.request({
        method: 'POST',
        path: ['servers'],
        body:body,
        headers: headers
      }, next, function (body, res) {
        xml2JSON(body,function(err, data) {
          return err ? next(err) : next(null, data);
        });
      });
    }],
    function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, self.formatResponse(result));
      }
    }
  );
};

//  List the Azure SQL Servers in the current account
// ### @callback {Function} Continuation to respond to when complete. Returns array of Database objects.
exports.list = function (callback) {
  var servers = [],
    self = this;

  this.xmlRequest('GET', ['servers'], callback, function (body, res) {
    if (body && body.Server) {
      if (_.isArray(body.Server)) {
        body.Server.forEach(function (server) {
          servers.push(self.formatResponse(server));
        });
      } else {
        servers.push(self.formatResponse(body.Server));
      }
    }
    callback(null,servers);
  });
};

// Delete an Azure SQL Server
// ### @options {Object} Set of options can be
// #### options['id'] {String} id of the SQL server to delete (required)
// ### @callback {Function} Continuation to respond to when complete.
exports.remove = function (id, callback) {
  var path;
  if (!id || typeof id === 'function') {
    return errs.handle(errs.create({
      message: 'id is a required argument'
    }), Array.prototype.slice.call(arguments).pop());
  }

  path = 'servers/' + id;
  this.xmlRequest('DELETE', [path], callback, function (body, res) {
    callback(null, res.statusCode === 200)
  });
};

// Function formatResponse
// This function parse the response from the provider and return an object
// with the correct keys and values.
// ### @response {Object} The body response from the provider api
exports.formatResponse = function (response) {
  var serverName = response['#'] || response.Name,
    username = response.AdministratorLogin || this.username,
    serverUri = serverName + '.' + azureApi.SQL_ENDPOINT;


  var database = {
    id: serverName,
    port: azureApi.SQL_PORT,
    host: azureApi.SQL_ENDPOINT,
    uri: serverUri,
    username: username + '@' + serverUri,
    password: '*****'
  };

  console.log(database);
  return database;
};

exports.url = function () {
  var args = Array.prototype.slice.call(arguments);
  var url = 'https://' + this.serversUrl + '/' + this.subscriptionId + '/';
  if (args[0]) {
    url += args[0];
  }
  if (args[1]) {
    url += args[1];
  }
  return url;
};

