/*
 * Copyright (c) 2012 Digital Bazaar, Inc. All rights reserved.
 */
var payswarm = {
  logger: require('./payswarm.logger')
};

// constants
var MODULE_TYPE = 'payswarm.paymentGateway';

// test payment gateway module API
var api = {};
api.name = MODULE_TYPE + '.Test';
module.exports = api;

/**
 * Initializes this module.
 *
 * @param callback(err) called once the operation completes.
 */
api.init = function(callback) {
  callback(null);
};

// FIXME: implement me
api.createPaymentToken = function(source, token, callback) {
};
