/*
 * sqlServer-test.js: Tests for azure SQL servers
 *
 * (C) Microsoft Open Technologies, Inc.
 *
 */

var vows    = require('vows'),
    helpers = require('../../helpers'),
    assert  = require('../../helpers/assert'),
    nock    = require('nock');

var config = helpers.loadConfig('azure');
config.dbType= 'AZURE_SQL'

var client = helpers.createClient('azure', 'database', config),
    testContext = {};

if (process.env.NOCK) {

  nock('https://management.database.windows.net:8443')
    .filteringRequestBody(/.*/, '*')
    .post('/azure-account-subscription-id/servers', '*')
    .reply(201, '﻿<ServerName xmlns=\"http://schemas.microsoft.com/sqlazure/2010/12/\">npm0lusisu</ServerName>')
    .get('/azure-account-subscription-id/servers')
    .reply(200, '﻿<Servers xmlns=\"http://schemas.microsoft.com/sqlazure/2010/12/\">\r\n  <Server>\r\n    <Name>npm0lusisu</Name>\r\n    <AdministratorLogin>foo</AdministratorLogin>\r\n    <Location>North Central US</Location>\r\n  </Server>\r\n</Servers>')
    .delete("/azure-account-subscription-id/servers/npm0lusisu")
    .reply(200, "", {'content-length': '0'});
}

vows.describe('pkgcloud/azure/databases').addBatch({
  "The pkgcloud azure SQL Server client": {
    "the create() method": {
      "with correct options": {
        topic: function () {
          client.create({
            dbUsername: 'testing',
            dbPassword: 'testing123!!',
            dbLocation: 'North Central US'
          }, this.callback);
        },
        "should respond correctly": function (err, database) {
          assert.isNull(err);
          assert.ok(database.id);
          assert.ok(database.uri);
          testContext.databaseId = database.id;
        }
      },
      "with invalid options like": {
        "no options": {
          topic: function () {
            client.create(this.callback);
          },
          "should respond with errors": assert.assertError
        },
        "invalid options": {
          topic: function () {
            client.create({ invalid:'keys' }, this.callback);
          },
          "should respond with errors": assert.assertError
        }
      }
    }
  }
}).addBatch({
  "The pkgcloud azure client": {
    "the list() method": {
      "with correct options": {
        topic: function () {
          client.list(this.callback);
        },
        "should respond correctly": function (err, result) {
          assert.isNull(err);
          assert.isArray(result);
          assert.ok(result.length > 0);
        }
      }
    }
  }
}).addBatch({
  "The pkgcloud azure client": {
    "the remove() method": {
      "with correct options": {
        topic: function () {
          client.remove(testContext.databaseId, this.callback);
        },
        "should respond correctly": function (err, result) {
          assert.isNull(err);
          assert.equal(result, true);
        }
      },
      "without options": {
        topic: function () {
          client.remove(this.callback);
        },
        "should respond with errors": assert.assertError
      }
    }
  }
}).export(module);
