'use strict'
import { Validator } from '../Validator';
import { waterfall } from 'async';
import { Session } from '../Session';
import { Request, Response, Body } from 'express-serve-static-core';
import { queryCallback, PoolConnection, MysqlError } from 'mysql';
import { Router } from 'express';

export let router: Router = Router({ caseSensitive: true });
const baseURL: string = '/Prss';
const Tags = Validator.Tags;
const skipToEnd: MysqlError = {
   code: '',
   errno: 0,
   fatal: true,
   name: '',
   message: '',
};

interface Person {
   whenRegistered: number | Date;
   email: string;
   id: number;
   password?: string;
}

interface Message {
   id: number;
   cnvId: number;
   whenMade: number | Date;
   email: string;
   content: string;
   numLikes: number;
}

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


router.get('/', function(req: Request, res: Response) {
   var email: any =
    (req.session.isAdmin() && req.query.email) ||
    (!req.session.isAdmin() && req.session.email);

   var handler = function(err: any, prsArr: Person[], fields: any) {
      if (req.query.email && prsArr[0] && prsArr[0]['email'] && 
       !prsArr[0]['email'].split('@')[0].includes(req.query.email as string) &&
        prsArr[0]['email'] !== req.query.email)
         res.json([]);
      else 
         res.json(prsArr);
      req.cnn.release();
   };

   if (email)
      req.cnn.chkQry(
       'select id, email from Person where email like ?',
       ['%' + email + '%'], handler);
   else 
      req.cnn.chkQry('select id, email from Person', null, handler);
});

router.post('/', function(req: Request, res: Response) {
   const vld: Validator = req.validator; // Shorthands
   var body: Body = req.body as Body;
   const admin: undefined | boolean = req.session && req.session.isAdmin();
   const cnn: PoolConnection = req.cnn;

   if (admin && !body.password) 
      body.password = '*'; // Blocking password

   body.whenRegistered = new Date();

   const lengths: Lengths = {
      firstName: 30,
      lastName: 50,
      password: 50,
      oldPassword: 50,
      email: 150,
   };

   const fields: string[] = ['email', 'password', 'role', 'lastName'];

   waterfall(
      [
         function(cb: queryCallback) {
            // Check properties and search for Email duplicates
            if (vld.hasFields(body, fields, cb) &&
             vld.chain(body.email.length > 0, Tags.missingField, ['email'])
             .chain(body.lastName.length > 0, Tags.missingField, ['lastName'])
             .chain(body.termsAccepted || admin, Tags.noTerms, null)
             .chain(body.password.length > 0, Tags.missingField, ['password'])

             .chain(typeof body.role === 'number' || body.role != '',
              Tags.missingField, ['role'])
             .chain(body.role === 0 || admin, Tags.forbiddenRole, null)
             .check(body.role <= 1 && body.role >= 0, Tags.badValue,
              ['role'], cb) &&
              vld.checkFieldLengths(body, lengths, cb)
            ) {
               cnn.chkQry('select * from Person where email = ?',
                [body.email], cb);
            }
         },

         function(existingPrss: Person[], fields: any, cb: queryCallback) {
            // If no dups, insert new Person
            if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
               body.termsAccepted = body.termsAccepted && new Date();
               cnn.chkQry('insert into Person set ?', [body], cb);
            }
         },

         function(result: {insertId: number}, fields: any, cb: queryCallback){
            // Return location of inserted Person
            res.location(baseURL + '/' + result.insertId).end();
            cb(null);
         },
      ],

      function(err: any) {
         cnn.release();
      }
   );
});

router.put('/:id', function(req: Request, res: Response) {
   const vld: Validator = req.validator;
   const ssn: Session = req.session;
   var body = req.body;
   const cnn = req.cnn;

   const fields = ['firstName', 'lastName', 'password', 'oldPassword', 'role'];

   const lengths = {
      firstName: 30,
      lastName: 50,
      password: 50,
      oldPassword: 50,
   };


   waterfall(
      [
         
         function(cb: queryCallback) {
            if (Object.keys(body).length === 0) {
               res.end();
               cb(skipToEnd);

            } else if (vld.checkPrsOK(req.params.id, cb) &&
             vld.hasOnlyFieldsChained(body, fields, cb)
             .checkFieldLengthsChained(body, lengths, cb) 
             .chain((!body.hasOwnProperty('role') || (req.body.role === 1 &&
             ssn.isAdmin()) || req.body.role === 0), Tags.badValue, ['role'])
             .check(!body.hasOwnProperty('password') || 
             req.body.oldPassword || ssn.isAdmin(), Tags.noOldPwd, null, cb)) {
               cnn.chkQry('select * from Person where id = ?',
                [req.params.id], cb);
            }
         },

         function(foundPrs: Person[], fields: any, cb: queryCallback) {
            if(foundPrs.length){
               if (vld.check(!('password' in body) || ssn.isAdmin() ||
                req.body.oldPassword === foundPrs[0].password,
                Tags.oldPwdMismatch, null, cb)) {
                  delete body.oldPassword;
                  cnn.chkQry('update Person set ? where id = ?',
                   [body, req.params.id], cb);
               }
            }else{
               res.status(404).end();
               cb(skipToEnd);
            }
         },

         // updatedResult, fields?, final callback
         function(updRes: any, fields: any, cb: queryCallback) {
            res.end();
            cb(null);
         },
      ],

      (err: any) => {
         cnn.release();
      }
   );
});

