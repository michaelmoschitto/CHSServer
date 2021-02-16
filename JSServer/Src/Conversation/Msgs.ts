'use strict'

var Express = require('express');
// var Tags = require('../Validator.js').Tags;
import {Validator} from '../Validator'
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Msgs';
const Tags = Validator.Tags;


router.get('/:msgId', function(req, res){
    var vld = req.validator; // Shorthands
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;

    async.waterfall([
        function(cb){
            if(req.session)
                cnn.chkQry('select cnvId, prsId, whenMade,' +
                'email, content, numLikes, ' +
                '(select count(*) from Likes where msgId = Message.id) ' + 
                'as numLikes ' + 
                'from Message join Person ' +  
                'on prsId = Person.id where Message.id = ?',
                 [parseInt(req.params.msgId)], cb)
        },

        function(foundMsg, fields, cb){
            if(foundMsg.length){
                foundMsg[0].whenMade = foundMsg[0].whenMade && 
                foundMsg[0].whenMade.getTime();

                res.json(foundMsg[0]);
            }else  
                res.status(404).end();
            cb();
        }
    ],
    (err) => {
        if(!err)
            res.end();
        cnn.release();
    });
});

router.get('/:msgId/Likes', function(req, res){
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;

    async.waterfall([
            function (cb) {
                cnn.chkQry("select * from Message where id = ?", [req.params.msgId], cb)
            },
            function (foundMsg, fields, cb) {
                if (foundMsg.length) {
                    if (req.query.num)
                        cnn.chkQry("select Likes.id, Likes.prsId, firstName, " +
                            "lastName from Likes join Person on prsId = Person.id " +
                            "where msgId = ? order by lastName, firstName limit ?",
                            [req.params.msgId, parseInt(req.query.num)], cb);
                    else
                        cnn.chkQry("select Likes.id, Likes.prsId, firstName, " +
                            "lastName from Likes join Person on prsId = Person.id " +
                            "where msgId = ? order by lastName, firstName",
                            [req.params.msgId], cb);
                } else {
                    res.status(404).end();
                    cb(true);
                }
            },

            function (result, fields, cb) {
                // resMsg.forEach((msg) => msg.whenMade = msg.whenMade.getTime());
                res.json(result);
                cb();
            }
 
        ],

        (err) => {
            if (!err)
                res.end();
            cnn.release();
        });
});

router.post('/:msgId/Likes', function(req, res){
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    var cnvsId;
    var locId;

    async.waterfall([
        function(cb){
                cnn.chkQry("select * from Message where id = ?", [req.params.msgId], cb)
        },

        function(foundMsg, fields, cb) {
            if (foundMsg.length) {
                cnvsId = foundMsg[0].cnvId;
                cnn.chkQry("select * from Likes where msgId = ? and prsId = ?",
                 [req.params.msgId, req.session.prsId], cb);
            }else{
                res.status(404).end();
                cb(true);
            }
                
        },

        function(foundLike, fields, cb){
            if(vld.check(!foundLike.length, Tags.dupLike, null)){
                var content = {"msgId" : req.params.msgId, "prsId": req.session.prsId}
                cnn.chkQry("insert into Likes set ?",[content], cb);
            }else
                cb(true);
        },

        function(result, fields, cb){
            if(result.affectedRows > 0){
                locId = result.insertId;
                cnn.chkQry("update Message set " +
                "numLikes = NumLikes + 1 " + 
                "where id = ?", [req.params.msgId], cb);
            }else{
                cb(true);
            }
        },

        function(result, fields, cb){
            res.location(router.baseURL + '/' + req.params.msgId + '/Likes/' + locId).end();
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

