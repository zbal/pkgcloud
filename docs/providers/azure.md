# Using Azure with `pkgcloud`

* [Using Compute](#using-compute)
  * [Prerequisites](#compute-prerequisites)
* [Using Storage](#using-storage)
  * [Prerequisites](#storage-prerequisites)
* [Certificates](#azure-manage-cert)
  * [Azure Management Certificates](#azure-manage-cert)
  * [Azure SSH Certificates](#azure-ssh-cert)
* [Using Databases](#using-databases)
  * [Azure Tables](#using-databases-tables)
  * [Azure SQL Server](#using-databases-sql)

<a name="using-compute"></a>
## Using Compute

``` js
  var azure = pkgcloud.compute.createClient({
    provider: 'azure',
    storageAccount: "test-storage-account",			  // Name of your storage account
    storageAccessKey: "test-storage-access-key", 	// Access key for storage account
    managementCertificate: "./test/fixtures/azure/cert/management/management.pem",
    subscriptionId: "azure-account-subscription-id",
    azure: {
      location: 'East US',	  // Azure location for server
      username: 'pkgcloud',	  // Username for server
      password: 'Pkgcloud!!',	// Password for server
      //
      // SSH settings for linux server
      //
      ssh: {					        
        port: 22,			        // default is 22
        pem: "./test/fixtures/azure/cert/ssh/mycert.pem",
        pemPassword: ""
      },
      //
      // ports setting for linux server
      //
	  "ports" : [
		{
		  "name" : "foo",			// name of port
		  "protocol" : "tcp",		// tcp or udp
		  "port" : "12333",			// external port number
		  "localPort" : "12333"		// internal port number
		}
      ],
      //
      // RDP settings for windows server
      //
      rdp: {	
        port: 3389
      }
	});
```

<a name="compute-prerequisites"></a>
### Compute Prerequisites

1. Create a [Azure Management Certificate](#AzureManageCert).
2. Upload the management .cer file to the [Management Certificates](https://manage.windowsazure.com/#Workspace/AdminTasks/ListManagementCertificates) section of the Azure portal. 
3. Specify the location of the management.pem file in the azure.managementCertificate field.
4. Create a [Storage Account](https://manage.windowsazure.com/#Workspace/StorageExtension/storage) if one does not already exist. Storage accounts and Azure VMs will need to be in the same Azure location (East US, West US, etc.).
5. Obtain the Storage Account name and access key from the [Azure Portal](https://manage.windowsazure.com/#Workspace/StorageExtension/storage). Click on 'Manage Keys' to view Storage account name and access key.
6. Specify the Storage account name and access key in the storageAccount and storageAccessKey fields.
7. Create a [Azure SSH Certificate](#azure-ssh-cert) if you will be using a Linux compute instance. Specify the path to the certificate pem file in the azure.ssh.pem field. If you used a password when creating the pem file, place the password in the azure.ssh.password field.

<br/>
<a name="using-storage"></a>
## Using Storage

``` js
  var azure = pkgcloud.storage.createClient({
    provider: 'azure',
    storageAccount: "test-storage-account",			// Name of your storage account
    storageAccessKey: "test-storage-access-key" // Access key for storage account
  });
```

<a name="storage-prerequisites"></a>
### Storage Prerequisites

1. Azure storage account must already exist. 
2. Storage account must be in same Azure location as compute servers (East US, West US, etc.). 
3. `storageAccount` and `storageAccessKey` are obtained from the [Storage](https://manage.windowsazure.com/#Workspace/StorageExtension/storage) section of the Azure Portal.

<br/>
<a name="all-azure-options"></a>
## All Azure Options

**Azure Account Settings**

* `storageAccount`: Azure storage account must already exist. Storage account must be in same Azure location as compute servers (East US, West US, etc.). storageAccount name is obtained from the Storage section of the [Azure Portal](https://manage.windowsazure.com/#Workspace/StorageExtension/storage).
* `storageAccessKey`: Azure storage account access key. storageAccessKey is obtained from the Storage section of the [Azure Portal](https://manage.windowsazure.com/#Workspace/StorageExtension/storage).
* `managementCertificate`: See [Azure Management Certificates](#azure-manage-cert).
* `subscriptionId`: The subscription ID of your Azure account obtained from the Administrators section of the [Azure Portal](https://manage.windowsazure.com/#Workspace/AdminTasks/ListUsers).

**Azure Specific Settings**

* `azure.location`: Location of storage account and Azure compute servers (East US, West US, etc.). Storage account and compute servers need to be in same location.
* `azure.username`: The administrator username used to log into the Azure virtual machine. For Windows servers, this field is ignored and administrator is used for the username.
* `azure.password`: The administrator password.
* `azure.ssh.port`: The port to use for SSH on Linux servers.
* `azure.ssh.pem`: The X509 certificate with a 2048-bit RSA keypair. Specify the path to this pem file. See [Azure x.509 SSH Certificates](#azure-ssh-cert).
* `azure.ssh.pemPassword`: The password/pass phrase used when creating the pem file. See [Azure x.509 SSH Certificates](#azure-ssh-cert).
* `azure.ports`: An array of ports to open on the vm. For each port, specify the port information using a port object with the following members.
	* `name`: the name of the port.
	* `port`:  the external/public port to use for the endpoint.
	* `localPort`: specifies the internal/private port on which the vm is listening to serve the endpoint.
	* `protocol`: specifies the transport protocol for the endpoint.

* `azure.rdp.port`: (Optional Windows servers only)The port to use for RDP on Windows servers.

<br/>
<a name="azure-manage-cert"></a>
## Azure Management Certificates

### Create an Azure Service Management certificate on Linux/Mac OSX:

Create rsa private key.
``` bash
	openssl genrsa -out management.key 2048
```
Create self signed certificate.
``` bash
	openssl req -new -key management.key -out management.csr
```
Create temp x509 pem file from rsa key and self signed certificate.
``` bash 
	openssl x509 -req -days 3650 -in management.csr -signkey management.key -out temp.pem
```
Create management pem from temp pem file and rsa key file. This will be the managementCertificate file used by the compute client in pkgcloud.
``` bash
	cat management.key temp.pem > management.pem. 
```
Create management pfx.
``` bash
	openssl pkcs12 -export -out management.pfx -in temp.pem -inkey management.key -name "My Certificate"
```
Create management cer. This will be the managementCertificate .cer file you need to upload to the [Management Certificates section](https://manage.windowsazure.com/#Workspace/AdminTasks/ListManagementCertificates) of the Azure portal. 
``` bash
    openssl x509 -inform pem -in management.pem -outform der -out management.cer
```
Secure files.
``` bash
	chmod 600 *.*
```

<br/>
### Create an Azure Service Management certificate from a .publishsettings file:

For more information about this [read the article on windowsazure.com:](https://www.windowsazure.com/en-us/manage/linux/common-tasks/manage-certificates/) https://www.windowsazure.com/en-us/manage/linux/common-tasks/manage-certificates/

<br/>
### Create an Azure Service Management certificate on Windows:

For more information about this [read the article on MSDN:](http://msdn.microsoft.com/en-us/library/windowsazure/gg551722.aspx) http://msdn.microsoft.com/en-us/library/windowsazure/gg551722.aspx.

<br/>
<a name="azure-ssh-cert"></a>
## Azure x.509 SSH Certificates

### Create an Azure x.509 SSH certificate on Linux/Mac OSX:

1. Create x.509 pem file and key file
	
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout myPrivateKey.key -out mycert.pem

2. Change the permissions on the private key and certificate for security.

	chmod 600 mycert.pem	
	chmod 600 myPrivateKey.key
	
3. Specify the path to mycert.pem in the azure.ssh.pem config property when creating an Azure pkgcloud compute client.

4. If you specified a password when creating the pem file, add the password to the azure.ssh.pemPassword config property when creating an Azure pkgcloud compute client.

5. When connecting with ssh to a running Azure compute server, specify the path to myPrivateKey.key.
 
	ssh -i  myPrivateKey.key -p <port> username@servicename.cloudapp.net

For more info: https://www.windowsazure.com/en-us/manage/linux/how-to-guides/ssh-into-linux/

<br>
<a name="using-databases"></a>
## Using Databases
<a name="using-databases-tables"></a>
### Azure Tables
Azure Tables is available in `pkgcloud` as a `pkgcloud.databases` target. Here is an example of how to use it:

``` js
  var client = pkgcloud.database.createClient({
    provider: 'azure',
    dbType: 'AZURE_TABLE',						// create Azure Table database client
    storageAccount: "test-storage-account",		// Name of your Azure storage account
    storageAccessKey: "test-storage-access-key" // Access key for storage account
  });

  //
  // Create an Azure Table
  //
  client.create({
    name: "test"
  }, function (err, result) {
    //
    // Check the result
    //
    console.log(err, result);

    //
    // Now delete that same Azure Table
    //
    client.remove(result.id, function(err, result) {
      //
      // Check the result
      //
      console.log(err, result);
    });
  });
```

The `client` instance returned by `pkgcloud.database.createClient` has the following methods for Azure Tables:

###client.create(options, callback)
Create a new Azure Table
#####options
* name: name of the table.

###client.remove(options, callback)
Delete an Azure Table
#####options
* id: id of the table.

###client.list(callback)
Lists all of the Tables in your Azure Storage account.
#####callback
returns an array of Azure Tables.

Use the azure-sdk-for-node to create, query, insert, update, merge, and delete Table entities. For more info: https://github.com/WindowsAzure/azure-sdk-for-node

<br>
<a name="using-databases-sql"></a>
### Azure SQL Server
Azure SQL Server is available in `pkgcloud` as a `pkgcloud.databases` target. Using the pkgcloud database API you will be able to create, list and delete Azure SQL Servers. You will also be able to create, list and delete firewall rules to enable access to the SQL server from specific IP addresses. Here is an example of how to use it:

``` js
//
// create an Azure SQL server pkgcloud client
//
var client = pkgcloud.database.createClient({
  provider: 'azure',
  dbType: 'AZURE_SQL',
  cert: "path to your management certificate pem file",
  subscriptionId: "azure-account-subscription-id"
});

//
// required Azure SQL Server options
var options = {
  dbUsername: 'testdb',		//admin username for the SQL Server
  dbPassword: 'Testing!!',	// admin password for the SQL Server
  dbLocation: 'North Central US' // Azure location for the server
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
```

The `client` instance returned by `pkgcloud.database.createClient` has the following methods for Azure Tables:

####client.create(options, callback)
Create a new Azure SQL Server
#####options
* dbUsername: Admin username for the SQL Server.
* dbPassword: Admin password for the SQL Server.
* dbLocation: Azure location for the server Valid Locations for Azure SQL Servers are: North Central US | South Central US | North Europe | West Europe | East Asia | Southeast Asia


####client.remove(options, callback)
Deletes an Azure SQL server **Note: all databases on the SQL server will be deleted
**

#####options
* id: the id of the SQL Server to remove. **Note: all databases on the SQL server will be deleted
**


####client.list(callback)	
lists all of the SQL Servers in your Azure account

###SQL Server Firewall Rules
The pkgcloud Azure SQL Server database client also supports the creation of firewall rules that allow access to the SQL server from specified IP addresses. See <a href = "http://msdn.microsoft.com/en-us/library/windowsazure/gg715276.aspx">Azure SQL Server Firewall Rules</a> for more information. pkgcloud implements the following methods:

####client.createServerFirewallRuleWithIPDetect(options, callback) 
Creates an Azure SQL Server firewall rule using IP autodetect.
The createServerFirewallRuleWithIPDetect method adds a new server-level firewall rule or updates an existing server-level firewall rule for a SQL Database server with requester’s IP address. This is useful when a user does not know his/her external IP address due to address translation, proxy servers, etc.

#####options

* id: id of the SQL server (required)
* ruleName: name to assign to the new firewall rule.

#####callback
* err: null if no error, otherwise Error object
* result: result object containing the following properties:
	* ipAddress: the IP address detected by IP autodetect.
	* ruleName: name assigned to the new firewall rule.
	* statusCode: resultCode of request. Should be 200.

####client.createServerFirewallRule(options, callback) 
Creates an Azure SQL Server firewall rule. The createServerFirewallRule method updates an existing server-level firewall rule or adds a new server-level firewall rule for a SQL Database server that belongs to a subscription. A firewall rule with the start and end IP addresses set to 0.0.0.0 is a rule that allows connections to the server from Windows Azure related applications and services.

#####options

* id: id of the SQL server (required)
* ruleName: name to assign to the new firewall rule.
* startIpAddress: starting IP address for the new firewall rule.
* endIpAddress: ending IP address for the new firewall rule.

#####callback
* err: null if no error, otherwise Error object
* result: result object containing the following properties:
	* statusCode: resultCode of request. Should be 200.

####client.listServerFirewallRules(options, callback) 
The listServerFirewallRules method retrieves a list of all the server-level firewall rules for a SQL Database server that belongs to a subscription.

#####options

* id: id of the SQL server (required)

#####callback
* err: null if no error, otherwise Error object
* result: contains an array of firewall rules. Each object in the array contains a firewall rule object with the following properties:
	* ruleName: name of the firewall rule
	* serverId: id of the SQL server
	* startIpAddress: the starting IP address of the rule
	* endIpAddress: the ending IP address of the rule

####client.deleteFirewallRule(options, callback) 
Delete an Azure SQL Server firewall rule from a SQL Server. The deleteFirewallRule method deletes a server-level firewall rule from a SQL Database server that belongs to a subscription.

#####options
* id: id of the SQL server 
* ruleName: name of the firewall rule to delete from the server

#####callback
* err: null if no error, otherwise Error object
* result: result object containing the following properties:
	* statusCode: resultCode of request. Should be 200.

<br>
Use the <a href="https://github.com/pekim/tedious">Node TDS module</a>
for connecting to SQL Server databases. The Tedious node module will allow you to create, list and delete databases and tables and also create, query, insert, update, merge, and delete entities. For a Windows only solution use the <a href="https://github.com/WindowsAzure/node-sqlserver">Windows Azure node-sqlserver</a> module. 