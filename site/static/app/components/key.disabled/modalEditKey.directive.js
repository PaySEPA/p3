/*!
 * Edit Key Modal.
 *
 * @author Dave Longley
 */
define(['angular', 'payswarm.api'], function(angular, payswarm) {

var deps = ['svcModal'];
return {modalEditKey: deps.concat(factory)};

function factory(svcModal) {
  function Ctrl($scope, svcKey) {
    $scope.model = {};
    $scope.data = window.data || {};
    $scope.feedback = {};
    $scope.identity = $scope.data.identity || {};
    // copy source budget for editing
    $scope.key = {};
    angular.extend($scope.key, $scope.sourceKey);

    $scope.editKey = function() {
      // set all fields from UI
      var key = {
        '@context': payswarm.CONTEXT_URL,
        id: $scope.key.id,
        label: $scope.key.label
      };

      $scope.loading = true;
      svcKey.update(key, function(err, key) {
        $scope.loading = false;
        if(!err) {
          $scope.modal.close(null, key);
        }
        $scope.feedback.error = err;
      });
    };
  }

  return svcModal.directive({
    name: 'EditKey',
    scope: {sourceKey: '=key'},
    templateUrl: '/app/templates/modals/edit-key.html',
    controller: ['$scope', 'svcKey', Ctrl],
    link: function(scope, element, attrs) {
      scope.feedbackTarget = element;
    }
  });
}

});
