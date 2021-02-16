'use strict'

import { Router } from 'express';
import { Request, Response, Body } from 'express-serve-static-core';
import { Validator } from '../Validator'
import { waterfall } from 'async';
import { queryCallback, PoolConnection, MysqlError } from 'mysql';
// import { Session } from '../Session';

export let router = Router({ caseSensitive: true });
const baseURL = '/Msgs';
const Tags = Validator.Tags;

interface Message {
   id: number;
   cnvId: number;
   whenMade: number | Date;
   email: string;
   content: string;
   numLikes: number;
};

interface Like {
   cnvId: number;
   prsId: number;
   whenMade: number | Date;
   email: string;
   content: string;
   numLikes: number;
};

const skipToend = {
   code: "",
   errno: 0,
   fatal: true,
   name: "",
   message: ""
};

router.get('/:msgId', function (req: Request, res: Response) {
   const vld: Validator = req.validator; // Shorthands
   var body: Body = req.body;
   const admin: undefined | boolean = req.session && req.session.isAdmin();
   const cnn: PoolConnection = req.cnn;

   waterfall([
      function (cb: queryCallback) {
         if (req.session)
            cnn.chkQry('select cnvId, prsId, whenMade,' +
               'email, content, numLikes, ' +
               '(select count(*) from Likes where msgId = Message.id) ' +
               'as numLikes ' +
               'from Message join Person ' +
               'on prsId = Person.id where Message.id = ?',
               [parseInt(req.params.msgId)], cb)
      },

      function (foundMsg: Message[], fields: any, cb: queryCallback) {
         if (foundMsg.length) {
            foundMsg[0].whenMade = foundMsg[0].whenMade &&
               (foundMsg[0].whenMade as Date).getTime();

            res.json(foundMsg[0]);
         } else
            res.status(404).end();
         cb(null);
      }
   ],

      (err) => {
         if (!err)
            res.end();
         cnn.release();
      });

});

router.get('/:msgId/Likes', function (req: Request, res: Response) {
   const vld: Validator = req.validator;
   var body: Body = req.body;
   const cnn: PoolConnection = req.cnn;

   waterfall([
      function (cb: queryCallback) {
         cnn.chkQry("select * from Message where id = ?",
            [req.params.msgId], cb)
      },

      function (foundMsg: Message[], fields: any, cb: queryCallback) {
         if (foundMsg.length) {
            if (req.query.num)
               cnn.chkQry("select Likes.id, Likes.prsId, firstName, " +
                  "lastName from Likes join Person on prsId = Person.id " +
                  "where msgId = ? order by lastName, firstName limit ?",
                  [req.params.msgId, parseInt(req.query.num as string)], cb);
            else
               cnn.chkQry("select Likes.id, Likes.prsId, firstName, " +
                  "lastName from Likes join Person on prsId = Person.id " +
                  "where msgId = ? order by lastName, firstName",
                  [req.params.msgId], cb);
         } else {
            res.status(404).end();
            cb(skipToend);
         }
      },

      function (result: Like[], fields: any, cb: queryCallback) {
         res.json(result);
         cb(null);
      }],

      (err) => {
         if (!err)
            res.end();
         cnn.release();
      });
});

router.post('/:msgId/Likes', function (req: Request, res: Response) {
   const vld: Validator = req.validator;
   var body: Body = req.body;
   const cnn: PoolConnection = req.cnn;
   var cnvsId: number;
   var locId: number;

   waterfall([
      function (cb: queryCallback) {
         cnn.chkQry("select * from Message where id = ?",
            [req.params.msgId], cb)
      },

      function (foundMsg: Message[], fields: any, cb: queryCallback) {
         if (foundMsg.length) {
            cnvsId = foundMsg[0].cnvId;

            cnn.chkQry("select * from Likes where msgId = ? and prsId = ?",
               [req.params.msgId, req.session.prsId], cb);
         } else {
            res.status(404).end();
            cb(skipToend);
         }
      },

      function (foundLike: Like[], fields: any, cb: queryCallback) {

         if (vld.check(!foundLike.length, Tags.dupLike, null, null)) {
            var content = {
               "msgId": req.params.msgId,
               "prsId": req.session.prsId
            }
            cnn.chkQry("insert into Likes set ?", [content], cb);
         } else
            cb(skipToend);
      },

      function (result: { insertId: number, affectedRows: number },
         fields: any, cb: queryCallback) {

         if (result.affectedRows > 0) {
            locId = result.insertId;
            cnn.chkQry("update Message set " +
               "numLikes = NumLikes + 1 " +
               "where id = ?", [req.params.msgId], cb);
         } else {
            cb(skipToend);
         }
      },

      function (result: { insertId: number }, fields: any, cb: queryCallback) {
         res.location(baseURL + '/' + req.params.msgId +
            '/Likes/' + locId).end();
         cb(null);
      }
   ],

      (err) => {
         if (!err)
            res.end();
         cnn.release();
      });
});

module.exports = router;

