var Express = require('express');
var Tags = require('../Validator.js').Tags;
var async = require('async');
var mysql = require('mysql');
var {Session} = require('../Session.js');

var router = Express.Router({caseSensitive: true});
router.baseURL = '/Prss';


// * Old Versions only for notes
//.../Prss?email=cstaley
// router.get('/', function(req, res) {
//    var email = req.session.isAdmin() && req.query.email ||
// / !req.session.isAdmin() && req.session.email;
//    var cnnConfig = {
//       "host": "127.0.0.1",
//       "user": "mmoschit",
//       "password": "015807866",
//       "database": "project2DB"
//    };


//    var cnn = mysql.createConnection(cnnConfig);

//    if (email)
//       cnn.query('select id, email from Person where email = ?', [email],
//       function(err, result) {
//          if (err) {
//             res.status(500).json("Failed query");
//          }
//          else {
//             res.status(200).json(result);
//          }
//          cnn.destroy();
//       });
//    else
//       cnn.query('select id, email from Person',
//       function(err, result) {
//          if (err) {
//             res.status(500).json("Failed query");
//          }
//          else {
//             res.status(200).json(result);
//          }
//          cnn.destroy();
//       });
// });

// // Non-waterfall, non-validator, non-db automation version
// router.post('/', function(req, res) {
//    var body = req.body;
//    var admin = req.session && req.session.isAdmin();
//    var errorList = [];
//    var qry;
//    var noPerm;
//    var cnnConfig = {
//       "host": "127.0.0.1",
//       "user": "root",
//       "password": "moschitto",
//       "database": "project2DB"
//    };

//    if (admin && !body.password)
//       body.password = "*";                       // Blocking password
//    body.whenRegistered = new Date();

//    // Check for fields
//    if (!body.hasOwnProperty('email'))
//       errorList.push({tag: "missingField", params: "email"});
//    if (!body.hasOwnProperty('password'))
//       errorList.push({tag: "missingField", params: "password"});
//    if (!body.hasOwnProperty('role'))
//       errorList.push({tag: "missingField", params: "role"});

//    // Do these checks only if all fields are there
//    if (!errorList.length) {
//       noPerm = body.role === 1 && !admin;
//       if (!body.termsAccepted)
//          errorList.push({tag: "noTerms"});
//       if (body.role < 0 || body.role > 1)
//          errorList.push({tag: "badVal", param: "role"});
//    }

//    // Post errors, or proceed with data fetches
//    if (noPerm)
//       res.status(403).end();
//    else if (errorList.length)
//       res.status(400).json(errorList);
//    else {
//       var cnn = mysql.createConnection(cnnConfig);

//       // Find duplicate Email if any.
//       cnn.query(qry = 'select * from Person where email = ?', body.email,
//       function(err, dupEmail) {
//          if (err) {
//             cnn.destroy();
//             res.status(500).json("Failed query " + qry);
//          }
//          else if (dupEmail.length) {
//             res.status(400).json({tag: "dupEmail"});
//             cnn.destroy();
//          }
//          else { // No duplicate, so make a new Person
//             body.termsAccepted = body.termsAccepted && new Date();
//             cnn.query(qry = 'insert into Person set ?', body,
//             function(err, insRes) {
//                cnn.destroy();
//                if (err)
//                   res.status(500).json("Failed query " + qry);
//                else
//                   res.location(router.baseURL + '/' + insRes.insertId).end();
//             });
//           }
//       });
//    }
// });
// * End old
/* Much nicer versions
*/
router.get('/', function(req, res) {
   console.log("Get all Sessions")
   var email = req.session.isAdmin() && req.query.email ||
    !req.session.isAdmin() && req.session.email;

   

   var handler = function(err, prsArr, fields) {
      console.log(email);
      console.log(prsArr);
      
      // TODO: THERE HAS GOT TO BE A BETTER WAY TO DO THIS
      // * currently solves "Get all people Non Admin Suffix Not Ok"
      if (
       req.query.email && 
       prsArr[0] &&
       prsArr[0]['email'] && 
       !prsArr[0]['email'].split('@')[0].includes(req.query.email) &&
       prsArr[0]['email'] !== req.query.email)
         res.json([]);
      else
         res.json(prsArr);
      req.cnn.release();
   };

   // It would be smart to make email keyed,
      // if already add key to email, say CSC, then it can sort much faster
   if (email)
      //todo: cant use % sign 
      req.cnn.chkQry("select id, email from Person where email like ?", ['%' + email + '%'], handler);
   else
      req.cnn.chkQry('select id, email from Person', null, handler);
});

