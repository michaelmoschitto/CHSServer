"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsnRouter = void 0;
const express_1 = require("express");
// var Tags = require('../Validator.js').Tags;
const Validator_1 = require("../Validator");
var { Session, router } = require('../Session.js');
var async = require('async');
exports.SsnRouter = express_1.Router({ caseSensitive: true });
const baseURL = '/Ssns';
const Tags = Validator_1.Validator.Tags;
exports.SsnRouter.get('/', function (req, res) {
    console.log("Getting all sessions");
    var body = [], ssn;
    if (req.validator.checkAdmin()) {
        Session.getAllIds().forEach(id => {
            ssn = Session.findById(id);
            body.push({ id: ssn.id, prsId: ssn.prsId, loginTime: ssn.loginTime });
        });
        res.json(body).end();
    }
    else
        res.status(403).end();
    // * IMPORTANT
    req.cnn.release();
});
exports.SsnRouter.post('/', function (req, res) {
    var ssn;
    var cnn = req.cnn;
    // console.log(cnn.chkQry);
    cnn.chkQry('select * from Person where email = ?', [req.body.email], function (err, result) {
        if (req.validator.check(result.length && result[0].password ===
            req.body.password, Tags.badLogin)) {
            ssn = new Session(result[0], res);
            req.session = ssn;
            res.location(baseURL + '/' + ssn.id).end();
        }
        cnn.release();
    });
});
exports.SsnRouter.delete('/:id', function (req, res) {
    var vld = req.validator;
    var prsId = Session.findById(req.params.id) &&
        Session.findById(req.params.id).prsId;
    // ! need to get correct session to logout
    // * need to find prsId that req.params.id belongs to
    if (Session.findById(req.params.id) && vld.checkPrsOK(prsId)) {
        req.session.logOut(req.params.id);
        res.end();
    }
    else
        res.status(404).end();
    req.cnn.release();
    // console.log(req.session.getAllIds())
});
exports.SsnRouter.get('/:id', function (req, res) {
    var vld = req.validator;
    console.log(req.params);
    var ssn = Session.findById(req.params.id);
    var prsId = Session.findById(req.params.id) &&
        Session.findById(req.params.id).prsId;
    if (ssn && vld.checkPrsOK(prsId)) {
        res.json({ id: ssn.id, prsId: ssn.prsId, loginTime: ssn.loginTime });
    }
    else {
        res.status(404).end();
    }
    req.cnn.release();
});
// module.exports = SsnRouter;
