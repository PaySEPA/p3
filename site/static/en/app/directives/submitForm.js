/*!
 * Submit Form directive.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {submitForm: deps.concat(factory)};

function factory() {
  return function(scope, element, attrs) {
    // manually prevent form default action
    element.closest('form').bind('submit', function(e) {
      e.preventDefault();
    });

    // submit form on button click or enter press
    element.bind('click', function(e) {
      e.preventDefault();
      element.closest('form').submit();
    });
    $(':input', element.closest('form')).bind('keypress', function(e) {
      if(e.which === 13) {
        e.preventDefault();
        element.closest('form').submit();
      }
    });
  };
}

});
