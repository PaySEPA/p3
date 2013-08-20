/*!
 * Fade Toggle directive.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = ['$parse'];
return {fadeToggle: deps.concat(factory)};

function factory($parse) {
  return {
    link: function(scope, element, attrs) {
      // init to hidden
      element.addClass('hide');
      scope.$watch(attrs.fadeToggle, function(value) {
        if(value) {
          if(element.is(':animated')) {
            element.stop(true, true).show();
          }
          else {
            element.fadeIn();
          }
        }
        else {
          if(element.is(':animated')) {
            element.stop(true, true).hide();
          }
          else {
            element.fadeOut();
          }
        }
      });
    }
  };
}

});
