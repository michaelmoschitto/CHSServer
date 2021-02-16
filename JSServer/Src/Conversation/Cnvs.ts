'use strict'

// var Express = require('express');
// var Tags = require('../Validator.js').Tags;
// var router = Express.Router({caseSensitive: true});
// var async = require('async');

import { Router } from 'express';
import { waterfall } from 'async';
import { queryCallback, PoolConnection, MysqlError } from 'mysql';
import { Session } from '../Session';
import {Request, Response, Body} from 'express-serve-static-core';
import {Validator} from '../Validator'

// import { queryCallback } from 'mysql';

// router.baseURL = '/Cnvs';

export let router = Router({ caseSensitive: true });
const baseURL = '/Cnvs';
// const Tags = Validator.Tags
const Tags = Validator.Tags;
const maxTitle = 80;
const maxContent = 5000;

// ---------------------------------------------------
// ! Error Catagories:
   // not importing from other files correctly
   //using "as" and casting to library interfaces (Date)
   //dealing with body as ReadableStream<Uint8Array>
   //overloaded waterfall/cb functions
// ---------------------------------------------------

interface Conversation {
   id: number;
   title: string;
   lastMessage: Date | number;
   ownerId: number;
};

interface Message {
   whenMade: Date | number;
   content: string
};




var skipToend = {
       code: "", 
       errno: 0, 
       fatal: true, 
       name: "", 
       message: "" 
   };

router.get('/', function(req: Request, res: Response) {
   var vld: Validator = req.validator;
   var cnn: PoolConnection = req.cnn;

   waterfall([
      function (cb: queryCallback) {
      if(req.session){
         if(req.query.owner)
            req.cnn.chkQry('select distinct Conversation.id, title, ownerId, lastMessage from Conversation where ownerId = ?',
            [req.query.owner], cb);
         else
            req.cnn.chkQry('select distinct Conversation.id, title, ownerId, lastMessage from Conversation left join\
            Message on Conversation.id = cnvId',[], cb);
      }
   },
      function (cnvsRet: Conversation[], fields: any, cb: queryCallback) {

         cnvsRet.forEach((cnvs: Conversation) => cnvs.lastMessage = (cnvs.lastMessage as Date)
          && (cnvs.lastMessage as Date).getTime())
         res.json(cnvsRet);
         cb(null);
   }], 
   function () {
      cnn.release();
   });
     
});

router.post('/', function(req: Request, res: Response) {
   var vld: Validator = req.validator;
   var body: Body = req.body;
   var cnn: PoolConnection = req.cnn;
   var lengths: {'title': number} = {'title' : 80};
   var fieldList: string[] = ['title'];

   waterfall([
      function (cb: queryCallback) {
      if (vld.hasFields(body, fieldList, cb) &&
       vld.checkFieldLengths(body, lengths, cb) &&
       vld.hasOnlyFields(body, fieldList, cb))

         cnn.chkQry('select * from Conversation where title = ?',
          [(body as Body).title], cb);
   },

      function (existingCnv: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb)){
         (body as Body).ownerId = req.session.prsId;
         cnn.chkQry("insert into Conversation set ?", [body], cb);
      }
       
   },
      function (insRes: { insertId: number}, fields: any, cb: queryCallback) {
      res.location(baseURL + '/' + insRes.insertId).end();
      cb(null);
   }],

   function() {
      cnn.release();
   });
});

router.get('/:cnvId', function (req: Request, res: Response) {
   var vld: Validator = req.validator;
   var body: Body = req.body;
   var cnn: PoolConnection = req.cnn;

   waterfall([
      function (cb: queryCallback) {
            if (req.session)
               cnn.chkQry("select Conversation.id, title, ownerId " + 
                     ", whenMade as lastMessage " + 
                     "from Conversation join Message " +
                     "on Conversation.Id = Message.cnvId " + 
                     "where Conversation.id = ? " + 
                     "order by lastMessage desc " + 
                     "limit 1 ", [req.params.cnvId], cb);
         },

      function (foundCnvs: Conversation[], fields: any, cb: queryCallback) {
            if (foundCnvs.length) {
               var found: Conversation = foundCnvs[0];
               foundCnvs[0].lastMessage = found.lastMessage &&
                  (found.lastMessage as Date).getTime();
               res.json(foundCnvs[0]);
            } else {
               res.status(404).end();
            }
            cb(null);
         }
      ],

      (err) => {
         cnn.release();
      });
});

