'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const Validator_1 = require("../Validator");
var async = require('async');
var mysql = require('mysql');
const Session_1 = require("../Session");
const express_1 = require("express");
exports.router = express_1.Router({ caseSensitive: true });
const baseURL = '/Prss';
const Tags = Validator_1.Validator.Tags;
const skipToEnd = {
    code: '',
    errno: 0,
    fatal: true,
    name: '',
    message: '',
};
exports.router.get('/', function (req, res) {
    var email = (req.session.isAdmin() && req.query.email) ||
        (!req.session.isAdmin() && req.session.email);
    var handler = function (err, prsArr, fields) {
        if (req.query.email &&
            prsArr[0] &&
            prsArr[0]['email'] &&
            !prsArr[0]['email']
                .split('@')[0]
                .includes(req.query.email) &&
            prsArr[0]['email'] !== req.query.email)
            res.json([]);
        else
            res.json(prsArr);
        req.cnn.release();
    };
    if (email)
        req.cnn.chkQry('select id, email from Person where email like ?', ['%' + email + '%'], handler);
    else
        req.cnn.chkQry('select id, email from Person', null, handler);
});
exports.router.post('/', function (req, res) {
    const vld = req.validator; // Shorthands
    var body = req.body;
    const admin = req.session && req.session.isAdmin();
    const cnn = req.cnn;
    if (admin && !body.password)
        body.password = '*'; // Blocking password
    body.whenRegistered = new Date();
    const lengths = {
        firstName: 30,
        lastName: 50,
        password: 50,
        oldPassword: 50,
        email: 150,
    };
    const fields = ['email', 'password', 'role', 'lastName'];
    async.waterfall([
        function (cb) {
            // Check properties and search for Email duplicates
            if (vld.hasFields(body, fields, cb) &&
                vld.chain(body.email.length > 0, Tags.missingField, ['email'])
                    .chain(body.lastName.length > 0, Tags.missingField, ['lastName'])
                    .chain(body.termsAccepted || admin, Tags.noTerms, null)
                    .chain(body.password.length > 0, Tags.missingField, ['password'])
                    .chain(typeof body.role === 'number' || body.role != '', Tags.missingField, ['role'])
                    .chain(body.role === 0 || admin, Tags.forbiddenRole, null)
                    .check(body.role <= 1 && body.role >= 0, Tags.badValue, ['role'], cb) &&
                vld.checkFieldLengths(body, lengths, cb)) {
                cnn.chkQry('select * from Person where email = ?', [body.email], cb);
            }
        },
        function (existingPrss, fields, cb) {
            // If no dups, insert new Person
            if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
                body.termsAccepted = body.termsAccepted && new Date();
                cnn.chkQry('insert into Person set ?', [body], cb);
            }
        },
        function (result, fields, cb) {
            // Return location of inserted Person
            res.location(baseURL + '/' + result.insertId).end();
            cb(null);
        },
    ], function (err) {
        cnn.release();
    });
});
exports.router.put('/:id', function (req, res) {
    const vld = req.validator;
    const ssn = req.session;
    var body = req.body;
    const cnn = req.cnn;
    const fields = ['firstName', 'lastName', 'password', 'oldPassword', 'role'];
    const lengths = {
        firstName: 30,
        lastName: 50,
        password: 50,
        oldPassword: 50,
    };
    async.waterfall([
        function (cb) {
            if (Object.keys(body).length === 0) {
                res.end();
                cb(skipToEnd);
            }
            else if (vld.checkPrsOK(req.params.id, cb) &&
                vld.hasOnlyFieldsChained(body, fields, cb)
                    .checkFieldLengthsChained(body, lengths, cb) // person in question or admin
                    .chain((!body.hasOwnProperty('role') || (req.body.role === 1 &&
                    ssn.isAdmin()) || req.body.role === 0), Tags.badValue, ['role'])
                    .check(!body.hasOwnProperty('password') ||
                    req.body.oldPassword || ssn.isAdmin(), Tags.noOldPwd, null, cb)) {
                cnn.chkQry('select * from Person where id = ?', [req.params.id], cb);
            }
        },
        function (foundPrs, fields, cb) {
            if (foundPrs.length) {
                if (vld.check(!('password' in body) || ssn.isAdmin() ||
                    req.body.oldPassword === foundPrs[0].password, Tags.oldPwdMismatch, null, cb)) {
                    delete body.oldPassword;
                    cnn.chkQry('update Person set ? where id = ?', [body, req.params.id], cb);
                }
            }
            else {
                res.status(404).end();
                cb(skipToEnd);
            }
        },
        // updatedResult, fields?, final callback
        function (updRes, fields, cb) {
            res.end();
            cb(null);
        },
    ], (err) => {
        cnn.release();
    });
});
exports.router.get('/:id', function (req, res) {
    console.log('getting Prs by id');
    var vld = req.validator;
    async.waterfall([
        function (cb) {
            if (vld.checkPrsOK(req.params.id, cb))
                req.cnn.chkQry('select * from Person where id = ?', [req.params.id], cb);
        },
        function (prsArr, fields, cb) {
            if (prsArr.length) {
                delete prsArr[0].password;
                prsArr[0].whenRegistered =
                    prsArr[0].whenRegistered.getTime();
                res.json(prsArr);
                cb(null);
            }
            else {
                res.status(404).end();
                cb(skipToEnd);
            }
        },
    ], (err) => {
        req.cnn.release();
    });
});
exports.router.delete('/:id', function (req, res) {
    var vld = req.validator;
    async.waterfall([
        function (cb) {
            if (vld.checkAdmin(cb)) {
                Session_1.Session.removeAllSessions(req.params.id);
                req.cnn.chkQry('DELETE from Person where id = ?', [req.params.id], cb);
            }
        },
        function (result, fields, cb) {
            if (result.affectedRows)
                res.end();
            else
                res.status(404).end();
            cb(null);
        },
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
            cnn.chkQry('select * from Person where id = ?', [req.params.prsId], cb);
        },
        function (foundPrs, fields, cb) {
            if (foundPrs.length) {
                var orderBy = (req.query.order === 'date' && 'whenMade') ||
                    (req.query.order === 'likes' && 'numLikes');
                if (req.query.num && orderBy)
                    cnn.chkQry('select Message.id, cnvId, whenMade, ' +
                        'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
                        'from Person join Message on Person.id = prsId  ' +
                        'left join(select Message.id, count( * ) as numLikes ' +
                        'from Message join Likes on Message.id = Likes.msgId ' +
                        'group by Message.id) as t1 ' +
                        'on t1.id = Message.id ' +
                        'where prsId = ? ' +
                        `order by ${orderBy} desc ` +
                        'limit ?', [req.params.prsId, parseInt(req.query.num)], cb);
                else if (req.query.num)
                    cnn.chkQry('select Message.id, cnvId, whenMade, ' +
                        'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
                        'from Person join Message on Person.id = prsId  ' +
                        'left join(select Message.id, count( * ) as numLikes ' +
                        'from Message join Likes on Message.id = Likes.msgId ' +
                        'group by Message.id) as t1 ' +
                        'on t1.id = Message.id ' +
                        'where prsId = ? ' +
                        'limit ?', [req.params.prsId, parseInt(req.query.num)], cb);
                else if (orderBy)
                    cnn.chkQry('select Message.id, cnvId, whenMade, ' +
                        'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
                        'from Person join Message on Person.id = prsId ' +
                        'left join(select Message.id, count( * ) as numLikes ' +
                        'from Message join Likes on Message.id = Likes.msgId ' +
                        'group by Message.id) as t1 ' +
                        'on t1.id = Message.id ' +
                        'where prsId = ? ' +
                        `order by ${orderBy} desc`, [req.params.prsId], cb);
                else
                    cnn.chkQry('select Message.id, cnvId, whenMade, ' +
                        'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
                        'from Person join Message on Person.id = prsId ' +
                        'left join(select Message.id, count( * ) as numLikes ' +
                        'from Message join Likes on Message.id = Likes.msgId ' +
                        'group by Message.id) as t1 ' +
                        'on t1.id = Message.id ' +
                        'where prsId = ?', [req.params.prsId], cb);
            }
        },
        function (resMsg, fields, cb) {
            resMsg.forEach(msg => (msg.whenMade = msg.whenMade.getTime()));
            res.json(resMsg);
            cb(null);
        },
    ], (err) => {
        if (!err)
            res.end();
        cnn.release();
    });
});
