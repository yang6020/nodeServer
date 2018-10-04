var environments = {};

environments.staging = {
  port: 3000,
  envName: 'staging',
};

environments.production = {
  port: 5000,
  envName: 'production',
};

var currentEnvironment =
  typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

var exportEnvironment =
  typeof environments[currentEnvironment] === 'object'
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = exportEnvironment;
