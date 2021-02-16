'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
// var Express = require('express');
// var Tags = require('../Validator.js').Tags;
// var router = Express.Router({caseSensitive: true});
// var async = require('async');
const express_1 = require("express");
const async_1 = require("async");
const Validator_1 = require("../Validator");
// import { queryCallback } from 'mysql';
// router.baseURL = '/Cnvs';
exports.router = express_1.Router({ caseSensitive: true });
const baseURL = '/Cnvs';
// const Tags = Validator.Tags
const Tags = Validator_1.Validator.Tags;
const maxTitle = 80;
const maxContent = 5000;
;
;
const skipToend = {
    code: "",
    errno: 0,
    fatal: true,
    name: "",
    message: ""
};
exports.router.get('/', function (req, res) {
    var vld = req.validator;
    var cnn = req.cnn;
    async_1.waterfall([
        function (cb) {
            if (req.session) {
                if (req.query.owner)
                    req.cnn.chkQry('select distinct Conversation.id, title, ownerId, lastMessage from Conversation where ownerId = ?', [req.query.owner], cb);
                else
                    req.cnn.chkQry('select distinct Conversation.id, title, ownerId, lastMessage from Conversation left join\
            Message on Conversation.id = cnvId', [], cb);
            }
        },
        function (cnvsRet, fields, cb) {
            cnvsRet.forEach((cnvs) => cnvs.lastMessage = cnvs.lastMessage
                && cnvs.lastMessage.getTime());
            res.json(cnvsRet);
            cb(null);
        }
    ], function () {
        cnn.release();
    });
});
exports.router.post('/', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    var lengths = { 'title': 80 };
    var fieldList = ['title'];
    async_1.waterfall([
        function (cb) {
            if (vld.hasFields(body, fieldList, cb) &&
                vld.checkFieldLengths(body, lengths, cb) &&
                vld.hasOnlyFields(body, fieldList, cb))
                cnn.chkQry('select * from Conversation where title = ?', [body.title], cb);
        },
        function (existingCnv, fields, cb) {
            if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb)) {
                body.ownerId = req.session.prsId;
                cnn.chkQry("insert into Conversation set ?", [body], cb);
            }
        },
        function (insRes, fields, cb) {
            res.location(baseURL + '/' + insRes.insertId).end();
            cb(null);
        }
    ], function () {
        cnn.release();
    });
});
exports.router.get('/:cnvId', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    async_1.waterfall([
        function (cb) {
            if (req.session)
                cnn.chkQry("select Conversation.id, title, ownerId " +
                    ", whenMade as lastMessage " +
                    "from Conversation join Message " +
                    "on Conversation.Id = Message.cnvId " +
                    "where Conversation.id = ? " +
                    "order by lastMessage desc " +
                    "limit 1 ", [req.params.cnvId], cb);
        },
        function (foundCnvs, fields, cb) {
            if (foundCnvs.length) {
                var found = foundCnvs[0];
                foundCnvs[0].lastMessage = found.lastMessage &&
                    found.lastMessage.getTime();
                res.json(foundCnvs[0]);
            }
            else {
                res.status(404).end();
            }
            cb(null);
        }
    ], (err) => {
        cnn.release();
    });
});
exports.router.put('/:cnvId', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    var cnvId = req.params.cnvId;
    var lengths = { 'title': 80 };
    var fieldList = ['title'];
    async_1.waterfall([
        function (cb) {
            if (vld.hasFields(body, fieldList, cb) &&
                vld.checkFieldLengths(body, lengths, cb) &&
                vld.hasOnlyFields(body, fieldList, cb))
                cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
        },
        function (cnvs, fields, cb) {
            if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
                vld.checkPrsOK(cnvs[0].ownerId, cb))
                cnn.chkQry('select * from Conversation where id <> ? && title = ?', [cnvId, body.title], cb);
        },
        function (sameTtl, fields, cb) {
            if (vld.check(!sameTtl.length, Tags.dupTitle, null, cb))
                cnn.chkQry("update Conversation set title = ? where id = ?", [body.title, cnvId], cb);
        },
    ], function (err) {
        if (!err)
            res.status(200).end();
        cnn.release();
    });
});
exports.router.delete('/:cnvId', function (req, res) {
    var vld = req.validator;
    var cnvId = req.params.cnvId;
    var cnn = req.cnn;
    async_1.waterfall([
        function (cb) {
            if (req.params.cnvId)
                cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
        },
        function (cnvs, fields, cb) {
            if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
                vld.checkPrsOK(cnvs[0].ownerId, cb)) {
                cnn.chkQry('delete from Conversation where id = ?', [cnvId], cb);
            }
        }
    ], function (err) {
        if (!err)
            res.status(200).end();
        cnn.release();
    });
});
exports.router.get('/:cnvId/Msgs', function (req, res) {
    var vld = req.validator; // Shorthands
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;
    var lengths = {
        'content': 5000
    };
    async_1.waterfall([
        function (cb) {
            cnn.chkQry("select * from Conversation where id = ?", [req.params.cnvId,], cb);
        },
        function (foundCnvs, fields, cb) {
            // ! Convert CORRECTLY
            var mySQLDate = req.query.dateTime &&
                new Date(parseInt(req.query.dateTime));
            if (foundCnvs.length) {
                if (req.query.num && req.query.dateTime)
                    cnn.chkQry("select Message.id, prsId, whenMade, " +
                        "content, ifnull(t1.numLikes, 0) as numLikes, email " +
                        "from Message join Person on Message.prsId = Person.id " +
                        "left join(select Message.id, count( * ) as numLikes from " +
                        "Message join Likes on Message.id = Likes.msgId group by " +
                        "Message.id) as t1 on t1.id = Message.id " +
                        "where cnvId = ? and whenMade >= ? " +
                        "order by whenMade, Message.id " +
                        "limit ?", [req.params.cnvId, mySQLDate, parseInt(req.query.num)], cb);
                else if (req.query.num)
                    cnn.chkQry("select Message.id, prsId, whenMade, " +
                        "content, ifnull(t1.numLikes, 0) as numLikes, email " +
                        "from Message join Person on Message.prsId = Person.id " +
                        "left join(select Message.id, count( * ) as numLikes from " +
                        "Message join Likes on Message.id = Likes.msgId group by " +
                        "Message.id) as t1 on t1.id = Message.id " +
                        "where cnvId = ? order by whenMade, Message.id " +
                        "limit ?", [req.params.cnvId, parseInt(req.query.num)], cb);
                else if (req.query.dateTime)
                    cnn.chkQry('select Message.id, prsId, whenMade, ' +
                        'content, ifnull(t1.numLikes, 0) as numLikes, email ' +
                        'from Message join Person on Message.prsId = Person.id ' +
                        'left join(select Message.id, count( * ) as numLikes from ' +
                        'Message join Likes on Message.id = Likes.msgId group by ' +
                        'Message.id) as t1 on t1.id = Message.id ' +
                        'where cnvId = ? and whenMade >= ? order by whenMade, ' +
                        'Message.id', [req.params.cnvId, mySQLDate], cb);
                else
                    cnn.chkQry("select Message.id, prsId, whenMade, " +
                        "content, ifnull(t1.numLikes, 0) as numLikes, email " +
                        "from Message join Person on Message.prsId = Person.id " +
                        "left join(select Message.id, count( * ) as numLikes from " +
                        "Message join Likes on Message.id = Likes.msgId group by " +
                        "Message.id) as t1 on t1.id = Message.id " +
                        "where cnvId = ? order by whenMade, Message.id", [req.params.cnvId], cb);
            }
            else {
                res.status(404).end();
                cb(skipToend);
            }
        },
        function (resMsg, fields, cb) {
            resMsg.forEach((msg) => msg.whenMade = msg.whenMade.getTime());
            res.json(resMsg);
            cb(null);
        }
    ], function (err) {
        if (!err)
            res.end();
        cnn.release();
    });
});
exports.router.post('/:cnvId/Msgs', function (req, res) {
    var vld = req.validator; // Shorthands
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;
    var lengths = { 'content': 5000 };
    var lastMessageTime;
    async_1.waterfall([
        function (cb) {
            if (req.session && vld.checkFieldLengths(body, lengths, cb)) {
                cnn.chkQry("select * from Conversation where id = ?", [req.params.cnvId], cb);
            }
        },
        function (resCnvs, fields, cb) {
            if (resCnvs.length) {
                body.cnvId = req.params.cnvId;
                body.prsId = req.session.prsId;
                body.whenMade = new Date();
                body.numLikes = 0;
                lastMessageTime = body.whenMade;
                cnn.chkQry('insert into Message set ?', [body], cb);
            }
            else {
                res.status(404).end();
                cb({ code: "", errno: 0, fatal: true, name: "", message: "" });
            }
        },
        function (result, fields, cb) {
            cnn.chkQry('update Conversation set lastMessage = ? where id = ?', [body.whenMade, body.cnvId], cb);
            res.location('/Msgs/' + result.insertId).end();
        },
    ], function (err) {
        if (!err)
            res.end();
        cnn.release();
    });
});
module.exports = exports.router;
