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
    body,
    err = this.validateOptions(options, ['dbUsername','dbPassword','dbLocation']);

  if (!options || typeof options === 'function') {
    callback = options;
  }

  if(err) {
    return callback(err);
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
        callback(null, self.formatServerResponse(result));
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
          servers.push(self.formatServerResponse(server));
        });
      } else {
        servers.push(self.formatServerResponse(body.Server));
      }
    }
    callback(null,servers);
  });
};

// Delete an Azure SQL Server
// ### @options {Object} Set of options can be
// #### options['id'] {String} id of the SQL server to delete (required)
// ### @callback {Function} Continuation to respond to when complete.
exports.remove = function (options, callback) {
  var path,
    err = this.validateOptions(options, ['id']);

  if (!options || typeof options === 'function') {
    callback = options;
  }

  if(err) {
    return callback(err);
  }

  path = 'servers/' + options.id;
  this.xmlRequest('DELETE', [path], callback, function (body, res) {
    callback(null, res.statusCode === 200)
  });
};

// Creates an Azure SQL Server firewall rule.
// The Set Server Firewall Rule operation updates an existing server-level
// firewall rule or adds a new server-level firewall rule for a SQL Database
// server that belongs to a subscription.
// A firewall rule with the start and end IP addresses set to 0.0.0.0 is a rule
// that allows connections to the server from Windows Azure related applications and services.
//
// PUT https://management.database.windows.net:8443/<subscription-id>/servers/<servername>/firewallrules/<rulename>
//
// ### @options {Object} Set of options can be
// #### options['id'] {String} id of the SQL server to delete (required)
// ### @callback {'ruleName'} name to assign to the new firewall rule.
// ### @callback {'startIpAddress'} name to assign to the new firewall rule.
// ### @callback {'endIpAddress'} name to assign to the new firewall rule.
exports.createServerFirewallRule = function (options, callback) {
  var headers = {},
    self = this,
    err = this.validateOptions(options, ['id','ruleName', 'startIpAddress','endIpAddress']);

  if (!options || typeof options === 'function') {
    callback = options;
  }

  if(err) {
    return callback(err);
  }

  // async execute the following tasks one by one and bail if there is an error
  async.waterfall([
    function (next) {
      var path = PATH.join(__dirname, 'templates/createFirewallRule.xml');
      templates.load(path, next);
    },
    function (template, next) {
      // compile template with params
      body = _.template(template, options);
      headers['content-length'] = body.length;
      self.request({
        method: 'PUT',
        path: 'servers/' + options.id + '/firewallrules/' + options.ruleName,
        body:body,
        headers: headers
      }, next, function (body, res) {
        next(null, res);
      });
    }],
    function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, { statusCode: result.statusCode });
      }
    }
  );
};

// Creates an Azure SQL Server firewall rule using IP autodetect.
// The Set Server Firewall Rule with IP Detect operation adds a
// new server-level firewall rule or updates an existing server-level
// firewall rule for a SQL Database server with requester’s IP address.
// This is useful when a user does not know his/her external IP address
// due to address translation, proxy servers, etc.
// POST https://management.database.windows.net:8443/<subscription-id>/servers/<servername>/firewallrules/<rulename>?op=AutoDetectClientIP
//
// ### @options {Object} Set of options can be
// #### options['id'] {String} id of the SQL server to delete (required)
// ### @callback {'ruleName} name to assign to the new firewall rule.
exports.createServerFirewallRuleWithIPDetect = function (options, callback) {
  var path,
    err = this.validateOptions(options, ['id','ruleName']);

  if (!options || typeof options === 'function') {
    callback = options;
  }

  if(err) {
    return callback(err);
  }

  path = 'servers/' + options.id + '/firewallrules/' + options.ruleName;
  this.request({
    method: 'POST',
    path: [path,'?op=AutoDetectClientIP']
  }, callback, function (body, res) {
    xml2JSON(body,function(err, data) {
      return err ? callback(err) : callback(null, {ipAddress: data['#'], statusCode:res.statusCode, ruleName:options.ruleName});
    });
  });
};

// Lists the sql server Firewall rules for a specific server.
// The Get Server Firewall Rules operation retrieves a list of all the server-level
// firewall rules for a SQL Database server that belongs to a subscription.
// GET https://management.database.windows.net:8443/<subscription-id>/servers/<servername>/firewallrules
// ### @options {Object} Set of options can be
// #### options['id'] {String} id of the SQL server to list firewall rules
// ### @callback {Function} Continuation to respond to when complete. Returns array of firewall rules.
exports.listServerFirewallRules  = function (options, callback) {
  var path,
    self = this,
    err = this.validateOptions(options, ['id']);

  if (!options || typeof options === 'function') {
    callback = options;
  }

  if(err) {
    return callback(err);
  }

  path = 'servers/' + options.id + '/firewallrules';
  this.xmlRequest('GET', [path], callback, function (body, res) {
    if (body) {
      callback(null, formatFirewallRulesResponse(body, options.id));
    }
  });
};

// Delete an Azure SQL Server firewall rule from a SQL Server
// The Delete Server Firewall Rule operation deletes a server-level firewall
// rule from a SQL Database server that belongs to a subscription.
// DELETE https://management.database.windows.net:8443/<subscription-id>/servers/<servername>/firewallrules/<rulename>
// ### @options {Object} Set of options can be
// #### options['id'] {String} id of the SQL server containing the firewall rule (required)
// #### options['ruleName'] {String} name of the firewall rule to delete (required)
// ### @callback {Function} Continuation to respond to when complete.
exports.deleteFirewallRule = function (options, callback) {
  var path,
    err = this.validateOptions(options, ['id','ruleName']);

  if (!options || typeof options === 'function') {
    callback = options;
  }

  if(err) {
    return callback(err);
  }

  path = 'servers/' + options.id + '/firewallrules/' + options.ruleName;
  this.xmlRequest('DELETE', [path], callback, function (body, res) {
    callback(null, res.statusCode === 200)
  });
};

// Function formatServerResponse
// This function parses the response from the provider and return an object
// with the correct keys and values.
// ### @response {Object} The body response from the provider api
exports.formatServerResponse = function (response) {
  var serverName = response['#'] || response.Name,
    username = response.AdministratorLogin || this.username,
    serverUri = serverName + '.' + azureApi.SQL_ENDPOINT;

  return {
    id: serverName,
    port: azureApi.SQL_PORT,
    host: azureApi.SQL_ENDPOINT,
    uri: serverUri,
    username: username + '@' + serverUri,
    password: '*****'
  };
};

// Function formatFirewallRulesResponse
// This function parses the response from the provider and return an object
// with the correct keys and values for a firewall rule.
// ### @response {Object} The body response from the provider api
var formatFirewallRulesResponse = function (body, serverId) {
  var rules = [];
  var formatRule = function(rule) {
    return {
      ruleName: rule.Name,
      serverId: serverId,
      startIpAddress: rule.StartIpAddress,
      endIpAddress: rule.EndIpAddress
    };
  }

  if (body) {
    if(body.FirewallRule) {
      rules.push(formatRule(body.FirewallRule));
    } else if (body.FirewallRules) {
      body.FirewallRules.forEach(function (rule) {
        rules.push(formatRule(rule));
      });
    }
  }
  return rules;
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

