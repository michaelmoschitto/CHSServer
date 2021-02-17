// var Tags = require('../Validator.js').Tags;
import { Validator } from '../Validator';
var async = require('async');
var mysql = require('mysql');
// var {Session} = require('../Session.js');
import {Session} from '../Session'
import { Request, Response, Body } from 'express-serve-static-core';
import { queryCallback, PoolConnection, MysqlError } from 'mysql';
import { Router } from 'express';


export let router = Router({ caseSensitive: true });
const baseURL = '/Prss';
const Tags = Validator.Tags;

interface Person {
   whenRegistered: number | Date;
   email: string;
   id: number;
   password?: string;
};

interface Message {
   id: number;
   cnvId: number;
   whenMade: number | Date;
   email: string;
   content: string;
   numLikes: number;
};

interface Lengths {
   [key: string]: number;

   content?: number;
   title?: number;
   firstName?: number;
   lastName?: number;
   password?: number;
   oldPassword?: number;
   email?: number;
}

/* Much nicer versions
*/
router.get('/', function(req: Request, res: Response) {
   var email: any = req.session.isAdmin() && req.query.email ||
    !req.session.isAdmin() && req.session.email;

   var handler = function(err: any, prsArr: Person[], fields: any) {
   
      if (req.query.email && prsArr[0] && prsArr[0]['email'] && 
       !prsArr[0]['email'].split('@')[0]
       .includes((req.query.email) as string) &&
       prsArr[0]['email'] !== req.query.email)
         res.json([]);
      else
         res.json(prsArr);
      req.cnn.release();
   };

   if (email)
      req.cnn.chkQry("select id, email from Person where email like ?", 
       ['%' + email + '%'], handler);
   else
      req.cnn.chkQry('select id, email from Person', null, handler);
});

router.post('/', function(req: Request, res: Response) {
   const vld: Validator = req.validator;  // Shorthands
   var body: Body = req.body as Body;
   const admin: undefined | boolean = req.session && req.session.isAdmin();
   const cnn: PoolConnection = req.cnn;

   if (admin && !body.password)
      body.password = "*";                       // Blocking password
   body.whenRegistered = new Date();

      const lengths: Lengths = {
         'firstName': 30,
         'lastName': 50,
         'password': 50,
         'oldPassword': 50,
         'email' : 150
      };

   const fields: string[] = ["email", "password", "role", "lastName"]

   async.waterfall([
      function(cb: queryCallback) { // Check properties and search for Email duplicates
         console.log(body);
         if (vld.hasFields(body, fields, cb) &&
         vld.chain(body.email.length > 0, Tags.missingField, ['email'])
          .chain(body.lastName.length > 0, Tags.missingField, ['lastName'])
          .chain(body.termsAccepted || admin, Tags.noTerms)
          .chain(body.password.length > 0, Tags.missingField, ['password'])
          .chain(typeof body.role === 'number' || body.role != "", 
           Tags.missingField, ['role'])
          .chain(body.role === 0 || admin, Tags.forbiddenRole)
          .check(body.role <= 1 && body.role >= 0, Tags.badValue,
           ["role"], cb) &&
          vld.checkFieldLengths(body, lengths, cb)) {
            cnn.chkQry('select * from Person where email = ?', 
             [body.email], cb);
         }
      },

      function(existingPrss: Person[], fields: any, cb: queryCallback) {  // If no dups, insert new Person
         if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
            body.termsAccepted = body.termsAccepted && new Date();
            cnn.chkQry('insert into Person set ?', [body], cb);
         }
      },

      function(result: {insertId: number}, fields: any, cb: queryCallback) { // Return location of inserted Person
         res.location(baseURL + '/' + result.insertId).end();
         cb(null);
      }],

      function(err: any) {
         cnn.release();
      });
   });

router.put('/:id', function(req: Request, res: Response) {
   const vld: Validator = req.validator;
   const ssn: Session = req.session;
   var body = req.body;
   const cnn = req.cnn;

   const fields = [
         'firstName',
         'lastName',
         'password',
         'oldPassword',
         'role'
      ];

   const lengths = {
         'firstName': 30,
         'lastName': 50,
         'password': 50,
         'oldPassword': 50
      };

   async.waterfall([
      function(cb: queryCallback) { 
      // zero or more of fn, ln, pswd, role
      if (vld.checkPrsOK(req.params.id, cb) && vld.hasOnlyFields(body, fields, cb) && 
       vld.checkFieldLengths(body, lengths, cb) &&// person in question or admin
       vld.chain((!("role" in req.body) || req.body.role == '0') || ssn.isAdmin(), Tags.badValue, ["role"])
       .chain(!('password' in body) || req.body.oldPassword || ssn.isAdmin(), Tags.noOldPwd) // s
       .check(!('password' in body) || req.body.password, Tags.badValue, ['password'], cb))

         cnn.chkQry("select * from Person where id = ?", [req.params.id], cb);
   },

      function(foundPrs: Person[], fields: any, cb: queryCallback) { 
      if(vld.check(foundPrs.length, Tags.notFound, null, cb) &&
       vld.check(ssn.isAdmin() || !('password' in body) 
       || req.body.oldPassword === foundPrs[0].password,
       Tags.oldPwdMismatch, null, cb)) {

         delete body.oldPassword;
         cnn.chkQry("update Person set ? where id = ?", [body, req.params.id], cb);

      }
   },

   // updatedResult, fields?, final callback
      function(updRes: any, fields: any, cb: queryCallback) {
      res.end();
      cb(null);
   }

   ],
   (err: any) => { 
      cnn.release();
   })
});

