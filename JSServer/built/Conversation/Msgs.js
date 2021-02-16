'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const Validator_1 = require("../Validator");
const async_1 = require("async");
// import { Session } from '../Session';
exports.router = express_1.Router({ caseSensitive: true });
const baseURL = '/Msgs';
const Tags = Validator_1.Validator.Tags;
;
;
const skipToend = {
    code: "",
    errno: 0,
    fatal: true,
    name: "",
    message: ""
};
exports.router.get('/:msgId', function (req, res) {
    const vld = req.validator; // Shorthands
    var body = req.body;
    const admin = req.session && req.session.isAdmin();
    const cnn = req.cnn;
    async_1.waterfall([
        function (cb) {
            if (req.session)
                cnn.chkQry('select cnvId, prsId, whenMade,' +
                    'email, content, numLikes, ' +
                    '(select count(*) from Likes where msgId = Message.id) ' +
                    'as numLikes ' +
                    'from Message join Person ' +
                    'on prsId = Person.id where Message.id = ?', [parseInt(req.params.msgId)], cb);
        },
        function (foundMsg, fields, cb) {
            if (foundMsg.length) {
                foundMsg[0].whenMade = foundMsg[0].whenMade &&
                    foundMsg[0].whenMade.getTime();
                res.json(foundMsg[0]);
            }
            else
                res.status(404).end();
            cb(null);
        }
    ], (err) => {
        if (!err)
            res.end();
        cnn.release();
    });
});
exports.router.get('/:msgId/Likes', function (req, res) {
    const vld = req.validator;
    var body = req.body;
    const cnn = req.cnn;
    async_1.waterfall([
        function (cb) {
            cnn.chkQry("select * from Message where id = ?", [req.params.msgId], cb);
        },
        function (foundMsg, fields, cb) {
            if (foundMsg.length) {
                if (req.query.num)
                    cnn.chkQry("select Likes.id, Likes.prsId, firstName, " +
                        "lastName from Likes join Person on prsId = Person.id " +
                        "where msgId = ? order by lastName, firstName limit ?", [req.params.msgId, parseInt(req.query.num)], cb);
                else
                    cnn.chkQry("select Likes.id, Likes.prsId, firstName, " +
                        "lastName from Likes join Person on prsId = Person.id " +
                        "where msgId = ? order by lastName, firstName", [req.params.msgId], cb);
            }
            else {
                res.status(404).end();
                cb(skipToend);
            }
        },
        function (result, fields, cb) {
            res.json(result);
            cb(null);
        }
    ], (err) => {
        if (!err)
            res.end();
        cnn.release();
    });
});
exports.router.post('/:msgId/Likes', function (req, res) {
    const vld = req.validator;
    var body = req.body;
    const cnn = req.cnn;
    var cnvsId;
    var locId;
    async_1.waterfall([
        function (cb) {
            cnn.chkQry("select * from Message where id = ?", [req.params.msgId], cb);
        },
        function (foundMsg, fields, cb) {
            if (foundMsg.length) {
                cnvsId = foundMsg[0].cnvId;
                cnn.chkQry("select * from Likes where msgId = ? and prsId = ?", [req.params.msgId, req.session.prsId], cb);
            }
            else {
                res.status(404).end();
                cb(skipToend);
            }
        },
        function (foundLike, fields, cb) {
            if (vld.check(!foundLike.length, Tags.dupLike, null, null)) {
                var content = {
                    "msgId": req.params.msgId,
                    "prsId": req.session.prsId
                };
                cnn.chkQry("insert into Likes set ?", [content], cb);
            }
            else
                cb(skipToend);
        },
        function (result, fields, cb) {
            if (result.affectedRows > 0) {
                locId = result.insertId;
                cnn.chkQry("update Message set " +
                    "numLikes = NumLikes + 1 " +
                    "where id = ?", [req.params.msgId], cb);
            }
            else {
                cb(skipToend);
            }
        },
        function (result, fields, cb) {
            res.location(baseURL + '/' + req.params.msgId +
                '/Likes/' + locId).end();
            cb(null);
        }
    ], (err) => {
        if (!err)
            res.end();
        cnn.release();
    });
});
module.exports = exports.router;
