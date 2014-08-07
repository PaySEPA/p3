/*!
 * Payment Token List Selector.
 *
 * @author Digital Bazaar
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    restrict: 'A',
    scope: {
      instant: '=',
      omit: '='
    },
    require: '^stackable',
    templateUrl:
      '/app/components/payment-token/payment-token-list-selector.html',
    link: Link
  };

  function Link(scope) {
    var model = scope.model = {};
    model.loading = false;
    // payment backup source selected
    model.backupSource = null;

    scope.confirm = function() {
      scope.modal.close(null, model.backupSource);
    };
  }
}

return {paymentTokenListSelectorModal: factory};

});
