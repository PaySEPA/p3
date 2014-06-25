/*!
 * Configs module.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author David I. Lehn
 */
define([
  'angular',
  'app/configs/settings',
  'app/configs/site',
  'bedrock/app/configs/constants',
  'bedrock/app/configs/data'
], function(angular) {

  'use strict';

  // register configs
  var module = angular.module('app.configs', []);
  var configs = Array.prototype.slice.call(arguments, 1);
  var moduleConfig = {};
  angular.forEach(configs, function(config) {
    angular.forEach(config, function(value, key) {
      moduleConfig[key] = value;
    });
  });
  module.value('config', moduleConfig);
});
