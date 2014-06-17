/*
 * Copyright (c) 2013-2014 Digital Bazaar, Inc. All rights reserved.
 */
var constants = require('./constants');
var jsonld = require('jsonld')(); // use localized jsonld API
// known hard coded domain specific constants
require('../configs/meritora-constants');

// require https for @contexts
var nodeDocumentLoader = jsonld.documentLoaders.node({secure: true});
jsonld.documentLoader = function(url, callback) {
  if(url in constants.CONTEXTS) {
    return callback(
      null, {
        contextUrl: null,
        document: {'@context': constants.CONTEXTS[url]},
        documentUrl: url
      });
  }
  nodeDocumentLoader(url, callback);
};

module.exports = jsonld;
