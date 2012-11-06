var url = require('./url');
var email = require('./email');
var slug = require('./slug');
var passcode = require('./passcode');
var password = require('./password');
var label = require('./label');
var payswarmId = require('./payswarmId');
var jsonldContext = require('./jsonldContext');
var visibility = require('./propertyVisibility');

var getPasscodeQuery = {
  type: 'object',
  properties: {
    passcode: {
      required: false,
      type: 'string',
      minLength: 1
    }
  },
  additionalProperties: true
};


var postPasscode = {
  title: 'Passcode',
  description: 'Create a passcode.',
  type: 'object',
  properties: {
    psaIdentifier: {
      required: true,
      type: [slug(), email()]
    }
  },
  additionalProperties: false
};

var postPassword = {
  title: 'Password',
  description: 'Create a password.',
  type: 'object',
  properties: {
    id: payswarmId(),
    psaPassword: password(),
    psaPasswordNew: password()
  },
  additionalProperties: false
};

var postPasswordReset = {
  title: 'Reset password',
  description: 'Reset a password.',
  type: 'object',
  properties: {
    psaIdentifier: {
      required: true,
      type: [slug(), email()]
    },
    psaPasscode: passcode(),
    psaPasswordNew: password()
  },
  additionalProperties: false
};

var postCreate = {
  title: 'Create profile',
  description: 'Create a profile.',
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    psaSlug: slug({required: false}),
    email: email(),
    psaPassword: password(),
    label: label({required: false}),
    psaIdentity: {
      required: true,
      type: 'object',
      properties: {
        type: {
          required: true,
          type: 'string',
          enum: ['ps:PersonalIdentity', 'ps:VendorIdentity']
        },
        psaSlug: slug(),
        label: label(),
        psaPublic: {
          required: false,
          type: visibility()
        }
      }
    },
    account: {
      required: true,
      type: 'object',
      properties: {
        psaSlug: slug(),
        label: label(),
        psaPublic: {
          required: false,
          type: visibility()
        }
      }
    }
  },
  additionalProperties: false
};

var getLoginQuery = {
  type: 'object',
  properties: {
    ref: {
      required: false,
      type: 'string'
    }
  },
  additionalProperties: true
};

var postLogin = {
  title: 'Login',
  description: 'Login.',
  type: 'object',
  properties: {
    profile: {
      required: true,
      type: [slug(), email(), payswarmId()]
    },
    password: password(),
    ref: url({required: false})
  },
  additionalProperties: false
};

var postProfile = {
  title: 'Update profile',
  description: 'Update profile.',
  type: 'object',
  properties: {
    label: label({required: false}),
    email: email({required: false})
  },
  additionalProperties: false
};

var switchIdentity = {
  title: 'Switch identity',
  description: 'Switch identity.',
  type: 'object',
  properties: {
    identity: payswarmId(),
    redirect: url()
  },
  additionalProperties: false
};

module.exports.getPasscodeQuery = function() {
  return getPasscodeQuery;
};
module.exports.postPasscode = function() {
  return postPasscode;
};
module.exports.postPassword = function() {
  return postPassword;
};
module.exports.postPasswordReset = function() {
  return postPasswordReset;
};
module.exports.postCreate = function() {
  return postCreate;
};
module.exports.getLoginQuery = function() {
  return getLoginQuery;
};
module.exports.postLogin = function() {
  return postLogin;
};
module.exports.postProfile = function() {
  return postProfile;
};
module.exports.switchIdentity = function() {
  return switchIdentity;
};
