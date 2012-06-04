/*
 * Copyright (c) 2012 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var jsonld = require('./jsonld');
var payswarm = {
  logger: require('./payswarm.logger'),
  security: require('./payswarm.security'),
  tools: require('./payswarm.tools')
};
var PaySwarmError = payswarm.tools.PaySwarmError;

// constants
var MODULE_TYPE = 'payswarm.paymentGateway';

// test payment gateway module API
var api = {};
api.name = MODULE_TYPE + '.Test';
api.gatewayName = 'Test';
module.exports = api;

/**
 * This TestGateway is used as a mock credit card gateway. Specific responses
 * can be generated by using the input data below.
 *
 * If you would like to make a successful deposit using this Test Gateway,
 * use the following information:
 *
 * ZIP: 11111
 * Card Type: Visa
 * Card Number: 4111111111111111
 * Month: Any
 * Year: Any
 * CVM: 999
 * Amount: Anything >= $1
 *
 * Note: Care must be taken not to use this gateway in a live environment!
 *
 * Valid credit card numbers follow. All others are invalid.
 *
 * Visa       4111111111111111
 * MasterCard 5499740000000057
 * Discover   6011000991001201
 * Amex       371449635392376
 * Diners     38555565010005
 * Diners/MC  36050000000003
 * JCB        3530142019955809
 *
 * Standard Credit Card Transactions
 * Amount   Response
 * $0.00    13 Invalid Amount
 * 0.69     51 Insufficient funds
 * 0.95     5  Do not honor
 *
 * $10.00   00 Approval
 * $32.49   00 Approval (with approval code of 'A')
 *
 * Card Verification Value Test Responses
 * CVV2 Response
 * 999 (Visa)  M
 * 998 (MasterCard)  M
 * 996 (Discover) M
 * 996 (Diners)   M
 * 000 (Any) N
 * 899 (Visa)  U
 * 898 (MasterCard)  U
 * 896 (Discover)  U
 * 799 (Visa) P
 * 798 (MasterCard) P
 * 796 (Discover) P
 * 699 (Visa) S
 * 698 (MasterCard) S
 * 696 (Discover) S
 *
 * Address Verification Service Responses
 * Only Zip Code field used, other address fields ignored.
 *
 * Zip Code Response Code  Response Text
 * 8320  A  Address Match
 * 85284 Z  Zip Match
 * 8320<space> 85284 Y  Exact Match
 * 99999 U  Ver Unavailable
 * 99998 G  Ver Unavailable
 * 999970001   B  Address Match
 * 999970002   C  Serv Unavailable
 * 999970003   D  Exact Match
 * 999970004   I  Ver Unavailable
 * 999970005   M  Exact Match
 * 999970006   P  Zip Match
 * 999970007   A  Address Match
 * 999970008   Y  Exact Match
 * 999970009   S  Service Not Supported
 * 999970010   R  Issuer System Unavailable
 *
 * @author David I. Lehn <dlehn@digitalbazaar.com>
 * @author Dave Longley
 */
var testData = {
  validCards: {
    'ccard:Visa': '4111111111111111',
    'ccard:MasterCard': '5499740000000057',
    'ccard:Discover': '6011000991001201',
    'ccard:Amex': '371449635392376',
    'ccard:Diners': '38555565010005',
    'ccard:DinersMC': '36050000000003',
    'ccard:JCB': '3530142019955809'
  },
  errorAmounts: {
    '0.00': {
      code: 13,
      msg: 'Invalid amount'
    },
    '0.69': {
      code: 51,
      msg: 'Insufficient funds'
    },
    '0.95': {
      code: 5,
      msg: 'Do not honor'
    }
  },
  validAmounts: {
    '1.42': '0142',
    '10.00': '0',
    '10.42': '01042',
    '32.49': 'A'
  },
  cvv2: {
    'ccard:Visa': {
      '000': 'N',
      '999': 'M',
      '899': 'U',
      '799': 'P',
      '699': 'S'
    },
    'ccard:MasterCard': {
      '000': 'N',
      '998': 'M',
      '898': 'U',
      '798': 'P',
      '698': 'S'
    },
    'ccard:Discover': {
      '000': 'N',
      '996': 'M',
      '896': 'U',
      '796': 'P',
      '696': 'S'
    }
  },
  avs: {
    '00000': 'N',
    '24060': 'M',
    '24060-6345': 'M',
    '24061': '',
    '8320': 'A',
    '85284': 'Z',
    '8320 85284': 'Y',
    '99999': 'U',
    '99998': 'G',
    '999970001': 'B',
    '999970002': 'C',
    '999970003': 'D',
    '999970004': 'I',
    '999970005': 'M',
    '999970006': 'P',
    '999970007': 'A',
    '999970008': 'Y',
    '999970009': 'S',
    '999970010': 'R'
  }
};

