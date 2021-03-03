'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsnRouter = void 0;
const express_1 = require("express");
const Validator_1 = require("../Validator");
const Session_1 = require("../Session");
exports.SsnRouter = express_1.Router({ caseSensitive: true });
const baseURL = '/Ssns';
const Tags = Validator_1.Validator.Tags;
exports.SsnRouter.get('/', function (req, res) {
    var sessionArr = [];
    var ssn;
    if (req.validator.checkAdmin()) {
        Session_1.Session.getAllIds().forEach((id) => {
            ssn = Session_1.Session.findById(id);
            sessionArr.push({ id: ssn.id, prsId: ssn.prsId,
                loginTime: ssn.loginTime,
            });
        });
        res.json(sessionArr).end();
    }
    else
        res.status(403).end();
    req.cnn.release();
});
exports.SsnRouter.post('/', function (req, res) {
    var ssn;
    const cnn = req.cnn;
    cnn.chkQry('select * from Person where email = ?', [req.body.email], function (err, result) {
        if (req.validator.check(result.length && result[0].password === req.body.password, Tags.badLogin, null, null)) {
            ssn = new Session_1.Session(result[0], res);
            req.session = ssn;
            res.location(baseURL + '/' + ssn.id).end();
        }
        cnn.release();
    });
});
exports.SsnRouter.delete('/:id', function (req, res) {
    var vld = req.validator;
    var prsId = Session_1.Session.findById(req.params.id) && Session_1.Session.findById(req.params.id).prsId;
    if (Session_1.Session.findById(req.params.id) && vld.checkPrsOK(prsId, null)) {
        req.session.logOut(parseInt(req.params.id));
        res.end();
    }
    else
        res.status(404).end();
    req.cnn.release();
});
exports.SsnRouter.get('/:id', function (req, res) {
    var vld = req.validator;
    var ssn = Session_1.Session.findById(req.params.id);
    var prsId = Session_1.Session.findById(req.params.id) && Session_1.Session.findById(req.params.id).prsId;
    if (ssn && vld.checkPrsOK(prsId, null)) {
        res.json({ id: ssn.id, prsId: ssn.prsId, loginTime: ssn.loginTime });
    }
    else
        res.status(404).end();
    req.cnn.release();
});
