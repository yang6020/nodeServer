# Node-Server (Users backend)

A server built from scratch without using express.

Follows an error-first-callback approach with proper errors on each level

_all secrets and configs are also uploaded for testing purposes_

#### Functionality:

- Add users (POST):

  - Writes a user's data as a new file in the data folder (The file name is their unique phone number)
  - Verify's user data and encrypts the password

- Get users (GET):

  - Reads and returns a user's data without their password

### Prerequisites

#### Node

## Running the tests :

git clone https://github.com/yang6020/nodeServer.git

cd into node-server folder

### Start Server

    node index.js

Use postman to hit port (3000 or 3001)

---

### On Postman:

#### Post

send a post request with body containing a user:

    {
    "firstName": "Justin",
    "lastName": "Yang",
    "phone": "0123456789",
    "tosAgreement": true
    }

#### Get

send a get request (query by phone number):

    localhost:3000/users?phone=0123456789

## Built With

- [Node]
