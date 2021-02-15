'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
// var Express = require('express');
const express_1 = require("express");
const Validator_1 = require("../Validator");
const async_1 = require("async");
exports.router = express_1.Router({ caseSensitive: true });
const baseURL = '/Cnvs';
const Tags = Validator_1.Validator.Tags;
const maxTitle = 80;
const maxContent = 5000;
;
exports.router.get('/', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    async_1.waterfall([
        // todo: need to pull last message from messages
        function (cb) {
            if (req.session) {
                if (req.query.owner)
                    req.cnn.chkQry('select Conversation.id, title, ownerId,\ lastMessage from Conversation where ownerId = ?', [req.query.owner], cb);
                else
                    req.cnn.chkQry('select Conversation.id, title, ownerId,\  lastMessage  from Conversation join\
             Message on Conversation.id = cnvId', [], cb);
            }
        },
        function (cnvsRet, fields, cb) {
            res.json(cnvsRet);
            cb();
        }
    ], function () {
        cnn.release();
    });
    // if(){
    // };
    // req.cnn.chkQry('select id, title from Conversation', null,
    // function(err, cnvs) {
    //    if (!err)
    //       res.json(cnvs);
    //    req.cnn.release();
    // });
});
exports.router.post('/', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    var lengths = { 'title': maxTitle };
    var fieldList = ['title'];
    async_1.waterfall([
        function (cb) {
            if (vld.hasFields(body, fieldList, cb) &&
                vld.checkFieldLengths(body, lengths, cb) &&
                vld.hasOnlyFields(body, fieldList, cb))
                cnn.chkQry('select * from Conversation where title = ?', [body.title], cb);
        },
        // note: using hasFields && hasOnlyFields checks for all fields and gurrantees existence
        function (existingCnv, fields, cb) {
            if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb)) {
                //owned by the current AU 
                body['ownerId'] = req.session.prsId;
                cnn.chkQry("insert into Conversation set ?", [body], cb);
            }
        },
        function (insRes, fields, cb) {
            res.location(exports.router.baseURL + '/' + insRes.insertId).end();
            cb();
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
                // * lastMessage here is fine becuase we can limit to 1
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
                foundCnvs[0].lastMessage = foundCnvs[0].lastMessage &&
                    foundCnvs[0].lastMessage.getTime();
                res.json(foundCnvs[0]);
            }
            else {
                res.status(404).end();
            }
            cb();
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
    var lengths = { 'title': maxTitle };
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
            if (vld.check(!sameTtl.length, Tags.dupTitle, cb))
                cnn.chkQry("update Conversation set title = ? where id = ?", [body.title, cnvId], cb);
            // cb();
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
    //todo: get msgs by cnv
    // GET dateTime = {dateTime}
    // num = {num}
    var vld = req.validator; // Shorthands
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;
    var lengths = { 'content': maxContent };
    async_1.waterfall([
        function (cb) {
            cnn.chkQry("select * from Conversation where id = ?", [req.params.cnvId,], cb);
        },
        function (foundCnvs, fields, cb) {
            if (foundCnvs.length) {
                if (req.query.num && req.query.dateTime)
                    cnn.chkQry("select Message.id, cnvId, prsId, whenMade, content, numLikes, email" +
                        "from Message join Person on Message.prsId = Person.id " +
                        "where cnvId = ? and whenMade >= ? " +
                        "order by whenMade, Message.id " +
                        "limit ? ", [req.params.cnvId, req.query.dateTime,
                        parseInt(req.query.num)], cb);
                else if (req.query.num)
                    cnn.chkQry("select Message.id, cnvId, prsId, whenMade, content, numLikes, email\
                  from Message join Person on Message.prsId = Person.id where cnvId = ? order by whenMade, Message.id\
                  limit ?", [req.params.cnvId, parseInt(req.query.num)], cb);
                else if (req.query.dateTime)
                    cnn.chkQry("select Message.id, cnvId, prsId, whenMade, content, numLikes, email\
               from Message join Person on Message.prsId = Person.id where cnvId = ? and whenMade >= ? order by whenMade,\ Message.id", [req.params.cnvId, req.query.dateTime], cb);
                else
                    cnn.chkQry("select Message.id, cnvId, prsId, whenMade, content, numLikes, email\
               from Message join Person on Message.prsId = Person.id where cnvId = ? order by whenMade, Message.id", [req.params.cnvId], cb);
            }
            else {
                res.status(404).end();
                cb(true);
            }
        },
        function (resMsg, fields, cb) {
            resMsg.forEach((msg) => msg.whenMade = msg.whenMade.getTime());
            res.json(resMsg);
            cb();
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
    var cnn = req.cnn;
    var lengths = { 'content': maxContent };
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
                cnn.chkQry('insert into Message set ?', [body], cb);
            }
            else {
                res.status(404).end();
                // ? is this really hackish
                cb(true);
            }
        },
        function (result, fields, cb) {
            res.location('/Msgs/' + result.insertId).end();
            cb();
        }
    ], function (err) {
        if (!err)
            res.end();
        cnn.release();
    });
});
module.exports = exports.router;
