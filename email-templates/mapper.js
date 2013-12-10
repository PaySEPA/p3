var fs = require('fs');
var config = require(__libdir + '/config');

module.exports.map = function(mapping) {
  var ids = [
    'common.FinancialAccount.created',
    'common.FinancialAccount.unbackedCreditPayoffFailed',
    'common.FinancialAccount.unbackedCreditPayoffFailed-profile',
    'common.Deposit.ach-merchant-account-log',
    'common.Deposit.cc-merchant-account-log',
    'common.Deposit.failure',
    'common.Deposit.success',
    'common.Deposit.success-profile',
    'common.PaymentToken.bankAccountCreated',
    'common.PaymentToken.bankAccountCreated-profile',
    'common.PaymentToken.unverified',
    'common.PaymentToken.unverified-profile',
    'common.PaymentToken.unverifiedLimitReached',
    'common.PaymentToken.verified-profile',
    'common.PaymentToken.verifyBalanceTooLow',
    'common.PaymentToken.verifyFailed',
    'common.Profile.created',
    'common.Profile.created-profile',
    'common.Profile.passcodeSent',
    'common.Purchase.success',
    'common.Purchase.success-profile',
    'common.Transaction.externalTransactionVoided',
    'common.Transaction.statusCheckError',
    'common.Transaction.statusChecksExceeded',
    'common.Withdrawal.ach-merchant-account-log',
    'common.Withdrawal.failure',
    'common.Withdrawal.success',
    'common.Withdrawal.success-profile',
    'hosted.Listing.assetExpired-profile'
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
