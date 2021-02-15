'use strict'

// var Express = require('express');
import { Router } from 'express';
import { Validator } from '../Validator';
import { waterfall } from 'async';
import { queryCallback, PoolConnection } from 'mysql';
import {Session} from '../Session';

export let router = Router({ caseSensitive: true });


const baseURL = '/Cnvs';
const Tags = Validator.Tags
const maxTitle = 80;
const maxContent = 5000;

interface Conversation {
   id: number;
   title: string;
   lastMessage: Date | number;
   ownerId: number;
};

interface Message {
   whenMade: Date | number;
   content: string
}

interface request extends Request {
   validator: Validator;
   cnn: PoolConnection;
   session?: Session | null;
   query?: any | null;
}

router.get('/', function(req: request, res: Response){
   var vld: Validator = req.validator;
   var body = req.body;
   var cnn: PoolConnection = req.cnn;


   waterfall([
      // todo: need to pull last message from messages
   function (cb: queryCallback) {
      if(req.session){
         if(req.query.owner)
            req.cnn.chkQry('select Conversation.id, title, ownerId,\ lastMessage from Conversation where ownerId = ?',
             [req.query.owner], cb);
         else
            req.cnn.chkQry('select Conversation.id, title, ownerId,\  lastMessage  from Conversation join\
             Message on Conversation.id = cnvId',[], cb);
      }
   },
   function (cnvsRet: Conversation[], fields: any, cb: queryCallback) {
         res.json(cnvsRet);
         cb();
   }], 
   function () {
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


router.post('/', function(req: request, res: Response) {
   var vld: Validator = req.validator;
   var body: ReadableStream<Uint8Array> | null = req.body;
   var cnn: PoolConnection = req.cnn;
   var lengths = {'title' : maxTitle};

   var fieldList: String[] = ['title'];

   waterfall([
   function(cb: queryCallback) {
      if (vld.hasFields(body, fieldList, cb) &&
       vld.checkFieldLengths(body, lengths, cb) &&
       vld.hasOnlyFields(body, fieldList, cb))
         cnn.chkQry('select * from Conversation where title = ?', [body.title], cb);
   },

   // note: using hasFields && hasOnlyFields checks for all fields and gurrantees existence
   function(existingCnv: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb)){
         
         //owned by the current AU 
         body['ownerId'] = req.session.prsId;
         cnn.chkQry("insert into Conversation set ?", [body], cb);
      }
       
   },
   function(insRes: {insertId: number}, fields: any, cb: queryCallback) {
      res.location(router.baseURL + '/' + insRes.insertId).end();
      cb();
   }],

   function() {
      cnn.release();
   });
});

router.get('/:cnvId', function (req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;

   waterfall([
         function (cb: queryCallback) {
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

      function (foundCnvs: Conversation[], fields: any, cb: queryCallback) {
            if (foundCnvs.length) {
               foundCnvs[0].lastMessage = foundCnvs[0].lastMessage &&
                  foundCnvs[0].lastMessage.getTime();
               res.json(foundCnvs[0]);
            } else {
               res.status(404).end();
            }
            cb();
         }
      ],

      (err) => {
         cnn.release();
      });
});


router.put('/:cnvId', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;
   var cnvId = req.params.cnvId;

   var lengths = {'title': maxTitle};
   var fieldList = ['title'];

   waterfall([
   function(cb: queryCallback) {
      if (vld.hasFields(body, fieldList, cb) &&
         vld.checkFieldLengths(body, lengths, cb) &&
         vld.hasOnlyFields(body, fieldList, cb))
            cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
       vld.checkPrsOK(cnvs[0].ownerId, cb))
         cnn.chkQry('select * from Conversation where id <> ? && title = ?',
          [cnvId, body.title], cb);
   },
   function(sameTtl: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(!sameTtl.length, Tags.dupTitle, cb))
         cnn.chkQry("update Conversation set title = ? where id = ?",
          [body.title, cnvId], cb);
      // cb();
   },
   // function (updRes, fields, cb) {
   //    // todo: add condition
   //    res.end();
   //    cb();
   // }
   ],

   function(err) {
      if(!err)
         res.status(200).end();
      cnn.release();
   });
});

router.delete('/:cnvId', function(req, res) {
   var vld = req.validator;
   var cnvId = req.params.cnvId;
   var cnn = req.cnn;

   waterfall([
   function(cb: queryCallback) {
      if(req.params.cnvId)
         cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },

   function(cnvs: Conversation[], fields: any, cb: queryCallback) {
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
   //todo: get msgs by cnv
   // GET dateTime = {dateTime}
   // num = {num}
   var vld: Validator = req.validator; // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn: PoolConnection = req.cnn;
   var lengths = {'content': maxContent};

   waterfall([
      function(cb: queryCallback){
         cnn.chkQry("select * from Conversation where id = ?",                  [req.params.cnvId,], cb);
      },
      function(foundCnvs: Conversation[], fields: any, cb: queryCallback){
         if(foundCnvs.length){
            if (req.query.num && req.query.dateTime)
               cnn.chkQry("select Message.id, cnvId, prsId, whenMade, content, numLikes, email" + 
               "from Message join Person on Message.prsId = Person.id " + 
               "where cnvId = ? and whenMade >= ? "+
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
         }else{
            res.status(404).end();
            cb(true);
         } 
      }, 

      function(resMsg: Message[], fields: any, cb: queryCallback){
            resMsg.forEach((msg) => msg.whenMade = msg.whenMade.getTime());
            res.json(resMsg);
            cb();
      }

   ],
      
      function(err){
         if(!err)
            res.end();
         cnn.release();
      });


});

router.post('/:cnvId/Msgs', function (req, res) {
   
   var vld: Validator = req.validator; // Shorthands
   var body = req.body;
   var cnn: PoolConnection = req.cnn;
   var lengths = {'content' : maxContent};

   waterfall([
      function(cb: queryCallback) {
         if(req.session && vld.checkFieldLengths(body, lengths, cb)){
            cnn.chkQry("select * from Conversation where id = ?", [req.params.cnvId], cb);
         }
      },

      function(resCnvs: Conversation[], fields: any, cb: queryCallback){
         if(resCnvs.length){

            body.cnvId = req.params.cnvId;
            body.prsId = req.session.prsId;
            body.whenMade = new Date();
            body.numLikes = 0;

            cnn.chkQry('insert into Message set ?', [body], cb);
         }else{
             res.status(404).end();
             // ? is this really hackish
             cb(true);
         }
           
      },

      function(result: {insertId: number}, fields: any, cb: queryCallback){
         res.location('/Msgs/' + result.insertId).end();
         cb();
      }
   ], 
      function (err) {
         if (!err)
            res.end();
         cnn.release();
      });
});


module.exports = router;
