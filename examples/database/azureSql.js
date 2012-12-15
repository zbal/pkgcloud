var pkgcloud = require('../../lib/pkgcloud');

var client = pkgcloud.database.createClient({
  provider: 'azure',
  dbType: 'AZURE_SQL',
  managementCertificate: "path to your management certificate pem file",
  subscriptionId: "azure-account-subscription-id"
});

//
// required Azure SQL Server options
var options = {
  dbUsername: 'testdb',
  dbPassword: 'Testing!!',
  dbLocation: 'North Central US'
};

//
// Create an Azure SQL Server
//
client.create(options, function (err, result) {
  //
  // Check the result
  //
  console.log(err, result);

  //
  // Now delete that same Azure SQL Server
  //
  if (err === null) {
    client.remove(result.id, function (err, result) {
      //
      // Check the result
      //
      console.log(err, result);
    });
  }
});

//
// Use the tedious Node TDS module for connecting to Azure SQL Server databases
// to create, query, insert, update, merge, and delete SQL entities.
// For more info: https://github.com/pekim/tedious
//
// or for a Windows only solution use the Microsoft Driver for Node.js for SQL Server
// https://github.com/WindowsAzure/node-sqlserver
//


