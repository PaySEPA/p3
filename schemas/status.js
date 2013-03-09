var tools = require(__libdir + '/payswarm-auth/tools');

var schema = {
  required: true,
  title: 'Status',
  description: 'A status setting.',
  type: 'string',
  enum: ['active', 'disabled', 'deleted'],
  errors: {
    invalid: 'Only "active", "disabled", or "deleted" are permitted.',
    missing: 'Please enter a status.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
