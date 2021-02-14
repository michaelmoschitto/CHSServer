var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({ caseSensitive: true });
var async = require('async');
router.baseURL = '/Cnvs';
router.get('/', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    async.waterfall([
        // todo: need to pull last message from messages
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
router.post('/', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    var lengths = {
        'title': 80
    };
    var fieldList = ['title'];
    async.waterfall([
        function (cb) {
            if (vld.hasFields(body, fieldList, cb) &&
                vld.checkFieldLengths(body, lengths, cb) &&
                vld.hasOnlyFields(body, fieldList, cb))
                cnn.chkQry('select * from Conversation where title = ?', body.title, cb);
        },
        // note: using hasFields && hasOnlyFields checks for all fields and gurrantees existence
        function (existingCnv, fields, cb) {
            if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb)) {
                //owned by the current AU 
                body['ownerId'] = req.session.prsId;
                cnn.chkQry("insert into Conversation set ?", body, cb);
            }
        },
        function (insRes, fields, cb) {
            res.location(router.baseURL + '/' + insRes.insertId).end();
            cb();
        }
    ], function () {
        cnn.release();
    });
});
router.get('/:cnvId', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    async.waterfall([
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
router.put('/:cnvId', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    var cnvId = req.params.cnvId;
    var lengths = { 'title': 80 };
    var fieldList = ['title'];
    async.waterfall([
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
router.delete('/:cnvId', function (req, res) {
    var vld = req.validator;
    var cnvId = req.params.cnvId;
    var cnn = req.cnn;
    async.waterfall([
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
router.get('/:cnvId/Msgs', function (req, res) {
    //todo: get msgs by cnv
    // GET dateTime = {dateTime}
    // num = {num}
    // Any AU is acceptable, though some login is required.Return all Messages
    // for the indicated Conversation.Limit this to at most num Messages(
    // if num is provided) posted on or after dateTime(if dateTime is provided).
    // Returnfor each Message, in increasing datetime order, and for same datetimes, in increasing ID order:
    // id Message ID
    // cnvId ID of Conversation to which Message belongs
    // prsId ID of poster
    // whenMade when the Message was made
    // email Email of the poster
    // content Content of the Message
    // numLikes Number of likes
    var vld = req.validator; // Shorthands
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;
    var lengths = {
        'content': 5000
    };
    async.waterfall([
        function (cb) {
            cnn.chkQry("select * from Conversation where id = ?", [req.params.cnvId,], cb);
        },
        function (foundCnvs, fields, cb) {
            // ! Convert CORRECTLY
            var mySQLDate = req.query.dateTime &&
                new Date(parseInt(req.query.dateTime));
            console.log("prequery");
            if (foundCnvs.length) {
                if (req.query.num && req.query.dateTime)
                    cnn.chkQry("select Message.id, cnvId, prsId, whenMade, " +
                        "content, ifnull(t1.numLikes, 0) as numLikes, email " +
                        "from Message join Person on Message.prsId = Person.id " +
                        "left join(select Message.id, count( * ) as numLikes from " +
                        "Message join Likes on Message.id = Likes.msgId group by " +
                        "Message.id) as t1 on t1.id = Message.id " +
                        "where cnvId = ? and whenMade >= ? " +
                        "order by whenMade, Message.id " +
                        "limit ?", [req.params.cnvId, mySQLDate, parseInt(req.query.num)], cb);
                else if (req.query.num)
                    cnn.chkQry("select Message.id, cnvId, prsId, whenMade, " +
                        "content, ifnull(t1.numLikes, 0) as numLikes, email " +
                        "from Message join Person on Message.prsId = Person.id " +
                        "left join(select Message.id, count( * ) as numLikes from " +
                        "Message join Likes on Message.id = Likes.msgId group by " +
                        "Message.id) as t1 on t1.id = Message.id " +
                        "where cnvId = ? order by whenMade, Message.id " +
                        "limit ?", [req.params.cnvId, parseInt(req.query.num)], cb);
                else if (req.query.dateTime)
                    cnn.chkQry('select Message.id, cnvId, prsId, whenMade, ' +
                        'content, ifnull(t1.numLikes, 0) as numLikes, email ' +
                        'from Message join Person on Message.prsId = Person.id ' +
                        'left join(select Message.id, count( * ) as numLikes from ' +
                        'Message join Likes on Message.id = Likes.msgId group by ' +
                        'Message.id) as t1 on t1.id = Message.id ' +
                        'where cnvId = ? and whenMade >= ? order by whenMade, ' +
                        'Message.id', [req.params.cnvId, mySQLDate], cb);
                else
                    cnn.chkQry("select Message.id, cnvId, prsId, whenMade, " +
                        "content, ifnull(t1.numLikes, 0) as numLikes, email " +
                        "from Message join Person on Message.prsId = Person.id " +
                        "left join(select Message.id, count( * ) as numLikes from " +
                        "Message join Likes on Message.id = Likes.msgId group by " +
                        "Message.id) as t1 on t1.id = Message.id " +
                        "where cnvId = ? order by whenMade, Message.id", [req.params.cnvId], cb);
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
router.post('/:cnvId/Msgs', function (req, res) {
    //todo: 
    // * Any AU is acceptable, though some login is required.
    // Add a new Message, stamped with the current AU and date / time.
    // content Content of the Message(5000 char max)
    // id Message ID
    // * cnvId ID of Conversation to which Message belongs
    // * prsId ID of poster
    // * whenMade when the Message was made
    // email Email of the poster
    // content Content of the Message
    // numLikes Number of likes   
    var vld = req.validator; // Shorthands
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;
    var lengths = { 'content': 5000 };
    var lastMessageTime;
    async.waterfall([
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
                console.log("query not found");
                res.status(404).end();
                // ? is this really hackish
                cb(true);
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
module.exports = router;
