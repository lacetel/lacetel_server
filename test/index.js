/**
 * @author Isaac Vega Rodriguez          <isaacvega1996@gmail.com>
 */

'use strict';

var chai         = require('chai');
var chaiHttp     = require('chai-http');
var express      = require('express');
var Influx       = require('influxdb-nodejs');
var bcrypt       = require('bcrypt-nodejs');
var request      = require('request-promise');

var influxToJSON = require('../app/utils/influx-to-json');
// var CATEGORIES   = require('../config/user_categories').enumCategories;

var config       = require('../config/config');
var createToken  = require('../auth/tokenService').createToken;
var STATES       = require('../config/user_states');

const db = config.db;
const influx = new Influx(`http://${db.host}:${db.port}/${db.database}`);

var app = express();

chai.use(chaiHttp);

var expect = chai.expect;

require('../config/express')(app, config);

//var controllers = glob.sync(config.root + '/app/controllers/*.js');

// controllers.forEach(function (controller) {
//   require(controller)(app);
// });

var ADMIN_TOKEN = createToken({
  name: 'admin',
  username: 'admin',
  email: 'root@root.com',
  category: 'admin',
});

var MODERATOR_TOKEN = createToken({
  name: 'mod',
  username: 'mod',
  email: 'root@root.com',
  category: 'moderador',
});

var USER_TOKEN = createToken({
  name: 'user',
  username: 'user',
  email: 'root@root.com',
  category: 'user',
});

function createUser(email, password, category, state) {

  return influx
    .write('User')
    .field({
      name: email,
      username: email,
      password: bcrypt.hashSync(password),
      configured: true,
      age: -1,
      phone: '',
      province: '',
      state,
      category
    })
    .tag({
      email
    });
}

function deleteUser(email, done) {

  request({
    method: 'POST',
    uri: `http://${db.host}:${db.port}/query`,
    form: {
      db: 'lacetel',
      q: `drop series from "User" where email='${email}'`
    },
    json: true
  })
    .then((res) => { done(); })
    .catch(done);

}

/// GET
describe('GET /api/users', function() {
  it('Should return unauthorized without token', function(done) {
    chai
      .request(app)
      .get('/api/users')
      .set({
        'Accept': 'application/json'
      })
      .end(function(err, res) {
        // console.log('Without AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done();
      });
  });

  it('Should return unauthorized with user token', function(done) {
    chai
      .request(app)
      .get('/api/users')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ThisIsMyFakeToken`
      })
      .end(function(err, res) {
        // console.log('Width USER AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done(err);
      });
  });

  it('Should return unauthorized with user token', function(done) {
    chai
      .request(app)
      .get('/api/users')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${USER_TOKEN}`
      })
      .end(function(err, res) {
        // console.log('Width USER AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done(err);
      });
  });

  it('Should return a list of users with moderator token', function(done) {
    chai
      .request(app)
      .get('/api/users')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${MODERATOR_TOKEN}`
      })
      .end(function(err, res) {
        // console.log('Width MOD AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done(err);
      });
  });

  it('Should return a list of users with admin token', function(done) {
    chai
      .request(app)
      .get('/api/users')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${ADMIN_TOKEN}`
      })
      .end(function(err, res) {
        // console.log('Width ADMIN AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.have.header('Content-type', /json/);
        done(err);
      });
  });

});

describe('GET /api/user/:username', function() {
  it('Should return data only for authenticated users', function(done) {
    chai
      .request(app)
      .get('/api/user/root@root.com')
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done();
      });
  });

  it('Should not see the root', function(done) {
    chai
      .request(app)
      .get('/api/user/root@root.com')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${USER_TOKEN}`
      })
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(404);
        done();
      });
  });

  it('Should get the default admin', function(done) {
    chai
      .request(app)
      .get('/api/user/admin@admin.com')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${USER_TOKEN}`
      })
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.have.header('Content-type', /json/);
        done();
      });
  });

});

describe('GET /api/signals', function() {
  it('Should return unauthorized', function(done) {
    chai
      .request(app)
      .get('/api/signals')
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done();
      });
  });

  it('Should return something with authorized token', function(done) {
    chai
      .request(app)
      .get('/api/signals')
      .set({
        'Authorization': `Token ${USER_TOKEN}`
      })
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.have.header('Content-type', /json/);
        done();
      });
  });//*/

});

