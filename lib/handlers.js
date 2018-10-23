// These are the request handlers

// Dependencies
const _data = require('./data.js');
const helpers = require('./helpers.js');

// Define handlers
const handlers = {};

// Users
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for user submethods
handlers._users = {};

// Users - POST
// Required data: firstName,lastName,phone,password,tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out and have basic validation
  const firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 1
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 1
      ? data.payload.lastName.trim()
      : false;

  const phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  const password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 5
      ? data.payload.password.trim()
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement == 'boolean' &&
    data.payload.tosAgreement == true
      ? true
      : false;
  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    _data.read('users', phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true,
          };

          //Persist user to disk aka store user
          _data.create('users', phone, userObject, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { error: 'Could not create new user' });
            }
          });
        } else {
          callback(500, { error: 'Could not hash password' });
        }
      } else {
        // User already exists
        callback(400, { error: 'User with phone number already exists' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Users - GET
// Required data: phone
// Optional data: none
// TODO: only let authenticated user to access their object. Not anyone else's
handlers._users.get = (data, callback) => {
  // Check that phone provided is valid
  const phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    _data.read('users', phone, (err, user) => {
      if (!err && user) {
        // Remove hashed password from user object before returning from requestor
        delete user.hashedPassword;
        callback(200, user);
      } else {
        callback(404, { error: 'User does not exist' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Users - Put
// Required: phone
// Optional: firstName,lastName,password (at least one must be specified)
// TODO: only let authenticated user to update their own object. Not anyone else's
handlers._users.put = (data, callback) => {
  const phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  // Check for optional fields
  const firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 1
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 1
      ? data.payload.lastName.trim()
      : false;

  const password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 5
      ? data.payload.password.trim()
      : false;
  if (phone) {
    if (firstName || lastName || password) {
      // Lookup user to see if it exists
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          // Update fields necessary
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }
          // Store new updates
          _data.update('users', phone, userData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { error: 'Could not update the user' });
            }
          });
        } else {
          callback(400, { error: 'The specified user does not exist' });
        }
      });
    } else {
      callback(400, { error: 'Missing fields for update' });
    }
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

// Users - Delete
handlers._users.delete = (data, callback) => {};

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
