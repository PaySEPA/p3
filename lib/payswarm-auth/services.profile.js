/*
 * Copyright (c) 2012-2013 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var payswarm = {
  config: require('../config'),
  db: require('./database'),
  events: require('./events'),
  financial: require('./financial'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  permission: require('./permission'),
  profile: require('./profile'),
  promo: require('./promo'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var url = require('url');
var util = require('util');
var PaySwarmError = payswarm.tools.PaySwarmError;
var ensureAuthenticated = payswarm.website.ensureAuthenticated;
var getDefaultViewVars = payswarm.website.getDefaultViewVars;
var validate = payswarm.validation.validate;

// constants
var MODULE_TYPE = payswarm.website.type;
var MODULE_IRI = payswarm.website.iri;

// sub module API
var api = {};
module.exports = api;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  async.waterfall([
    function(callback) {
      addServices(app, callback);
    }
  ], callback);
};

/**
 * Adds web services to the server.
 *
 * @param app the payswarm-auth application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.get('/profile/create', function(req, res, next) {
    getDefaultViewVars(req, function(err, vars) {
      if(err) {
        return next(err);
      }
      vars.redirect = false;
      res.render('create.tpl', vars);
    });
  });

  app.server.post('/profile/create',
    validate('services.profile.postCreate'),
    function(req, res, next) {
      async.waterfall([
        function(callback) {
          api._createProfile({}, req, callback);
        },
        function(results, callback) {
          req.body.profile = results.profile.psaSlug;
          req.body.password = req.body.psaPassword;
          _login(req, res, next, function(err) {
            if(err) {
              return next(new PaySwarmError(
                'Could not create session for newly created profile.',
                MODULE_TYPE + '.AutoLoginFailed', {}, err));
            }
            res.json({ref: results.identity.id + '/dashboard'});
          });
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
      });
    });

  app.server.get('/profile/login',
    validate({query: 'services.profile.getLoginQuery'}),
    function(req, res, next) {
    // redirect authenticated requests to the referral URL
    if(req.isAuthenticated()) {
      var ref = req.query.ref || '/';
      return res.redirect(ref);
    }

    // not authenticated, send login page
    getDefaultViewVars(req, function(err, vars) {
      if(err) {
        return next(err);
      }
      // include referring URL unless it is to the same page
      if(req.query.ref && req.query.ref !== '/profile/login') {
        vars.ref = req.query.ref;
        vars.clientData.ref = req.query.ref;
      }
      // include session expired var if appropriate
      if(req.query.expired === 'true') {
        vars.clientData.sessionExpired = true;
      }
      res.render('login.tpl', vars);
    });
  });

  app.server.post('/profile/login',
    validate('services.profile.postLogin'),
    function(req, res, next) {
      _login(req, res, next, function(err, user, choice) {
        if(err) {
          return next(err);
        }
        var out = {};
        // multiple profiles matched credentials
        if(!user) {
          out.email = choice.email;
          out.profiles = choice.profiles;
        }
        else if(req.body.ref) {
          out.ref = req.body.ref;
        }
        else if(user.identity) {
          out.ref = user.identity.id + '/dashboard';
        }
        else {
          out.ref = '/';
        }
        // FIXME: add method to do:
        // if(req.accepts('application/ld+json')) {
        //   res.type('application/ld+json');
        // }
        // FIXME: and then use res.send() instead of res.json()?
        res.json(out);
      });
  });

  app.server.get('/profile/logout', function(req, res, next) {
    if(req.session) {
      return req.session.destroy(function(err) {
        if(err) {
          next(err);
        }
        res.redirect('/');
      });
    }
    res.redirect('/');
  });

  app.server.post('/profile/switch',
    ensureAuthenticated,
    validate('services.profile.switchIdentity'),
    function(req, res, next) {
      // ensure profile can access identity
      payswarm.identity.getIdentity(
        req.user.profile, req.body.identity, function(err, identity) {
          // ignore exception, just do redirect without changing cookies
          if(!err) {
            // Note: Code does not check owner of identity in order to allow
            // privileged profiles to switch to non-owned identities.
            req.session.passport.user.identity = identity.id;
          }
          // do redirect
          res.redirect(303, req.body.redirect);
        });
  });

  app.server.post('/profile/password/reset',
    validate('services.profile.postPasswordReset'),
    function(req, res, next) {
      // either a profile slug or email address
      var identifier = req.body.psaIdentifier;
      async.waterfall([
        function(callback) {
          payswarm.profile.resolveProfileIdentifier(identifier, callback);
        },
        function(profileIds, callback) {
          // try to set password for all profiles until one is successful
          var success = 0;
          async.until(function() {return success !== 0;}, function(callback) {
            if(profileIds.length === 0) {
              success = -1;
              return callback();
            }
            var next = profileIds.shift();
            var profile = payswarm.tools.clone(req.body);
            profile.id = next;
            payswarm.profile.setProfilePassword(
              {id: next}, profile, function(err) {
                if(!err) {
                  success = 1;
                }
                callback();
              });
          }, function(err) {
            callback(null, success === 1);
          });
        },
        function(success, callback) {
          if(!success) {
            return callback(new PaySwarmError(
              'The password reset failed for the given profile.',
              MODULE_TYPE + '.PasswordResetFailed', {
                psaIdentifier: req.body.psaIdentifier,
                httpStatusCode: 403,
                'public': true}));
          }
          callback();
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });

  app.server.post('/profile/email/verify',
    validate('services.profile.postEmailVerify'),
    function(req, res, next) {
      // either a profile slug or email address
      var identifier = req.body.psaIdentifier;
      async.waterfall([
        function(callback) {
          payswarm.profile.resolveProfileIdentifier(identifier, callback);
        },
        function(profileIds, callback) {
          // try to verify email for all profiles until one is successful
          var success = 0;
          async.until(function() {return success !== 0;}, function(callback) {
            if(profileIds.length === 0) {
              success = -1;
              return callback();
            }
            var next = profileIds.shift();
            var profile = payswarm.tools.clone(req.body);
            profile.id = next;
            payswarm.profile.verifyProfileEmail(
              {id: next}, profile, function(err, verified) {
                if(!err && verified) {
                  success = 1;
                }
                callback();
              });
          }, function(err) {
            callback(null, success === 1);
          });
        },
        function(success, callback) {
          if(!success) {
            return callback(new PaySwarmError(
              'The email verification failed for the given profile.',
              MODULE_TYPE + '.EmailVerificationFailed', {
                psaIdentifier: req.body.psaIdentifier,
                httpStatusCode: 403,
                'public': true}));
          }
          callback();
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });

  app.server.get('/profile/passcode',
    validate({query: 'services.profile.getPasscodeQuery'}),
    function(req, res, next) {
    getDefaultViewVars(req, function(err, vars) {
      if(err) {
        return next(err);
      }
      vars.redirect = false;
      if('passcode' in req.query) {
        vars.clientData.psaPasscode = req.query.passcode;
      }
      res.render('passcode.tpl', vars);
    });
  });

  app.server.post('/profile/passcode',
    validate('services.profile.postPasscode'),
    function(req, res, next) {
      var identifier = req.body.psaIdentifier;
      async.waterfall([
        function(callback) {
          payswarm.profile.resolveProfileIdentifier(identifier, callback);
        },
        function(profileIds, callback) {
          // profile not found
          if(profileIds.length === 0) {
            return callback(new PaySwarmError(
              'The given email address is not registered.',
              MODULE_TYPE + '.ProfileNotFound', {
                psaIdentifier: req.body.psaIdentifier,
                httpStatusCode: 404,
                'public': true
              }));
          }
          // look up profiles
          var query = {id: {$in: []}};
          profileIds.forEach(function(profileId) {
            query.id.$in.push(payswarm.db.hash(profileId));
          });
          payswarm.profile.getProfiles(
            null, query, {profile: true}, function(err, records) {
              if(err) {
                return callback(err);
              }
              // send passcode for every profile match
              var profiles = [];
              records.forEach(function(record) {
                profiles.push(record.profile);
              });
              // determine passcode usage based on query param
              var usage = 'reset';
              if(req.query.usage === 'verify') {
                usage = 'verify';
              }
              else if(req.query.usage === 'reset') {
                usage = 'reset';
              }
              payswarm.profile.sendProfilePasscodes(
                profiles, usage, callback);
            });
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });

  callback(null);
}

/**
 * Profile creation service. Used by normal and testing services.
 */