describe('GET /api/sensors', function() {
  it('Should return unauthorized without token', function(done) {
    chai
      .request(app)
      .get('/api/sensors')
      .set({
        'Accept': 'application/json'
      })
      .end(function(err, res) {
        // console.log('Without AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done();
      });
  });

  it('Should return unauthorized with invalid token', function(done) {
    chai
      .request(app)
      .get('/api/sensors')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ThisIsMyFakeToken`
      })
      .end(function(err, res) {
        // console.log('With USER AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done(err);
      });
  });

  it('Should return authorized with user token', function(done) {
    chai
      .request(app)
      .get('/api/sensors')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${USER_TOKEN}`
      })
      .end(function(err, res) {
        // console.log('Width USER AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done(err);
      });
  });

  it('Should return a list of users with moderator token', function(done) {
    chai
      .request(app)
      .get('/api/sensors')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${MODERATOR_TOKEN}`
      })
      .end(function(err, res) {
        // console.log('Width MOD AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done(err);
      });
  });

  it('Should return a list of users with admin token', function(done) {
    chai
      .request(app)
      .get('/api/sensors')
      .set({
        'Accept': 'application/json',
        'Authorization': `Token ${ADMIN_TOKEN}`
      })
      .end(function(err, res) {
        // console.log('Width ADMIN AUTH', res.text);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.have.header('Content-type', /json/);
        done(err);
      });
  });
});

/// POST
describe('POST /api/login', function() {
  it('Should return an user error', function(done) {
    chai
      .request(app)
      .post('/api/login')
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
      });
  });

  it('Should return a not found error', function(done) {
    chai
      .request(app)
      .post('/api/login')
      .send({
        username: 'fakeuser',
        password: 'fakepassword'
      })
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(404);
        done();
      });
  });

  it('Should return unauthorized for a pending user', function(done) {
    this.timeout(0);

    createUser('$testuser$', 'testpassword', 'user', STATES.PENDING)
      .then(() => {
        chai
          .request(app)
          .post('/api/login')
          .send({
            username: '$testuser$',
            password: 'testpassword'
          })
          .end(function(err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(401);
            deleteUser('$testuser$', done);
          });
      })
      .catch((err) => {
        done(err);
      });

  });

  it('Should return unauthorized for an inactive user', function(done) {
    this.timeout(0);

    createUser('$testuser$', 'testpassword', 'user', STATES.INACTIVE)
      .then(() => {
        chai
          .request(app)
          .post('/api/login')
          .send({
            username: '$testuser$',
            password: 'testpassword'
          })
          .end(function(err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(401);
            deleteUser('$testuser$', done);
          });
      })
      .catch((err) => {
        done(err);
      });

  });

  it('Should return unauthorized for a password mismatch', function(done) {
    this.timeout(0);

    createUser('$testuser$', 'testpassword', 'user', STATES.ACTIVE)
      .then(() => {
        chai
          .request(app)
          .post('/api/login')
          .send({
            username: '$testuser$',
            password: 'testpassword1'
          })
          .end(function(err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(401);
            deleteUser('$testuser$', done);
          });
      })
      .catch((err) => {
        done(err);
      });

  });

  it('Should return a token', function(done) {
    this.timeout(0);

    createUser('$testuser$', 'testpassword', 'user', STATES.ACTIVE)
      .then(() => {
        chai
          .request(app)
          .post('/api/login')
          .send({
            username: '$testuser$',
            password: 'testpassword'
          })
          .end(function(err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('token');
            deleteUser('$testuser$', done);
          });
      })
      .catch((err) => {
        done(err);
      });

  });

});

describe('POST /api/register', function() {
  it('Should return an user error', function(done) {
    chai
      .request(app)
      .post('/api/register')
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
      });
  });

  it('Should return an user error (missing password)', function(done) {
    chai
      .request(app)
      .post('/api/register')
      .send({
        email: "testEmail@test.test"
      })
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
      });
  });

  it('Should not register again an existing user', function(done) {
    chai
      .request(app)
      .post('/api/register')
      .send({
        email: "root@root.com",
        password: "fakepassword"
      })
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
      });
  });

  it('Should register correctly an user', function(done) {
    createUser('$fakeuser$', 'fakepassword', 'user', STATES.ACTIVE)
      .then(() => {
        influx
          .query('User')
          .where('email', '$fakeuser$')
          .then(influxToJSON)
          .then((users) => {
            expect(users.length).to.be.eq(1);
            expect(users[0]).to.have.property('email');
            expect(users[0].email).to.be.eq('$fakeuser$');
            deleteUser('$fakeuser$', done);
          })
          .catch(done);
      })
      .catch(done);
  });

});