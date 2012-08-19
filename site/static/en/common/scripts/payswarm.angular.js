/*!
 * Angular Custom Directives
 *
 * @requires jQuery v1.7+ (http://jquery.com/)
 *
 * @author Dave Longley
 */
(function($) {

angular.module('payswarm', [])
.directive('spinner', function() {
  return function(scope, element, attrs) {
    // default spinner options
    var options = {
      lines: 11, // The number of lines to draw
      length: 3, // The length of each line
      width: 3, // The line thickness
      radius: 5, // The radius of the inner circle
      rotate: 0, // The rotation offset
      color: '#000', // #rgb or #rrggbb
      speed: 1.0, // Rounds per second
      trail: 100, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'inline-block', // CSS class for spinner
      top: 'auto', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    };
    if(attrs.spinnerClass) {
      options.className = scope.$eval(attrs.spinnerClass);
    }

    // create spinner
    var spinner = new Spinner(options);
    var spinning = false;

    scope.$watch(attrs.spinner, function(value) {
      if(value) {
        spinner.spin();
        spinning = true;
        element.append(spinner.el);
      }
      else {
        spinner.stop();
        spinning = false;
      }
    });

    scope.$watch(attrs.spinnerClass, function(value) {
      options.className = attrs.spinnerClass;
      spinner.stop();
      spinner = new Spinner(options);
      if(spinning) {
        spinner.spin();
        element.append(spinner.el);
      }
    });

    // stop spinning if element is destroyed
    element.bind('$destroy', function() {
      spinner.stop();
      spinning = false;
    });
  };
})
.directive('fadeout', function() {
  return function(scope, element, attrs) {
    scope.$watch(attrs.fadeout, function(value) {
      if(value) {
        element.fadeOut(function() {
          element.remove();
        });
      }
    });
  };
})
.directive('progressDividend', function() {
  return function(scope, element, attrs) {
    function updateClass(divisor, dividend) {
      var class_;
      var p = Math.round(parseFloat(divisor) / parseFloat(dividend) * 100);
      if(p < 25) {
        class_ = 'progress-danger';
      }
      else if(p < 50) {
        class_ = 'progress-warning';
      }
      else {
        class_ = 'progress-success';
      }
      element
        .removeClass('progress-danger')
        .removeClass('progress-info')
        .removeClass('progress-success')
        .addClass(class_);
    }

    scope.$watch(attrs.progressDivisor, function(value) {
      updateClass(value, scope.$eval(attrs.progressDividend));
    });
    scope.$watch(attrs.progressDividend, function(value) {
      updateClass(scope.$eval(attrs.progressDivisor), value);
    });
  };
})
.directive('barDividend', function() {
  return function(scope, element, attrs) {
    function updateBarWidth(divisor, dividend) {
      var p = Math.round(parseFloat(divisor) / parseFloat(dividend) * 100);
      element.css('width', p + '%');
    }

    scope.$watch(attrs.barDivisor, function(value) {
      updateBarWidth(value, scope.$eval(attrs.barDividend));
    });
    scope.$watch(attrs.barDividend, function(value) {
      updateBarWidth(scope.$eval(attrs.barDivisor), value);
    });
  };
})
.directive('stretchTabs', function() {
  var stretch = function(tabs, tabContent) {
    setTimeout(function() {
      tabs.css('height', tabContent.css('height'));
    });
  };

  return {
    restrict: 'C',
    controller: function($scope, $timeout) {
      $timeout(function() {
        stretch($scope.tabs, $scope.tabContent);
      });
    },
    link: function(scope, element, attrs) {
      scope.tabs = $('.nav-tabs', element);
      scope.tabContent = $('.tab-content', element);
      scope.tabs.click(function() {
        stretch(scope.tabs, scope.tabContent);
      });
    }
  };
})
.filter('cardBrand', function() {
  return function(input, logo) {
    if(input === 'ccard:Visa') {
      return logo ? 'cc-logo-visa' : 'Visa';
    }
    if(input === 'ccard:MasterCard') {
      return logo ? 'cc-logo-mastercard' : 'MasterCard';
    }
    if(input === 'ccard:Discover') {
      return logo ? 'cc-logo-discover': 'Discover';
    }
    if(input === 'ccard:AmericanExpress') {
      return logo ? 'cc-logo-amex' : 'American Express';
    }
    if(input === 'ccard:ChinaUnionPay') {
      return logo ? 'cc-logo-china-up' : 'China Union Pay';
    }
  };
});

// FIXME: add filter to properly round precise currency up

})(jQuery);
