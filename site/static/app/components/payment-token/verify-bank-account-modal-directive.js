/*!
 * Kredit font directive.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory(AccountService, AlertService, PaymentTokenService, config) {
  return {
    scope: {paymentToken: '='},
    require: '^stackable',
    templateUrl: '/app/components/payment-token/verify-bank-account-modal.html',
    link: Link
  };

  function Link(scope) {
    // FIXME: use 'model'
    var model = scope.model = {};
    scope.selection = {
      destination: null
    };
    scope.loading = false;
    scope.depositTransfer = null;
    scope.depositDestination = null;
    scope.sysVerifyParameters = {
      amount: [
        null,
        null
      ]
    };
    scope.input = {
      // payment token source
      source: scope.paymentToken,
      amount: ''
    };

    // state in ('preparing', 'reviewing', 'complete')
    scope.state = 'preparing';

    scope.prepare = function() {
      scope.state = 'preparing';
    };

    scope.review = function() {
      var verifyRequest = {
        '@context': config.data.contextUrl,
        sysVerifyParameters: {
          amount: [
            scope.sysVerifyParameters.amount[0],
            scope.sysVerifyParameters.amount[1]
          ]
        }
      };
      if(scope.selection.destination && scope.input.amount &&
        parseFloat(scope.input.amount) !== 0) {
        verifyRequest.destination = scope.selection.destination.id;
        verifyRequest.amount = scope.input.amount;
      }
      scope.loading = true;
      AlertService.clearFeedback(scope);
      PaymentTokenService.verify(scope.paymentToken.id, verifyRequest)
        .then(function(deposit) {
        // copy to avoid angular keys in POSTed data
        scope._deposit = angular.copy(deposit);
        scope.deposit = deposit;

        angular.forEach(deposit.transfer, function(xfer) {
          if(scope.selection.destination &&
            scope.selection.destination.id === xfer.destination) {
            scope.depositTransfer = xfer;
            scope.depositDestination = scope.selection.destination.id;
          }
        });
        // FIXME: duplicated from deposit code
        // get public account information for all payees
        scope.accounts = {};
        var promises = [];
        angular.forEach(deposit.transfer, function(xfer) {
          var dst = xfer.destination;
          if(dst in scope.accounts) {
            return;
          }
          var info = scope.accounts[dst] = {loading: true, label: ''};
          promises.push(AccountService.collection.get(dst).then(
            function(account) {
            info.label = account.label;
          }).catch(function(err) {
            info.label = 'Private Account';
          }).then(function() {
            info.loading = false;
            scope.$apply();
          }));
        });
        return Promise.all(promises).catch(function(err) {
          AlertService.add('error', err);
          scope.$apply();
          throw err;
        }).then(function() {
          // go to top of page?
          // FIXME: use directive to do this
          //var target = options.target;
          //$(target).animate({scrollTop: 0}, 0);

          // copy to avoid angular keys in POSTed data
          scope.loading = false;
          scope.state = 'reviewing';
          scope.$apply();
        });
      }).catch(function(err) {
        // FIXME: namespace should be payswarm.website
        //if(err.type === 'payswarm.website.VerifyPaymentTokenFailed' &&
        if(err.type === 'bedrock.website.VerifyPaymentTokenFailed' &&
          err.cause &&
          err.cause.type === 'payswarm.financial.VerificationFailed') {
          AlertService.add('error', {
            message: 'The verification amounts you entered do not match ' +
              'what is on record for your bank account.'
          });
          // FIXME: ugly
          // synthesize validation error for UI
          err = {
            "message": "",
            "type": "bedrock.validation.ValidationError",
            "details": {
              "errors": [
                {
                  "name": "bedrock.validation.ValidationError",
                  "message": "verification amount is incorrect",
                  "details": {
                    "path": "sysVerifyParameters.amount[0]",
                    "public": true
                  },
                  "cause": null
                },
                {
                  "name": "bedrock.validation.ValidationError",
                  "message": "verification amount is incorrect",
                  "details": {
                    "path": "sysVerifyParameters.amount[1]",
                    "public": true
                  },
                  "cause": null
                }
              ]
            },
            "cause": null
          };
        // FIXME: namespace should be payswarm.website
        //} else if(err.type === 'payswarm.website.VerifyPaymentTokenFailed' &&
        } else if(err.type === 'bedrock.website.VerifyPaymentTokenFailed' &&
          err.cause &&
          err.cause.type === 'payswarm.financial.MaxVerifyAttemptsExceeded') {
          // FIXME: add special call to AlertService for this?
          AlertService.add('error', {
            message: 'Please contact customer support.'
          });
        }
        AlertService.add('error', err);
        scope.loading = false;
        scope.$apply();
      });
    };

    scope.confirm = function() {
      scope.loading = true;
      PaymentTokenService.verify(scope.paymentToken.id, scope._deposit)
        .then(function(deposit) {
          // show complete page
          scope.deposit = deposit;
          scope.state = 'complete';

          // get updated balance after a delay
          if(scope.selection.destination) {
            AccountService.collection.get(
              scope.selection.destination.id, {delay: 500});
          }

          // get updated token
          return PaymentTokenService.collection.get(scope.paymentToken.id);
        }).catch(function(err) {
          AlertService.add('error', err);
        }).then(function() {
          // go to top of page?
          //var target = options.target;
          //$(target).animate({scrollTop: 0}, 0);

          scope.loading = false;
          scope.$apply();
        });
    };
  }
}

return {verifyBankAccountModal: factory};

});
