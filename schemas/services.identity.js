var graphSignature = require('./graphSignature');
var jsonldContext = require('./jsonldContext');
var label = require('./label');
var nonce = require('./nonce');
var publicKeyPem = require('./publicKeyPem');
var slug = require('./slug');
var url = require('./url');
var visibility = require('./propertyVisibility');

var postIdentity = {
  title: 'Post Identity',
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    label: label()
  },
  additionalProperties: false
};

var getIdentitiesQuery = {
  title: 'Get Identities Query',
  type: 'object',
  properties: {
    form: {
      required: false,
      type: 'string',
      enum: ['register']
    },
    'public-key-label': {
      required: false,
      type: label()
    },
    'public-key': {
      required: false,
      type: publicKeyPem()
    },
    'registration-callback': {
      required: false,
      type: url()
    },
    'response-nonce': {
      required: false,
      type: nonce()
    }
  },
  additionalProperties: true
};

var postIdentities = {
  title: 'Post Identities',
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    type: {
      required: true,
      type: 'string',
      enum: ['ps:PersonalIdentity', 'ps:VendorIdentity']
    },
    psaSlug: slug(),
    label: label(),
    homepage: {
      required: false,
      type: 'string'
    },
    description: {
      required: false,
      type: 'string'
    },
    psaPublic: {
      required: false,
      type: visibility()
    }
  },
  additionalProperties: false
};

var postPreferences = {
  title: 'Post Preferences',
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    destination: {
      required: true,
      type: 'string'
    },
    publicKey: {
      required: true,
      type: [{
        // IRI only
        type: 'string'
      }, {
        // label+pem
        type: 'object',
        properties: {
          label: label(),
          publicKeyPem: publicKeyPem()
        }
      }]
    }
  },
  additionalProperties: false
};

module.exports.postIdentity = function() {
  return postIdentity;
};
module.exports.getIdentitiesQuery = function() {
  return getIdentitiesQuery;
};
module.exports.postIdentities = function() {
  return postIdentities;
};
module.exports.postPreferences = function() {
  return postPreferences;
};
