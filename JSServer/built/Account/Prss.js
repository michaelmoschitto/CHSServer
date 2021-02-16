"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
// var Tags = require('../Validator.js').Tags;
const Validator_1 = require("../Validator");
var async = require('async');
var mysql = require('mysql');
var { Session } = require('../Session.js');
const express_1 = require("express");
exports.router = express_1.Router({ caseSensitive: true });
const baseURL = '/Prss';
const Tags = Validator_1.Validator.Tags;
;
;
// * Old Versions only for notes
//.../Prss?email=cstaley
// router.get('/', function(req: Request, res: Response) {
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
// router.post('/', function(req: Request, res: Response) {
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
exports.router.get('/', function (req, res) {
    var email = req.session.isAdmin() && req.query.email ||
        !req.session.isAdmin() && req.session.email;
    var handler = function (err, prsArr, fields) {
        if (req.query.email &&
            prsArr[0] &&
            prsArr[0]['email'] &&
            !prsArr[0]['email'].split('@')[0]
                .includes((req.query.email)) &&
            prsArr[0]['email'] !== req.query.email)
            res.json([]);
        else
            res.json(prsArr);
        req.cnn.release();
    };
    if (email)
        req.cnn.chkQry("select id, email from Person where email like ?", ['%' + email + '%'], handler);
    else
        req.cnn.chkQry('select id, email from Person', null, handler);
});
exports.router.post('/', function (req, res) {
    const vld = req.validator; // Shorthands
    var body = req.body;
    const admin = req.session && req.session.isAdmin();
    const cnn = req.cnn;
    if (admin && !body.password)
        body.password = "*"; // Blocking password
    body.whenRegistered = new Date();
    const lengths = {
        'firstName': 30,
        'lastName': 50,
        'password': 50,
        'oldPassword': 50,
        'email': 150
    };
    const fields = ["email", "password", "role", "lastName"];
    async.waterfall([
        function (cb) {
            console.log(body);
            if (vld.hasFields(body, fields, cb) &&
                vld.chain(body.email.length > 0, Tags.missingField, ['email'])
                    .chain(body.lastName.length > 0, Tags.missingField, ['lastName'])
                    .chain(body.termsAccepted || admin, Tags.noTerms)
                    .chain(body.password.length > 0, Tags.missingField, ['password'])
                    .chain(typeof body.role === 'number' || body.role != "", Tags.missingField, ['role'])
                    .chain(body.role === 0 || admin, Tags.forbiddenRole)
                    .check(body.role <= 1 && body.role >= 0, Tags.badValue, ["role"], cb) &&
                vld.checkFieldLengths(body, lengths, cb)) {
                cnn.chkQry('select * from Person where email = ?', [body.email], cb);
            }
        },
        function (existingPrss, fields, cb) {
            if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
                body.termsAccepted = body.termsAccepted && new Date();
                cnn.chkQry('insert into Person set ?', [body], cb);
            }
        },
        function (result, fields, cb) {
            res.location(baseURL + '/' + result.insertId).end();
            cb(null);
        }
    ], function (err) {
        cnn.release();
    });
});
exports.router.put('/:id', function (req, res) {
    const vld = req.validator;
    const ssn = req.session;
    var body = req.body;
    const cnn = req.cnn;
    const fields = [
        'firstName',
        'lastName',
        'password',
        'oldPassword',
        'role'
    ];
    const lengths = {
        'firstName': 30,
        'lastName': 50,
        'password': 50,
        'oldPassword': 50
    };
    async.waterfall([
        function (cb) {
            // zero or more of fn, ln, pswd, role
            if (vld.checkPrsOK(req.params.id, cb) && vld.hasOnlyFields(body, fields, cb) &&
                vld.checkFieldLengths(body, lengths, cb) && // person in question or admin
                vld.chain((!("role" in req.body) || req.body.role == '0') || ssn.isAdmin(), Tags.badValue, ["role"])
                    .chain(!('password' in body) || req.body.oldPassword || ssn.isAdmin(), Tags.noOldPwd) // s
                    .check(!('password' in body) || req.body.password, Tags.badValue, ['password'], cb))
                cnn.chkQry("select * from Person where id = ?", [req.params.id], cb);
        },
        function (foundPrs, fields, cb) {
            if (vld.check(foundPrs.length, Tags.notFound, null, cb) &&
                vld.check(ssn.isAdmin() || !('password' in body)
                    || req.body.oldPassword === foundPrs[0].password, Tags.oldPwdMismatch, null, cb)) {
                delete body.oldPassword;
                cnn.chkQry("update Person set ? where id = ?", [body, req.params.id], cb);
            }
        },
        // updatedResult, fields?, final callback
        function (updRes, fields, cb) {
            res.end();
            cb(null);
        }
    ], (err) => {
        cnn.release();
    });
});
exports.router.get('/:id', function (req, res) {
    console.log("getting Prs by id");
    var vld = req.validator;
    async.waterfall([
        function (cb) {
            if (vld.checkPrsOK(req.params.id, cb))
                req.cnn.chkQry('select * from Person where id = ?', [req.params.id], cb);
        },
        function (prsArr, fields, cb) {
            if (vld.check(prsArr.length, Tags.notFound, null, cb)) {
                delete prsArr[0].password;
                prsArr[0].whenRegistered =
                    prsArr[0].whenRegistered.getTime();
                res.json(prsArr);
                cb(null);
            }
        }
    ], (err) => {
        req.cnn.release();
    });
});
/*
router.get('/:id', function(req: Request, res: Response) {
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
exports.router.delete('/:id', function (req, res) {
    var vld = req.validator;
    async.waterfall([
        function (cb) {
            if (vld.checkAdmin()) {
                Session.removeAllSessions(req.params.id);
                req.cnn.chkQry('DELETE from Person where id = ?', [req.params.id], cb);
            }
        },
        function (result, fields, cb) {
            if (vld.check(result.affectedRows, Tags.notFound, null, cb)) {
                res.end();
                cb(null);
            }
        }
    ], function (err) {
        req.cnn.release();
    });
});
exports.router.get('/:prsId/Msgs', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;
    async.waterfall([
        function (cb) {
            cnn.chkQry("select * from Person where id = ?", [req.params.prsId], cb);
        },
        function (foundPrs, fields, cb) {
            if (foundPrs.length) {
                var orderBy = (req.query.order === 'date' && 'whenMade' ||
                    req.query.order === 'likes' && 'numLikes');
                if (req.query.num && orderBy)
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
                else if (orderBy)
                    cnn.chkQry("select Message.id, cnvId, whenMade, " +
                        "email, content, ifnull(t1.numLikes, 0) as numLikes " +
                        "from Person join Message on Person.id = prsId " +
                        "left join(select Message.id, count( * ) as numLikes " +
                        "from Message join Likes on Message.id = Likes.msgId " +
                        "group by Message.id) as t1 " +
                        "on t1.id = Message.id " +
                        "where prsId = ? " +
                        `order by ${orderBy} desc`, [req.params.prsId], cb);
                else
                    cnn.chkQry("select Message.id, cnvId, whenMade, " +
                        "email, content, ifnull(t1.numLikes, 0) as numLikes " +
                        "from Person join Message on Person.id = prsId " +
                        "left join(select Message.id, count( * ) as numLikes " +
                        "from Message join Likes on Message.id = Likes.msgId " +
                        "group by Message.id) as t1 " +
                        "on t1.id = Message.id " +
                        "where prsId = ?", [req.params.prsId], cb);
            }
        },
        function (resMsg, fields, cb) {
            resMsg.forEach((msg) => msg.whenMade = msg.whenMade.getTime());
            res.json(resMsg);
            cb(null);
        }
    ], (err) => {
        if (!err)
            res.end();
        cnn.release();
    });
});
// module.exports = router;