api._createProfile = function(options, req, callback) {
  var profileId = payswarm.profile.createProfileId(req.body.psaSlug);
  var profileCreated = false;
  var identityId = null;
  var identityCreated = false;
  var accountId = null;

  async.auto({
    createProfile: function(callback) {
      // create profile
      var profile = {
        id: profileId,
        psaSlug: req.body.psaSlug,
        email: req.body.email,
        label: req.body.label,
        psaPassword: req.body.psaPassword
      };
      // generate gravatar url
      if('email' in profile) {
        // FIXME: use config for this
        var md = crypto.createHash('md5');
        md.update(profile.email.toLowerCase(), 'utf8');
        profile.depiction = util.format(
          'https://secure.gravatar.com/avatar/%s', md.digest('hex'));
      }
      payswarm.profile.createProfile(null, profile, function(err, record) {
        // if profile is a duplicate, allow create to continue if the
        // password matches and the profile has no identities
        if(payswarm.db.isDuplicateError(err)) {
          var duplicateError = err;
          return async.auto({
            checkPassword: function(callback) {
              var pwProfile = {
                id: profile.id,
                psaPassword: req.body.psaPassword
              };
              payswarm.profile.verifyProfilePassword(pwProfile, callback);
            },
            checkIdentities: function(callback) {
              payswarm.identity.getProfileIdentities(
                null, profile.id, function(err, records) {
                  if(err) {
                    return callback(err);
                  }
                  callback(null, records.length === 0);
                });
            }
          }, function(err, results) {
            if(err) {
              return callback(err);
            }
            if(results.checkPassword && results.checkIdentities) {
              return payswarm.profile.getProfile(
                null, profileId, function(err, profile) {
                  callback(err, profile);
                });
            }
            callback(duplicateError);
          });
        }
        if(err) {
          return callback(err);
        }
        profileCreated = true;
        callback(null, record.profile);
      });
    },
    createIdentity: ['createProfile', function(callback, results) {
      profileId = results.createProfile.id;
      // create identity
      var identityId = payswarm.identity.createIdentityId(
        req.body.psaIdentity.psaSlug);
      var identity = {
        id: identityId,
        owner: profileId,
        psaSlug: req.body.psaIdentity.psaSlug,
        label: req.body.psaIdentity.label
      };
      // FIXME: should profile be used here as the actor?
      payswarm.identity.createIdentity(
        null, identity, function(err, record) {
          // ignore duplicate identity if owned by the profile
          if(payswarm.db.isDuplicateError(err)) {
            var duplicateError = err;
            return payswarm.identity.getIdentity(
              null, identityId, function(err, identity_) {
                if(err) {
                  return callback(err);
                }
                if(identity.owner !== profileId) {
                  return callback(duplicateError);
                }
                identity = identity_;
                callback(null, identity);
              });
          }
          else if(err) {
            return callback(err);
          }
          identityCreated = true;
          callback(null, record.identity);
        });
    }],
    createAccount: ['createIdentity', function(callback, results) {
      identityId = results.createIdentity.id;
      accountId = payswarm.financial.createAccountId(
        identityId, req.body.account.psaSlug);
      var account = {
        '@context': payswarm.tools.CONTEXT_URL,
        id: accountId,
        owner: identityId,
        psaSlug: req.body.account.psaSlug,
        label: req.body.account.label
      };
      // FIXME: should profile be used here as the actor?
      payswarm.financial.createAccount(
        null, account, options.account || {}, function(err, record) {
          if(err) {
            return callback(err);
          }
          callback(null, record.account);
        });
    }]
  }, function(err, results) {
    if(err) {
      if(payswarm.db.isDuplicateError(err)) {
        if(!profileCreated) {
          err = new PaySwarmError(
            'Could not create profile, it is a duplicate.',
            MODULE_TYPE + '.DuplicateProfile', {
              profile: profileId, 'public': true});
        }
        else if(!identityCreated) {
          err = new PaySwarmError(
            'Could not create identity, it is a duplicate.',
            MODULE_TYPE + '.DuplicateIdentity', {
              identity: identityId, 'public': true});
        }
        else {
          err = new PaySwarmError(
            'Could not create financial account, it is a duplicate.',
            MODULE_TYPE + '.DuplicateFinancialAccount', {
              account: accountId, 'public': true});
        }
      }
      return callback(err);
    }
    // result details
    var details = {
      profile: results.createProfile,
      identity: results.createIdentity,
      account: results.createAccount
    };
    // schedule profile created event
    payswarm.events.emit({
      type: 'common.Profile.created',
      details: details
    });
    callback(null, details);
  });
};

// perform login
function _login(req, res, next, callback) {
  passport.authenticate('payswarm.password', function(err, user, info) {
    if(!user) {
      // multiple profile matches
      if(info.matches) {
        // get mapping of profile ID to default identity
        var choice = {
          email: info.email,
          profiles: {}
        };
        return async.forEach(info.matches, function(profileId, callback) {
          payswarm.identity.getProfileDefaultIdentity(
            null, profileId, function(err, identity) {
              if(err) {
                return callback(err);
              }
              choice.profiles[profileId] = identity;
              callback();
            });
        }, function(err) {
          if(err) {
            return next(err);
          }
          callback(null, false, choice);
        });
      }
      // some other error
      err = new PaySwarmError(
        'The email address and password combination ' +
        'you entered is incorrect.', MODULE_TYPE + '.InvalidLogin',
        {'public': true, httpStatusCode: 400});
    }
    if(err) {
      return next(err);
    }
    req.logIn(user, function(err) {
      callback(err, user);
    });
  })(req, res, next);
}