router.post('/', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn = req.cnn;

   if (admin && !body.password)
      body.password = "*";                       // Blocking password
   body.whenRegistered = new Date();

      var lengths = {
         'firstName': 30,
         'lastName': 50,
         'password': 50,
         'oldPassword': 50,
         'email' : 150
      };

   async.waterfall([
      function(cb) { // Check properties and search for Email duplicates
         console.log(body);
         if (vld.hasFields(body, ["email", "password", "role", "lastName"], cb) &&
         vld.chain(body.email.length > 0, Tags.missingField, ['email'])
          .chain(body.lastName.length > 0, Tags.missingField, ['lastName'])
          .chain(body.termsAccepted || admin, Tags.noTerms)
          .chain(body.password.length > 0, Tags.missingField, ['password'])
          .chain(typeof body.role === 'number' || body.role != "", Tags.missingField, ['role'])
          .chain(body.role === 0 || admin, Tags.forbiddenRole)
          .check(body.role <= 1 && body.role >= 0, Tags.badValue, ["role"], cb) &&
          vld.checkFieldLengths(body, lengths, cb)) {
             console.log(vld.errors);
            cnn.chkQry('select * from Person where email = ?', body.email, cb);
         }
      },

      function(existingPrss, fields, cb) {  // If no dups, insert new Person
         if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
            body.termsAccepted = body.termsAccepted && new Date();
            cnn.chkQry('insert into Person set ?', [body], cb);
         }
      },

      function(result, fields, cb) { // Return location of inserted Person
         res.location(router.baseURL + '/' + result.insertId).end();
         cb();
      }],

      function(err) {
         cnn.release();
      });
   });

// });

// * THIS WAS DONE IN CLASS
router.put('/:id', function(req, res) {
   var vld = req.validator;
   var ssn = req.session;
   var body = req.body;
   var cnn = req.cnn;

   //todo: swamp if do need to check for password
   // var okFields = ['firstName', 'lastName', 'password', 'role']
   var okFields = ['firstName', 'lastName', 'password', 'oldPassword', 'role']
   var lengths = {
         'firstName': 30,
         'lastName': 50,
         'password': 50,
         'oldPassword': 50
      };

   async.waterfall([
   cb => { 
      // zero or more of fn, ln, pswd, role
      if (vld.checkPrsOK(req.params.id, cb) && vld.hasOnlyFields(body, okFields, cb) && 
       vld.checkFieldLengths(body, lengths, cb) &&// person in question or admin
       vld.chain((!("role" in req.body) || req.body.role == '0') || ssn.isAdmin(), Tags.badValue, ["role"])
       .chain(!('password' in body) || req.body.oldPassword || ssn.isAdmin(), Tags.noOldPwd) // s
       .check(!('password' in body) || req.body.password, Tags.badValue, ['password'], cb))

         cnn.chkQry("select * from Person where id = ?", [req.params.id], cb);
   },

   (foundPrs, fields, cb) => { 
      if(vld.check(foundPrs.length, Tags.notFound, null, cb) &&
       vld.check(ssn.isAdmin() || !('password' in body) 
       || req.body.oldPassword === foundPrs[0].password,
       Tags.oldPwdMismatch, null, cb)) {

         delete body.oldPassword;
         cnn.chkQry("update Person set ? where id = ?", [body, req.params.id], cb);

      }
   },

   // updatedResult, fields?, final callback
   (updRes, fields, cb) => {
      res.end();
      cb();
   }

   ],
   err => { 
      cnn.release();
   })
});