/**
 * Initializes this module.
 *
 * @param callback(err) called once the operation completes.
 */
api.init = function(callback) {
  callback(null);
};

/**
 * Attempts to create a payment token. This may result in a hold on funds
 * for a customer, but it *must not* result in a capture of those funds. If
 * tokenization is not supported, then the callback will return a null
 * token.
 *
 * @param source the source of funds (eg: CreditCard, BankAccount).
 * @param token the PaymentToken with custom information to store.
 * @param callback(err, token) called once the operation completes.
 */
api.createPaymentToken = function(source, token, callback) {
  async.auto({
    hashSource: function(callback) {
      payswarm.security.hashJsonLd(source, callback);
    },
    blindSource: function(callback) {
      if(jsonld.hasValue(source, '@type', 'ccard:CreditCard')) {
        return callback(null, payswarm.tools.blindCreditCard(source));
      }
      if(jsonld.hasValue(source, '@type', 'bank:BankAccount')) {
        // FIXME: what masked info can be shown for a bank account?
        return callback(null, payswarm.tools.clone(source));
      }
      callback(null, payswarm.tools.clone(source));
    }
  }, function(err, results) {
    if(err) {
      return callback(err);
    }
    var blinded = results.blindSource;
    token['com:paymentToken'] = results.hashSource;
    token['com:gateway'] = api.gatewayName;
    token['com:paymentMethod'] = blinded['@type'];
    if(jsonld.hasValue(source, '@type', 'ccard:CreditCard')) {
      token['ccard:brand'] = blinded['ccard:brand'];
      token['ccard:number'] = blinded['ccard:number'];
      token['ccard:expMonth'] = blinded['ccard:expMonth'];
      token['ccard:expYear'] = blinded['ccard:expYear'];
    }
    else if(jsonld.hasValue(source, '@type', 'bank:BankAccount')) {
      token['bank:account'] = blinded['bank:account'];
      token['bank:routing'] = blinded['bank:routing'];
    }
    callback(null, token);
  });
};

/**
 * Attempts to authorize a deposit. This may result in a hold on funds for
 * a customer, but it *must not* result in a capture of those funds.
 *
 * If the deposit was not approved, an exception will be set. However,
 * if the deposit was approved, it may have still failed authorization.
 *
 * @param deposit the Deposit with a payment source, e.g. CreditCard, to
 *          authorize.
 * @param callback(err) called once the operation completes.
 */
api.authorizeDeposit = function(deposit, callback) {
  payswarm.logger.debug(api.name, 'authorize deposit:', deposit);

  // clear any existing errors, initialize
  deposit['com:gatewayError'] = [];
  deposit['psa:approved'] = false;

  // attempt authorization
  var source = deposit['com:source'];
  async.waterfall([
    function(callback) {
      if(jsonld.hasValue(source, '@type', 'com:PaymentToken')) {
        deposit['psa:approved'] = true;
        return callback();
      }
      if(jsonld.hasValue(source, '@type', 'bank:BankAccount')) {
        deposit['psa:approved'] = true;
        return callback();
      }
      if(jsonld.hasValue(source, '@type', 'ccard:CreditCard')) {
        // create simulated response from gateway
        return _createResponse(deposit, function(err, response) {
          if(err) {
            deposit['com:gatewayError'].push('unprocessed');
            return callback(err);
          }
          payswarm.logger.debug(api.name,
            'gateway authorize response:', response, 'for deposit:', deposit);
          _parseResponse(response, deposit, callback);
        });
      }
      deposit['com:gatewayError'].push('unprocessed');
      return callback(new PaySwarmError(
        'Could not authorize Deposit; unsupported source of funds.',
        MODULE_TYPE + '.UnsupportedSource'));
    }
  ], function(err, callback) {
    payswarm.logger.debug(api.name,
      'gateway approved="' + deposit['psa:approved'] + '", errors:',
      deposit['com:gatewayError']);

    if(!deposit['psa:approved']) {
      err = new PaySwarmError(
        'Deposit authorization not approved.',
        MODULE_TYPE + '.DepositNotApproved',
        {errors: deposit['com:gatewayError']}, err);
    }
    callback(err);
  });
};