router.get('/:id', function(req: Request, res: Response) {
   console.log("getting Prs by id")
   var vld: Validator = req.validator;

   async.waterfall([

   function(cb: queryCallback) {
     if (vld.checkPrsOK(req.params.id, cb))
        req.cnn.chkQry('select * from Person where id = ?',
         [req.params.id], cb);
   },

      function (prsArr: Person[], fields: any, cb: queryCallback) {
      if (vld.check(prsArr.length, Tags.notFound, null, cb)) {
         delete prsArr[0].password;

         prsArr[0].whenRegistered = 
          (prsArr[0].whenRegistered as Date).getTime();
         res.json(prsArr);
         cb(null);
      }

   }],

   (err: any) => {
      req.cnn.release();
   });

});

/*
router.get('/:id', function(req: Request, res: Response) {
   var vld = req.validator;

   if (vld.checkPrsOK(req.params.id)) {
      req.cnn.query('select * from Person where id = ?', [req.params.id],
      function(err, prsArr) {
         if (vld.check(prsArr.length, Tags.notFound))
            res.json(prsArr);
         req.cnn.release();
      });
   }
   else {
      req.cnn.release();
   }
});
*/

router.delete('/:id', function(req: Request, res: Response) {
   var vld = req.validator;

   async.waterfall([
      function (cb: queryCallback) {
      if (vld.checkAdmin()) {

         Session.removeAllSessions(req.params.id);
         req.cnn.chkQry('DELETE from Person where id = ?',[req.params.id], cb);
      }
   },

      function(result: {affectedRows: number}, fields: any, cb: queryCallback){
      if (vld.check(result.affectedRows, Tags.notFound, null, cb)) {
         res.end();
         cb(null);
      }
   }],

   function(err: any) {
      req.cnn.release();
   });
});

router.get('/:prsId/Msgs', function(req: Request, res: Response){
   var vld: Validator = req.validator; 
   var body: Body = req.body;
   var admin: undefined | boolean = req.session && req.session.isAdmin();
   var cnn: PoolConnection = req.cnn;
   

   async.waterfall([
      function(cb: queryCallback){
         cnn.chkQry("select * from Person where id = ?",[req.params.prsId],cb);
      },

      function(foundPrs: Person[], fields: any, cb: queryCallback){
         if(foundPrs.length){
            var orderBy = (req.query.order === 'date'  && 'whenMade' ||
             req.query.order === 'likes' && 'numLikes');

            if(req.query.num && orderBy)
               cnn.chkQry("select Message.id, cnvId, whenMade, " +
                "email, content, ifnull(t1.numLikes, 0) as numLikes " +
                "from Person join Message on Person.id = prsId  " +
                "left join(select Message.id, count( * ) as numLikes " +
                "from Message join Likes on Message.id = Likes.msgId " +
                "group by Message.id) as t1 " +
                "on t1.id = Message.id " +
                "where prsId = ? " +
                `order by ${orderBy} desc ` + 
                "limit ?",
                [req.params.prsId, parseInt(req.query.num as string)], cb);

            else if (req.query.num)
               cnn.chkQry("select Message.id, cnvId, whenMade, " + 
                "email, content, ifnull(t1.numLikes, 0) as numLikes " + 
                "from Person join Message on Person.id = prsId  " + 
                "left join(select Message.id, count( * ) as numLikes " +  
                "from Message join Likes on Message.id = Likes.msgId " +  
                "group by Message.id) as t1 " + 
                "on t1.id = Message.id " + 
                "where prsId = ? " + 
                "limit ?", 
                 [req.params.prsId, parseInt(req.query.num as string)], cb);

            else if(orderBy)
               cnn.chkQry("select Message.id, cnvId, whenMade, " + 
                "email, content, ifnull(t1.numLikes, 0) as numLikes " + 
                "from Person join Message on Person.id = prsId " + 
                "left join(select Message.id, count( * ) as numLikes " + 
                "from Message join Likes on Message.id = Likes.msgId " +
                "group by Message.id) as t1 " +
                "on t1.id = Message.id " + 
                "where prsId = ? " +
                `order by ${orderBy} desc`, [req.params.prsId], cb);

            else
              cnn.chkQry("select Message.id, cnvId, whenMade, " +
               "email, content, ifnull(t1.numLikes, 0) as numLikes " +
               "from Person join Message on Person.id = prsId " +
               "left join(select Message.id, count( * ) as numLikes " +
               "from Message join Likes on Message.id = Likes.msgId " +
               "group by Message.id) as t1 " +
               "on t1.id = Message.id " +
               "where prsId = ?", [req.params.prsId], cb);
         }
      },

      function(resMsg: Message[], fields: any, cb: queryCallback){
         resMsg.forEach((msg) => msg.whenMade = (msg.whenMade as Date).getTime());
         res.json(resMsg);
         cb(null);
      }
   ],

   (err: any) => {
      if(!err)
         res.end();
      cnn.release();
   });
});

// module.exports = router;