router.put('/:cnvId', function (req: Request, res: Response) {
   var vld: Validator = req.validator;
   var body: Body = req.body;
   var cnn: PoolConnection = req.cnn;
   var cnvId: string = req.params.cnvId;
   var lengths = {'title': 80};
   var fieldList = ['title'];

   waterfall([
      function (cb: queryCallback) {
      if (vld.hasFields(body, fieldList, cb) &&
         vld.checkFieldLengths(body, lengths, cb) &&
         vld.hasOnlyFields(body, fieldList, cb))

            cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
      function (cnvs: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
       vld.checkPrsOK(cnvs[0].ownerId, cb))
         cnn.chkQry('select * from Conversation where id <> ? && title = ?',
          [cnvId, (body as Body).title], cb);
   },
      function (sameTtl: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(!sameTtl.length, Tags.dupTitle, null, cb))
         cnn.chkQry("update Conversation set title = ? where id = ?",
          [(body as Body).title, cnvId], cb);
   },
  
   ],

   function(err) {
      if(!err)
         res.status(200).end();
      cnn.release();
   });
});

router.delete('/:cnvId', function (req: Request, res) {
   var vld: Validator = req.validator;
   var cnvId: string = req.params.cnvId;
   var cnn: PoolConnection = req.cnn;

   waterfall([
      function (cb: queryCallback) {
      if(req.params.cnvId)
         cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },

      function (cnvs: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
       vld.checkPrsOK(cnvs[0].ownerId, cb)){
         cnn.chkQry('delete from Conversation where id = ?', [cnvId], cb);
       }
   }],

   function(err) {
      if (!err)
         res.status(200).end();
      cnn.release();
   });
});

router.get('/:cnvId/Msgs', function(req: Request, res: Response){
   var vld: Validator = req.validator; // Shorthands
   var body: Body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn: PoolConnection = req.cnn;
   var lengths = {
      'content': 5000
   };

   waterfall([
      function(cb: queryCallback){
         cnn.chkQry("select * from Conversation where id = ?", [req.params.cnvId,], cb);
      },

      function (foundCnvs: Conversation[], fields: any, cb: queryCallback) {
         // ! Convert CORRECTLY
         var mySQLDate = req.query.dateTime &&
            new Date(parseInt(req.query.dateTime as string));

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
                  "limit ?",
                  [req.params.cnvId, mySQLDate, parseInt(req.query.num as string)], cb);
            else if (req.query.num)
               cnn.chkQry("select Message.id, prsId, whenMade, " +
                  "content, ifnull(t1.numLikes, 0) as numLikes, email " +
                  "from Message join Person on Message.prsId = Person.id " +
                  "left join(select Message.id, count( * ) as numLikes from " +
                  "Message join Likes on Message.id = Likes.msgId group by " +
                  "Message.id) as t1 on t1.id = Message.id " +
                  "where cnvId = ? order by whenMade, Message.id " +
                  "limit ?",
                  [req.params.cnvId, parseInt(req.query.num as string)], cb);

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
                  "where cnvId = ? order by whenMade, Message.id",
                  [req.params.cnvId], cb);
         } else {
            res.status(404).end();
            cb(skipToend);
         }
      },

      function (resMsg: Message[], fields: any, cb: queryCallback){
            resMsg.forEach((msg) => msg.whenMade = (msg.whenMade as Date).getTime());
            res.json(resMsg);
            cb(null);
      }

   ],
      
      function(err){
         if(!err)
            res.end();
         cnn.release();
      });


});

router.post('/:cnvId/Msgs', function(req: Request, res) {
   var vld = req.validator; // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn: PoolConnection = req.cnn;
   var lengths = {'content' : 5000};
   var lastMessageTime;

   waterfall([
      function (cb: queryCallback) {
         if(req.session && vld.checkFieldLengths(body, lengths, cb)){
            cnn.chkQry("select * from Conversation where id = ?",
             [req.params.cnvId], cb);
         }
      },

      function (resCnvs: Conversation[], fields: any, cb: queryCallback){
         if(resCnvs.length){

            body.cnvId = req.params.cnvId;
            body.prsId = req.session.prsId;
            body.whenMade = new Date();
            body.numLikes = 0;
            lastMessageTime = body.whenMade;

            cnn.chkQry('insert into Message set ?', [body], cb);
            
         }else{
             res.status(404).end();
            cb({code: "", errno: 0, fatal: true, name: "", message: ""});
         }
      },

      function (result: {insertId: number}, fields: any, cb: queryCallback){
         cnn.chkQry('update Conversation set lastMessage = ? where id = ?',
          [body.whenMade, body.cnvId], cb);
         res.location('/Msgs/' + result.insertId).end();
      },


   ], 
      function (err) {
         if (!err)
            res.end();
         cnn.release();
      });
});


module.exports = router;