/**
 * Charges a customer's payment source to perform a deposit. A customer's
 * payment source may be approved even if there are some errors, like all
 * AVS (address verification service) checks did not pass, e.g. their
 * zip and/or their address was incorrect.
 *
 * If the payment source was not approved, an exception will be set.
 *
 * @param deposit the Deposit with a payment source, e.g. CreditCard, to
 *          charge.
 *@param callback(err) called once the operation completes.
 */
api.chargeDeposit = function(deposit, callback) {
  payswarm.logger.debug(api.name, 'charge deposit:', deposit);

  // clear any existing errors, initialize
  deposit['com:gatewayError'] = [];
  deposit['psa:approved'] = false;

  // attempt authorization
  var source = deposit['com:source'];
  async.waterfall([
    function(callback) {
      if(jsonld.hasValue(source, '@type', 'com:PaymentToken')) {
        deposit['psa:approved'] = true;
        return callback();
      }
      if(jsonld.hasValue(source, '@type', 'bank:BankAccount')) {
        deposit['psa:approved'] = true;
        return callback();
      }
      if(jsonld.hasValue(source, '@type', 'ccard:CreditCard')) {
        // create simulated response from gateway
        return _createResponse(deposit, function(err, response) {
          if(err) {
            deposit['com:gatewayError'].push('unprocessed');
            return callback(err);
          }
          payswarm.logger.debug(api.name,
            'gateway charge response:', response, 'for deposit:', deposit);
          _parseResponse(response, deposit, function(err) {
            if(!err && deposit['psa:approved']) {
              // if approved, then add auth approval code for receipt logs
              deposit['psa:authorizationApprovalCode'] = response.Auth;
            }
            callback(err);
          });
        });
      }
      deposit['com:gatewayError'].push('unprocessed');
      return callback(new PaySwarmError(
        'Could not charge Deposit; unsupported source of funds.',
        MODULE_TYPE + '.UnsupportedSource'));
    }
  ], function(err, callback) {
    payswarm.logger.debug(api.name,
      'gateway approved="' + deposit['psa:approved'] + '", errors:',
      deposit['com:gatewayError']);

    if(!deposit['psa:approved']) {
      err = new PaySwarmError(
        'Deposit charge not approved.',
        MODULE_TYPE + '.DepositNotApproved',
        {errors: deposit['com:gatewayError']}, err);
    }
    callback(err);
  });
};

/**
 * Blinds confidential information in a customer's deposit/payment source.
 *
 * @param deposit the Deposit with a payment source, e.g. CreditCard, to
 *          blind.
 * @param callback(err, blinded) called once the operation completes.
 */
api.blindDeposit = function(deposit, callback) {
  var source = payswarm.tools.blindCreditCard(deposit['com:source']);
  deposit['com:source'] = source;
  // remove signature from deposit
  delete deposit['sec:signature'];
};

/**
 * Creates a fake credit card gateway response.
 *
 * @param deposit the deposit to create a fake response for.
 * @param callback(err, response) called once the operation completes.
 */
function _createResponse(deposit, callback) {
  var response = {};

  // get amount from first transfer (code assumes this is the amount to
  // be deposited into the identity's account)
  var transfers = jsonld.getValues(deposit['com:transfer']);
  var amount = transfers[0]['com:amount'];

  // get key to test data as 2 digit precision amount
  var key = new Money(amount, 2, Up).toString();
  if(testData.errorAmounts[key]) {
    response.Auth = 'Declined';
  }
  else if(testData.validAmounts[key]) {
    response.Auth = testData.validAmounts[key];
  }
  else {
    // any amount is approved if not in the error amounts list
    response.Auth = 'Approved';
  }

  // check source
  var source = deposit['com:source'];
  if(jsonld.hasValue(source, '@type', 'ccard:CreditCard')) {
    var address = source['ccard:address'];

    // check card number
    var brand = source['ccard:brand'];
    if(testData.validCards[brand] !== source['ccard:number']) {
      // invalid card number
      response.Auth = 'Declined';
    }
    else {
      // get cvv2 response
      var cvv2 = source['ccard:cvm'];
      if(testData.cvv2[brand][cvv2]) {
        response.CVV2ResponseMsg = testData.cvv2[brand][cvv2];
      }
      else {
        // approve any other cvv2 as a match
        response.CVV2ResponseMsg = 'M';
      }

      // get AVS response
      var zip = address['vcard:postal-code'];
      if(testData.avs[zip]) {
        response.AVSCode = testData.avs[zip];
      }
      else {
        // approve any other zip as a match
        response.AVSCode = 'M';
      }
    }
    return callback(null, response);
  }
  if(jsonld.hasValue(source, '@type', 'com:PaymentToken')) {
    // approved
    response.CVV2ResponseMsg = 'M';
    response.AVSCode = 'M';
    return callback(null, response);
  }

  // invalid source
  response.Auth = 'Declined';
  callback(null, response);
}

