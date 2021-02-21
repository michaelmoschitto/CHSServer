'use strict';

import {Router} from 'express';
// var Tags = require('../Validator.js').Tags;
import {Validator} from '../Validator';
import {Request, Response, Body} from 'express-serve-static-core';
import {PoolConnection} from 'mysql';
import {Session, router} from '../Session';

interface Ssn {
   id: number;
   prsId: number;
   loginTime: number | Date;
}

export let SsnRouter = Router({caseSensitive: true});
const baseURL = '/Ssns';
const Tags = Validator.Tags;

SsnRouter.get('/', function (req: Request, res: Response) {
   var sessionArr: Ssn[] = [];
   var ssn: Session;

   if (req.validator.checkAdmin()) {
      Session.getAllIds().forEach((id: string) => {
         ssn = Session.findById(id);
         sessionArr.push({
            id: ssn.id,
            prsId: ssn.prsId,
            loginTime: ssn.loginTime,
         });
      });
      res.json(sessionArr).end();
   } else res.status(403).end();

   req.cnn.release();
});

SsnRouter.post('/', function (req: Request, res: Response) {
   var ssn: Session;
   const cnn: PoolConnection = req.cnn;

   cnn.chkQry(
      'select * from Person where email = ?', [req.body.email],
      function (err, result) {
         if (req.validator.check(
               result.length && result[0].password === req.body.password,
               Tags.badLogin,
               null,
               null
            )
         ) {
            ssn = new Session(result[0], res);
            req.session = ssn;
            res.location(baseURL + '/' + ssn.id).end();
         }
         
         cnn.release();
      }
   );
});

SsnRouter.delete('/:id', function (req: Request, res: Response) {
   var vld: Validator = req.validator;
   var prsId: Session | number =
    Session.findById(req.params.id) && Session.findById(req.params.id).prsId;

   if (Session.findById(req.params.id) && vld.checkPrsOK(prsId, null)) {
      req.session.logOut(parseInt(req.params.id));
      res.end();
   } else res.status(404).end();

   req.cnn.release();
});

SsnRouter.get('/:id', function (req: Request, res: Response) {
   var vld: Validator = req.validator;
   var ssn: Session = Session.findById(req.params.id);
   var prsId: Session | number =
    Session.findById(req.params.id) && Session.findById(req.params.id).prsId;

   if (ssn && vld.checkPrsOK(prsId, null)) {
      res.json({id: ssn.id, prsId: ssn.prsId, loginTime: ssn.loginTime});
   } else {
      res.status(404).end();
   }
   req.cnn.release();
});

