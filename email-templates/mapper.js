var fs = require('fs');
var config = require('../lib/payswarm.config.js');

module.exports.map = function(mapping) {
  var ids = [
    'payswarm.common.Account.created',
    'payswarm.common.Deposit.charged',
    'payswarm.common.Deposit.charged-log',
    'payswarm.common.Deposit.failure',
    'payswarm.common.Deposit.success',
    'payswarm.common.Deposit.success-profile',
    'payswarm.common.Profile.created',
    'payswarm.common.Profile.created-profile',
    'payswarm.common.Profile.passcodeSent',
    'payswarm.common.Purchase.success',
    'payswarm.common.Purchase.success-profile'
  ];

  // FIXME: can't just map to filenames because swig can't use more than
  // one root directory, so the files must be loaded manually here
  ids.forEach(function(id) {
    var filename = __dirname + '/' + id + '.tpl';
    mapping[id] = {
      template: fs.readFileSync(filename).toString('utf8'),
      filename: filename
    };
  });
};
