/*
 * flavor.js: Linode Cloud Package
 *
 */

var utile = require('utile'),
    base  = require('../../core/compute/flavor');

var Flavor = exports.Flavor = function Flavor(client, details) {
  base.Flavor.call(this, client, details);
};

utile.inherits(Flavor, base.Flavor);

Flavor.options = {
  'Linode 512': { ram: 512, disk: 24 },
  'Linode 1024': { ram: 1024, disk: 48 },
  'Linode 2048': { ram: 2 * 1024, disk: 96 },
  'Linode 4GB': { ram: 4 * 1024, disk: 192 },
  'Linode 8GB': { ram: 8 * 1024, disk: 384 },
  'Linode 12GB': { ram: 12 * 1024, disk: 576 },
  'Linode 16GB': { ram: 16 * 1024, disk: 768 },
  'Linode 20GB': { ram: 20 * 1024, disk: 960 }
};

Flavor.prototype._setProperties = function (details) {
  var id = details.name || 'Linode 512';

  if (!Flavor.options[id]) throw new TypeError('No such Linode Flavor: ' + id);

  this.id   = id;
  this.name = id;
  this.ram  = Flavor.options[id].ram;
  this.disk = Flavor.options[id].disk;
};
