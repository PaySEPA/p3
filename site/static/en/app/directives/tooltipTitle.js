/*!
 * Tooltip Title directive.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {tooltipTitle: deps.concat(factory)};

function factory() {
  return function(scope, element, attrs) {
    var show = false;
    attrs.$observe('tooltipTitle', function(value) {
      if(element.data('tooltip')) {
        element.tooltip('hide');
        element.removeData('tooltip');
      }
      element.tooltip({
        title: value
      });
      if(show) {
        element.data('tooltip').show();
      }
    });
    attrs.$observe('tooltipShow', function(value) {
      if(value !== undefined) {
        var tooltip = element.data('tooltip');
        if(value === 'true') {
          show = true;
          if(tooltip) {
            tooltip.show();
          }
        }
        else {
          show = false;
          if(tooltip) {
            tooltip.hide();
          }
        }
      }
    });
  };
}

});
