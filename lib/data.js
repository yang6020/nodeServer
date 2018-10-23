// Library to store and edit data

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
// Container for the module
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Function to write data to file
lib.create = (dir, file, data, callback) => {
  // Open file for writing
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'wx',
    (error, fileDescriptor) => {
      if (!error && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, err => {
          if (!err) {
            fs.close(fileDescriptor, err => {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing new file');
              }
            });
          } else {
            callback('Error writing to new file');
          }
        });
      } else {
        callback('Could not create new file. It may already exist');
      }
    },
  );
};

lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

lib.update = (dir, file, data, callback) => {
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'r+',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.truncate(fileDescriptor, err => {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, err => {
              if (!err) {
                fs.close(fileDescriptor, err => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Error closing existing file');
                  }
                });
              } else {
                callback('Error writing to existing file');
              }
            });
          } else {
            callback('Error truncating file');
          }
        });
      } else {
        callback('Could not open the file for updating. It may not exist yet');
      }
    },
  );
};

// Delete a file
lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
    if (!err) {
      callback(false);
    } else {
      callback('Error detecting file');
    }
  });
};
module.exports = lib;
