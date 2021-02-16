'use strict'
// var express = require('express');
import express, { NextFunction } from 'express'
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import {Validator} from './Validator'
import {CnnPool} from './CnnPool'
import {series} from 'async'
import {Request, Response, Application} from 'express-serve-static-core';
import { queryCallback } from 'mysql';
import {router as PrsRouter} from './Account/Prss'
import {router as CnvsRouter} from './Conversation/Cnvs'
import {SsnRouter as SsnRouter} from './Account/Ssns'
import {router as MsgsRouter} from './Conversation/Msgs'

// var path = require('path');
// var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
var {Session, router} = require('./Session.js');
// var Validator = require('./Validator.js');
// var CnnPool = require('./CnnPool.js');
// var async = require('async');

var app: Application = express();

// Static paths to be served like index.html and all client side js
app.use(express.static(path.join(__dirname, 'public')));

// Partially complete handler for CORS.
app.use(function(req: Request, res: Response, next: NextFunction) {
   console.log("Handling " + req.path + '/' + req.method);
   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
   res.header("Access-Control-Allow-Credentials", "true");
   res.header("Access-Control-Allow-Headers", "Content-Type");
   next();
});

// No further processing needed for options calls.
app.options("/*", function(req: Request, res: Response) {
   res.status(200).end();
});

// Parse all request bodies using JSON, yielding a req.body property
app.use(bodyParser.json());

// No messing w/db ids
app.use(function(req: Request, res: Response, next: NextFunction) {
   delete req.body.id; next();
});

// Parse cookie header, and attach cookies to req as req.cookies.<cookieName>
app.use(cookieParser());

// TEST VALIDATOR FUNCTIONS
// app.use((req: Request, res: Response) => {
//    console.log(req);
//    console.log("got to test method");
//    vld = new Validator(req: Request, res: Response);
//    console.log(vld.checkFieldLengths(req.body, {'email' : 60, 'password' : 60}, () => true))
//    res.end();
// });


app.use(router);

// Check general login.  If OK, add Validator to |req| and continue processing,
// otherwise respond immediately with 401 and noLogin error tag.
app.use(function(req: Request, res: Response, next: NextFunction) {
   console.log(req.path);
   console.log(req.method, req.path);
   if (req.session || (req.method === 'POST' &&
    (req.path === '/Prss' || req.path === '/Ssns'))) {
      req.validator = new Validator(req, res);
      // console.log(req.validator)
      next();
   } else
      res.status(401).end();
});

// Add DB connection, as req.cnn, with smart chkQry method, to |req|
app.use(CnnPool.router);

// Load all subroutes
app.use('/Prss', PrsRouter);
app.use('/Ssns', SsnRouter);
app.use('/Cnvs', CnvsRouter);
app.use('/Msgs', MsgsRouter);


// Special debugging route for /DB DELETE.  Clears all table contents,
//resets all auto_increment keys to start at 1, and reinserts one admin user.
app.delete('/DB', function(req: Request, res: Response) {

   Session.logoutAll();
   // Callbacks to clear tables
   var cbs = ["Message", "Conversation", "Person", "Likes"].map(
      table => function(cb: queryCallback) {
         req.cnn.query("delete from " + table, cb);
      }
   );

   // Callbacks to reset increment bases
   cbs = cbs.concat(["Conversation", "Message", "Person", "Likes"].map(
      table => cb => {
         req.cnn.query("alter table " + table + " auto_increment = 1", cb);
      })
   );

   // Callback to reinsert admin user
   cbs.push(cb => {
      req.cnn.query('INSERT INTO Person (firstName, lastName, email,' +
         ' password, whenRegistered, role) VALUES ' +
         '("Joe", "Admin", "adm@11.com","password", NOW(), 1);', cb);
   });

   // Callback to clear sessions, release connection and return result
   cbs.push((cb: queryCallback) => {
      Session.getAllIds().forEach((id: number) => {
         Session.findById(id).logOut();
         console.log("Clearing " + id);
      });
      cb(null);
   });

   series(cbs, err => {
      req.cnn.release();
      if (err)
         res.status(400).json(err);
      else
         res.status(200).end();
   });

   /* Equivalent expanded code for instructional reference
      async.series([
         function(callback){
            cnn.query('delete from Person`', callback);
         },
         function(callback){
            cnn.query('delete from Conversation', callback);
         },
         function(callback){
            cnn.query('delete from Message', callback);
         },
         function(callback){
            cnn.query('alter table Person auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Conversation auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Message auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('INSERT INTO Person (firstName, lastName, email,' +
                ' password, whenRegistered, role) VALUES ' +
                '("Joe", "Admin", "adm@11.com","password", NOW(), 2);',
             callback);
         },
         function(callback){
            for (var session in Session.sessions)
               delete Session.sessions[session];
            res.send();
         }
      ],
      err => {
        req.cnn.release();
        if (err)
           res.status(400).json(err);
        else
           res.status(200).end();
      }
   );*/
});

// Anchor handler for general 404 cases.
app.use(function(req: Request, res: Response) {
   res.status(404).end();
   res.cnn.release();
});

// Handler of last resort.  Send a 500 response with stacktrace as the body.
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
   res.status(500).json(err.stack);
   req.cnn && req.cnn.release();
});

app.listen(4015, function() {
   console.log('App Listening on port 4015');
});
