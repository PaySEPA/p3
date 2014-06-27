/*!
 * Add Credit Line Modal.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [
  'AccountService', 'AlertService', 'IdentityService', 'ModalService'];
return {addCreditLineModal: deps.concat(factory)};

function factory(AccountService, AlertService, IdentityService, ModalService) {
  return ModalService.directive({
    name: 'addCreditLine',
    scope: {account: '='},
    templateUrl: '/app/components/account/add-credit-line-modal.html',
    link: Link
  });

  function Link(scope) {
    var model = scope.model = {};
    model.identity = IdentityService.identity;
    model.sysPasscode = '';
    // payment backup source for account's credit line
    model.backupSource = null;
    // state in ('reviewing' and 'complete')
    model.state = 'reviewing';
    model.loading = false;

    scope.sendPasscode = function() {
      // request a passcode
      model.loading = true;
      AlertService.clearModalFeedback(scope);
      IdentityService.sendPasscode({
        sysIdentifier: model.identity.id,
        usage: 'verify'
      }).then(function() {
        AlertService.add('success', {
          message:
            'An email has been sent to you with verification instructions.'
        });
      }).catch(function(err) {
        AlertService.add('error', err);
      }).then(function() {
        model.loading = false;
        scope.$apply();
      });
    };

    scope.verifyEmail = function() {
      model.loading = true;
      AlertService.clearModalFeedback(scope);
      IdentityService.verifyEmail({
        sysIdentifier: model.identity.id,
        sysPasscode: model.sysPasscode
      }).then(function() {
        model.identity.sysEmailVerified = true;
        AlertService.add('success', {
          message: 'Your email address has been verified successfully.'
        });
      }).catch(function(err) {
        AlertService.add('error', err);
      }).then(function() {
        model.loading = false;
        scope.$apply();
      });
    };

    scope.confirm = function() {
      model.loading = true;
      AlertService.clearModalFeedback(scope);
      AccountService.addCreditLine(
        scope.account.id, model.backupSource.id).then(function() {
        // show complete page
        model.state = 'complete';
      }).catch(function(err) {
        AlertService.add('error', err);
      }).then(function() {
        model.loading = false;
        scope.$apply();
      });
    };
  }
}

});