router.get('/:id', function(req: Request, res: Response) {
   console.log('getting Prs by id');
   var vld: Validator = req.validator;

   waterfall(
      [
         function(cb: queryCallback) {
            if (vld.checkPrsOK(req.params.id, cb))
               req.cnn.chkQry('select * from Person where id = ?',
                [req.params.id], cb);
         },

         function(prsArr: Person[], fields: any, cb: queryCallback) {
            if (prsArr.length) {
               delete prsArr[0].password;
               prsArr[0].whenRegistered = 
                (prsArr[0].whenRegistered as Date).getTime();
               res.json(prsArr);
               cb(null);
               
            }else{
               res.status(404).end();
               cb(skipToEnd);
            }
         },
      ],

      (err: any) => {
         req.cnn.release();
      }
   );
});


router.delete('/:id', function(req: Request, res: Response) {
   var vld = req.validator;

   waterfall(
      [
         function(cb: queryCallback) {
            if (vld.checkAdmin(cb)) {
               Session.removeAllSessions(req.params.id);
               req.cnn.chkQry('DELETE from Person where id = ?', 
                [req.params.id], cb);
            }
         },

         function(result: {affectedRows: number}, 
          fields: any, cb: queryCallback) {
            if (result.affectedRows) 
               res.end();
            else
               res.status(404).end();
            cb(null);
         },
      ],

      function(err: any) {
         req.cnn.release();
      }
   );
});

let queryPrs = (req: Request, orderBy: string, cnn: PoolConnection,
 cb: queryCallback) => {

   if (req.query.num && orderBy)
      cnn.chkQry(
       'select Message.id, cnvId, whenMade, ' +
       'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
       'from Person join Message on Person.id = prsId  ' +
       'left join(select Message.id, count( * ) as numLikes ' +
       'from Message join Likes on Message.id = Likes.msgId ' +
       'group by Message.id) as t1 ' +
       'on t1.id = Message.id ' +
       'where prsId = ? ' +
       `order by ${orderBy} desc ` +
       'limit ?',
       [req.params.prsId, parseInt(req.query.num as string)],cb
      );
   else if (req.query.num)
      cnn.chkQry(
       'select Message.id, cnvId, whenMade, ' +
       'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
       'from Person join Message on Person.id = prsId  ' +
       'left join(select Message.id, count( * ) as numLikes ' +
       'from Message join Likes on Message.id = Likes.msgId ' +
       'group by Message.id) as t1 ' +
       'on t1.id = Message.id ' +
       'where prsId = ? ' +
       'limit ?',
       [req.params.prsId, parseInt(req.query.num as string)],cb
      );
   else if (orderBy)
      cnn.chkQry(
       'select Message.id, cnvId, whenMade, ' +
       'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
       'from Person join Message on Person.id = prsId ' +
       'left join(select Message.id, count( * ) as numLikes ' +
       'from Message join Likes on Message.id = Likes.msgId ' +
       'group by Message.id) as t1 ' +
       'on t1.id = Message.id ' +
       'where prsId = ? ' +
       `order by ${orderBy} desc`, [req.params.prsId], cb
      );
   else
      cnn.chkQry(
       'select Message.id, cnvId, whenMade, ' +
       'email, content, ifnull(t1.numLikes, 0) as numLikes ' +
       'from Person join Message on Person.id = prsId ' +
       'left join(select Message.id, count( * ) as numLikes ' +
       'from Message join Likes on Message.id = Likes.msgId ' +
       'group by Message.id) as t1 ' +
       'on t1.id = Message.id ' +
       'where prsId = ?', [req.params.prsId], cb
      );
};

router.get('/:prsId/Msgs', function(req: Request, res: Response) {
   var cnn: PoolConnection = req.cnn;

   waterfall(
      [
         function(cb: queryCallback) {
            cnn.chkQry('select * from Person where id = ?',
             [req.params.prsId], cb);
         },

         function(foundPrs: Person[], fields: any, cb: queryCallback) {
            if (foundPrs.length) {
               var orderBy =
                (req.query.order === 'date' && 'whenMade') ||
                (req.query.order === 'likes' && 'numLikes');

               //run each of the query scenarios
               queryPrs(req, orderBy, cnn, cb);
            }
         },

         function(resMsg: Message[], fields: any, cb: queryCallback) {
            resMsg.forEach(
             msg => (msg.whenMade = (msg.whenMade as Date).getTime()));
             
            res.json(resMsg);
            cb(null);
         },
      ],

      (err: any) => {
         if (!err) 
            res.end();
         cnn.release();
      }
   );
});