/**
 * Parses a response from the gateway.
 *
 * @param response the response data.
 * @param deposit the deposit to update.
 * @param callback(err) called once the operation completes.
 */
function _parseResponse(response, deposit, callback) {
  // for collecting encountered errors
  var errors = [];

  // fields in the response:
  //
  // TransID : a number, assigned by TransFirst
  // RefNo   : should be our TransactionId
  // Auth    : 10 chars, authentication code from gateway, either
  //           "Approved", auth code, "Declined",
  //           OR blank/NULL (same as "Declined")
  // Notes   : text, a description of failures
  // AVSCode : 2 chars, AVS Response Code, only first char is used for now
  // CVV2ResponseMsg : 1 char, CVV2 Response Code

  // parse Auth code
  if(response.Auth === 0 || response.Auth === 'declined') {
    errors.push('declined');
    return callback(null);
  }

  // credit card action was approved (money *was* withheld or authorization
  // *was* approved externally ... even if our checks on CVV2 or AVS fail)
  // Note: We actually set this approved to false for this TestGateway
  // if the CVV2 fails ... which is different from most production gateways
  // because the credit card will be declined outright if the CVV2 fails.
  deposit['psa:approved'] = true;

  // Note: Apparently if the CVV2 doesn't pass on TransFirst, then
  // declined will be returned... which means that perhaps the code
  // to check the CVV2 response doesn't even need to be here, the
  // AVS code, however, if not a "match" will not result in declined
  // being returned, so we definitely must check it

  // check cvv2 code
  var cvv2 = response.CVV2ResponseMsg || '';
  cvv2 = cvv2.toUpperCase();
  switch(cvv2) {
  case 'M': // CVV2 Match
  case 'P': // Not Processed
  case 'U': // Service not available
  case 'S': // Service not supported
  case 'X': // No Response
    // not an error
    break;
  case 'N': // CVV2 No Match, epic fail
  case '':  // wrong CVV2 number/format or no CVV2 number
    deposit['psa:approved'] = false;
    errors.push('invalidCvm');
    break;
  default: // Invalid CVV2 response code
    deposit['psa:approved'] = false;
    errors.push('error');
    return callback(new PaySwarmError(
      'Invalid CVV2 response code.',
      MODULE_TYPE + '.InvalidCVV2ResponseCode',
      {'CVV2ResponseCode': cvv2}));
  }

  // check avs code
  var avs = response.AVSCode || '';
  avs = avs.toUpperCase();
  switch(avs) {
  case 'X': // Match, street and 9-digit zip both match
  case 'D': // INTERNATIONAL 'X'
  case 'F': // UK-SPECIFIC 'X'
  case 'Y': // Match, street and 5-digit zip both match
  case 'M': // INTERNATIONAL 'Y'
  case 'B': // INTERNATIONAL 'A', country may not have ZIP, so accept
  case 'U': // AVS not applicable or unavailable
  case 'R': // AVS not applicable or unavailable
  case 'S': // AVS service not supported by bank
  case 'I': // INTERNATIONAL 'U'
  case 'G': // GLOBAL AVS service unavailable
    // not an error
    break;
  case 'A': // Partial Match, street matches, neither zip does
    errors.push('invalidZip');
    break;
  case 'Z': // Partial Match, zip matches, address does not
  case 'P': // INTERNATIONAL 'Z'
  case 'W': // Partial Match, 9-digit zip matches, address does not
    errors.push('invalidAddress');
    break;
  case 'N': // No Match, nothing matches, epic fail
  case 'C': // INTERNATIONAL 'N'
    errors.push('invalidZip');
    errors.push('invalidAddress');
    break;
  case 'E': // not allowed for MOTO (Internet/Phone) transactions
    errors.push('error');
    break;
  // Invalid avs response code
  default:
    error.push('error');
    return callback(new PaySwarmError(
      'Invalid AVS response code.',
      MODULE_TYPE + '.InvalidAVSResponseCode',
      {'AVSResponseCode': avs}));
  }

  callback();
}
