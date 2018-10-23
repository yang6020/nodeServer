// Helpers for various tasks

// Dependencies
const crypto = require('crypto');
const config = require('./config');
// Container for all helpers
const helpers = {};

helpers.hash = str => {
  //hash using SHA-256
  if (typeof str == 'string' && str.length > 5) {
    const hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse JSON string to an object in all cases without throwing
helpers.parseJsonToObject = str => {
  try {
    const object = JSON.parse(str);
    return object;
  } catch (e) {
    return {};
  }
};

module.exports = helpers;
