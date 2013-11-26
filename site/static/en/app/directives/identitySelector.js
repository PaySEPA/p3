/*!
 * Identity Selector directive.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {identitySelector: deps.concat(factory)};

function factory() {
  function Link(scope, element, attrs) {
    attrs.$observe('fixed', function(value) {
      scope.fixed = value;
    });
  }

  return {
    scope: {
      identityTypes: '=',
      identities: '=',
      selected: '=',
      invalid: '=',
      fixed: '@'
    },
    templateUrl: '/app/templates/identity-selector.html',
    link: Link
  };
}

});
