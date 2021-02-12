var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var {Session, router} = require('./Session.js');
var Validator = require('./Validator.js');
var CnnPool = require('./CnnPool.js');
var async = require('async');


var app = express();




// // Static paths to be served like index.html and all client side js
app.use(express.static(path.join(__dirname, 'public')));

// Partially complete handler for CORS.
app.use(function(req, res, next) {
   console.log("Handling " + req.path + '/' + req.method);
   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
   res.header("Access-Control-Allow-Credentials", true);
   res.header("Access-Control-Allow-Headers", "Content-Type");
   next();
});

// No further processing needed for options calls.
app.options("/*", function(req, res) {
   res.status(200).end();
});

// Parse all request bodies using JSON, yielding a req.body property
app.use(bodyParser.json());

// No messing w/db ids
app.use(function(req, res, next) {delete req.body.id; next();});

// Parse cookie header, and attach cookies to req as req.cookies.<cookieName>
app.use(cookieParser());

// TEST VALIDATOR FUNCTIONS
// app.use((req, res) => {
//    console.log(req);
//    console.log("got to test method");
//    vld = new Validator(req, res);
//    console.log(vld.checkFieldLengths(req.body, {'email' : 60, 'password' : 60}, () => true))
//    res.end();
// });



// ! Set up Session on req if available
app.use(router);

// Check general login.  If OK, add Validator to |req| and continue processing,
// otherwise respond immediately with 401 and noLogin error tag.
// THIS IS MOST LIKELY IN THE WRONG PLACE, 401 BEFORE 404 CHECKED
app.use(function(req, res, next) {
   console.log(req.path);
   console.log(req.method, req.path);
   if (req.session || (req.method === 'POST' &&
    (req.path === '/Prss' || req.path === '/Ssns'))) {
      req.validator = new Validator(req, res);
      // console.log(req.validator)
      next();
   } else
      res.status(401).end();
});

// Add DB connection, as req.cnn, with smart chkQry method, to |req|
app.use(CnnPool.router);

// Load all subroutes
app.use('/Prss', require('./Account/Prss.js'));
app.use('/Ssns', require('./Account/Ssns.js'));
app.use('/Cnvs', require('./Conversation/Cnvs.js'));
app.use('/Msgs', require('./Conversation/Msgs.js'));


// Special debugging route for /DB DELETE.  Clears all table contents,
//resets all auto_increment keys to start at 1, and reinserts one admin user.
app.delete('/DB', function(req, res) {
   console.log(Session.getAllIds());

   Session.logoutAll();
   // Callbacks to clear tables
   console.log(Session.getAllIds());
   var cbs = ["Message", "Conversation", "Person", "Likes"].map(
      table => function(cb) {
         req.cnn.query("delete from " + table, cb);
      }
   );

   // Callbacks to reset increment bases
   cbs = cbs.concat(["Conversation", "Message", "Person", "Likes"].map(
      table => cb => {
         req.cnn.query("alter table " + table + " auto_increment = 1", cb);
      })
   );

   // Callback to reinsert admin user
   cbs.push(cb => {
      req.cnn.query('INSERT INTO Person (firstName, lastName, email,' +
         ' password, whenRegistered, role) VALUES ' +
         '("Joe", "Admin", "adm@11.com","password", NOW(), 1);', cb);
   });

   // Callback to clear sessions, release connection and return result
   cbs.push(cb => {
      Session.getAllIds().forEach(id => {
         Session.findById(id).logOut();
         console.log("Clearing " + id);
      });
      cb();
   });

   async.series(cbs, err => {
      req.cnn.release();
      if (err)
         res.status(400).json(err);
      else
         res.status(200).end();
   });

   /* Equivalent expanded code for instructional reference
      async.series([
         function(callback){
            cnn.query('delete from Person`', callback);
         },
         function(callback){
            cnn.query('delete from Conversation', callback);
         },
         function(callback){
            cnn.query('delete from Message', callback);
         },
         function(callback){
            cnn.query('alter table Person auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Conversation auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Message auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('INSERT INTO Person (firstName, lastName, email,' +
                ' password, whenRegistered, role) VALUES ' +
                '("Joe", "Admin", "adm@11.com","password", NOW(), 2);',
             callback);
         },
         function(callback){
            for (var session in Session.sessions)
               delete Session.sessions[session];
            res.send();
         }
      ],
      err => {
        req.cnn.release();
        if (err)
           res.status(400).json(err);
        else
           res.status(200).end();
      }
   );*/
});

// Anchor handler for general 404 cases.
app.use(function(req, res) {
   res.status(404).end();
   res.cnn.release();
});

// Handler of last resort.  Send a 500 response with stacktrace as the body.
app.use(function(err, req, res, next) {
   res.status(500).json(err.stack);
   req.cnn && req.cnn.release();
});

app.listen(4015, function() {
   console.log('App Listening on port 4015');
});
