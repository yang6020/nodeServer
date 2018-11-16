// These are the request handlers

// Dependencies
const _data = require('./data.js');
const helpers = require('./helpers.js');
const config = {
  maxChecks: 5,
};
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

handlers._users.get = (data, callback) => {
  // Check that phone provided is valid
  const phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // only let authenticated user to access their object. Not anyone else's
    // get token from headers
    const token =
      typeof data.headers.token == 'string' ? data.headers.token : false;
    // verify that given token from headers is valid
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
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
        callback(403, {
          error: 'Missing required token in header or token is invalid',
        });
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
    // only let authenticated user to access their object. Not anyone else's
    // get token from headers
    const token =
      typeof data.headers.token == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (err, tokenIsValid) => {
      if (!err && tokenIsValid) {
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
        callback(403, {
          error: 'Missing required token in header or token is invalid',
        });
      }
    });
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

// Users - Delete
// Required: phone
// TODO: Only let authenticated user delete their object. Not anyone else's
// TODO: Cleanup and delete files associated with that user
handlers._users.delete = (data, callback) => {
  const phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  if (phone) {
    // only let authenticated user to access their object. Not anyone else's
    // get token from headers
    const token =
      typeof data.headers.token == 'string' ? data.headers.token : false;
    _data._tokens.verifyToken(token, phone, (err, tokenIsValid) => {
      if ((!err, tokenIsValid)) {
        _data.read('users', phone, (err, user) => {
          if (!err && user) {
            _data.delete('users', phone, err => {
              if (!err) {
                callback(200);
              } else {
                callback(400, { error: 'Could not delete specified user' });
              }
            });
          } else {
            callback(404, { error: 'User does not exist' });
          }
        });
      } else {
        callback(403, { error: 'Missing token from headers or invalid token' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Users
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for token methods
handlers._tokens = {};

// Post
// Required: phone, password
// Optional: none
handlers._tokens.post = (data, callback) => {
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
  if (phone && password) {
    // Look up user that matches phone number
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // hash the sent password and then compare to the password stored in user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // if valid, create a token with a random name that expires after 1 hour
          const tokenId = helpers.createRandomString(20);
          // this should expire now + 1 hour. 1000 miliseconds * 60 seconds * 60 minutes
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            id: tokenId,
            expires,
          };
          _data.create('tokens', tokenId, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { error: 'Could not create new token' });
            }
          });
        } else {
          callback(400, { error: 'Password did not match' });
        }
      } else {
        callback(400, { error: 'Could not find specified user' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Get
// Required: id
// Optional: none
handlers._tokens.get = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if ((!err, tokenData)) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Put
// Required: id, extend
// Optional: none
handlers._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  const extend =
    typeof data.payload.extend == 'boolean' && data.payload.extend == true
      ? true
      : false;
  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if ((!err, tokenData)) {
        // Check to make sure token isn't already expired (only extend tokens that are active)
        if (tokenData.expires > Date.now()) {
          // set expiration an hour from now;
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // store new update
          _data.update('tokens', id, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { error: "Could not update token's expiration" });
            }
          });
        } else {
          callback(400, {
            error: 'The token has already expired and cannot be extended',
          });
        }
      } else {
        callback(400, { error: 'Specified token does not exist' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Delete
// Required: id
// Optional: none
handlers._tokens.delete = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { error: 'Could not delete specified token' });
          }
        });
      } else {
        callback(400, { error: 'Could not find specified token' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

handlers._tokens.verifyToken = (id, phone, callback) => {
  // Lookup token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check if token is for given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

handlers._checks.post = (data, callback) => {
  const protocol =
    typeof data.payload.protocol == 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  const method =
    typeof data.payload.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // get token from headers
    const token =
      typeof data.headers.token == 'string' ? data.headers.token : false;
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        // look up user by reading the token
        const userPhone = tokenData.phone;

        // look up user data
        _data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks == 'object' &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            // verify user has less checks than number of max checks per user
            if (userChecks.length < config.maxChecks) {
              // create random id for the check
              const checkId = helpers.createRandomString(20);
              // create check Object and include the user's phone (how we uniquely identitify user);
              const checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds,
              };
              // persist object to disk
              _data.create('checks', checkId, checkObject, err => {
                if (!err) {
                  userData.checks = userChecks;
                  userData.checks.push(checkId);
                  // save user data
                  _data.update('users', userPhone, userData, err => {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, { error: 'could not add checkId to user' });
                    }
                  });
                } else {
                  callback(500, { error: 'could not create the new check' });
                }
              });
            } else {
              callback(400, {
                error:
                  'user has maximum number of checks (' +
                  config.maxChecks +
                  ')',
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { error: 'Missing required inputs, or inputs are invalid' });
  }
};

// Checks -get
// Required : id
handlers._checks.get = (data, callback) => {
  // Check that id provided is valid
  const id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // lookup check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // only let authenticated user to access their object. Not anyone else's
        // get token from headers
        const token =
          typeof data.headers.token == 'string' ? data.headers.token : false;
        // verify that given token from headers is valid and belongs to user who made the check
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          tokenIsValid => {
            if (tokenIsValid) {
              callback(200, checkData);
            } else {
              callback(403);
            }
          },
        );
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Checks -put
// Required : id
// Optional: protocol,url,method,successCodes,timeoutSeconds one must be sent
handlers._checks.put = (data, callback) => {
  const id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  // Check for optional fields
  const protocol =
    typeof data.payload.protocol == 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  const method =
    typeof data.payload.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  if (id) {
    // only let authenticated user to access their object. Not anyone else's
    // get token from headers
    if (protocol || url || method || timeoutSeconds) {
      // Lookup user to see if it exists
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          const token =
            typeof data.headers.token == 'string' ? data.headers.token : false;
          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            tokenIsValid => {
              if (tokenIsValid) {
                // Update fields necessary
                if (protocol) {
                  checkData.protocol = protocol;
                }
                if (url) {
                  checkData.url = url;
                }
                if (method) {
                  checkData.method = method;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }
                // Store new updates
                _data.update('checks', id, checkData, err => {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { error: 'Could not update the check' });
                  }
                });
              } else {
                callback(403, {
                  error: 'Missing required token in header or token is invalid',
                });
              }
            },
          );
        } else {
          callback(400, { error: 'checkID does not exist' });
        }
      });
    } else {
      callback(400, { error: 'Missing fields for update' });
    }
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

handlers._checks.delete = (data, callback) => {};
// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