router.get('/:id', function(req, res) {
   var vld = req.validator;
   console.log("Getting Person by Id");
  
   //    return false;
   async.waterfall([
   function(cb) {
     if (vld.checkPrsOK(req.params.id, cb))
        req.cnn.chkQry('select * from Person where id = ?', [req.params.id], cb);
   },
   function(prsArr, fields, cb) {
      if (vld.check(prsArr.length, Tags.notFound, null, cb)) {
         delete prsArr[0].password;

         //DB time -> ms since epoch
         prsArr[0].whenRegistered = prsArr[0].whenRegistered.getTime();
         res.json(prsArr);
         cb();
      }
   }],
   err => {
      req.cnn.release();
   });
});

/*
router.get('/:id', function(req, res) {
   var vld = req.validator;

   if (vld.checkPrsOK(req.params.id)) {
      req.cnn.query('select * from Person where id = ?', [req.params.id],
      function(err, prsArr) {
         if (vld.check(prsArr.length, Tags.notFound))
            res.json(prsArr);
         req.cnn.release();
      });
   }
   else {
      req.cnn.release();
   }
});
*/

//TODO: delete all Cnvs and Msgs owned by person 
router.delete('/:id', function(req, res) {
   var vld = req.validator;

   async.waterfall([
   function(cb) {
      if (vld.checkAdmin()) {

         Session.removeAllSessions(req.params.id);
         req.cnn.chkQry('DELETE from Person where id = ?', [req.params.id], cb);
      }
   },
   function(result, fields, cb) {
      if (vld.check(result.affectedRows, Tags.notFound, null, cb)) {
         res.end();
         cb();
      }
   }],
   function(err) {
      req.cnn.release();
   });
});

router.get('/:prsId/Msgs', function(req, res){
   var vld = req.validator; // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn = req.cnn;
   

   async.waterfall([
      function(cb){
         cnn.chkQry("select * from Person where id = ?", [req.params.prsId], cb);
      },

      function(foundPrs, fields, cb){
         if(foundPrs.length){
            var orderBy = (req.query.order === 'date'  && 'whenMade' ||
                        req.query.order === 'likes' && 'numLikes');

            if(req.query.num && orderBy)
               cnn.chkQry("select Message.id, cnvId, whenMade, " +
                "email, content, ifnull(t1.numLikes, 0) as numLikes " +
                "from Person join Message on Person.id = prsId  " +
                "left join(select Message.id, count( * ) as numLikes " +
                "from Message join Likes on Message.id = Likes.msgId " +
                "group by Message.id) as t1 " +
                "on t1.id = Message.id " +
                "where prsId = ? " +
                `order by ${orderBy} desc ` + 
                "limit ?", [req.params.prsId, parseInt(req.query.num)], cb);

            else if (req.query.num)
               cnn.chkQry("select Message.id, cnvId, whenMade, " + 
                "email, content, ifnull(t1.numLikes, 0) as numLikes " + 
                "from Person join Message on Person.id = prsId  " + 
                "left join(select Message.id, count( * ) as numLikes " +  
                "from Message join Likes on Message.id = Likes.msgId " +  
                "group by Message.id) as t1 " + 
                "on t1.id = Message.id " + 
                "where prsId = ? " + 
                "limit ?", [req.params.prsId, parseInt(req.query.num)], cb);

            else if(orderBy)
               cnn.chkQry(`select Message.id, cnvId, whenMade,\
                email, content, ifnull(t1.numLikes, 0) as numLikes\
                from Person join Message on Person.id = prsId \
                left join(select Message.id, count( * ) as numLikes\ 
                from Message join Likes on Message.id = Likes.msgId\ 
                group by Message.id) as t1\
                on t1.id = Message.id\
                where prsId = ?\
                order by ${orderBy} desc`, [req.params.prsId], cb);

            else
              cnn.chkQry("select Message.id, cnvId, whenMade,\
               email, content, ifnull(t1.numLikes, 0) as numLikes\
               from Person join Message on Person.id = prsId\
               left join(select Message.id, count( * ) as numLikes \
               from Message join Likes on Message.id = Likes.msgId \
               group by Message.id) as t1\
               on t1.id = Message.id \
               where prsId = ?", [req.params.prsId], cb);
         }
      },

      function(resMsg, fields, cb){
         resMsg.forEach((msg) => msg.whenMade = msg.whenMade.getTime());
         res.json(resMsg);
         cb();
      }
   ],

   (err) => {
      if(!err)
         res.end();
      cnn.release();
   });
});

module.exports = router;
