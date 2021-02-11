var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Cnvs';

router.get('/', function(req, res) {
   req.cnn.chkQry('select id, title from Conversation', null,
   function(err, cnvs) {
      if (!err)
         res.json(cnvs);
      req.cnn.release();
   });
});

router.post('/', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;
   var lengths = {
      'title' : 80
   };

   var fieldList = ['title'];

   async.waterfall([
   function(cb) {
      cnn.chkQry('select * from Conversation where title = ?', body.title, cb);
   },

   // note: using hasFields && hasOnlyFields checks for all fields and gurrantees existence
   function(existingCnv, fields, cb) {
      if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb) && 
      vld.checkFieldLengths(body, lengths, cb) && 
      vld.hasFields(body, fieldList, cb) &&
      vld.hasOnlyFields(body, fieldList, cb)){
         
         //owned by the current AU 
         body['prsId'] = req.session.prsId;
         cnn.chkQry("insert into Conversation set ?", body, cb);
      }
       
         
   },
   function(insRes, fields, cb) {
      res.location(router.baseURL + '/' + insRes.insertId).end();
      cb();
   }],

   function() {
      cnn.release();
   });
});

router.put('/:cnvId', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;
   var cnvId = req.params.cnvId;

   async.waterfall([
   function(cb) {
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs, fields, cb) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
       vld.checkPrsOK(result[0].prsId, cb))
         cnn.chkQry('select * from Conversation where id <> ? && title = ?',
          [cnvId, body.title], cb);
   },
   function(sameTtl, fields, cb) {
      if (vld.check(!sameTtl.length, Tags.dupTitle, cb))
         cnn.chkQry("update Conversation set title = ? where id = ?",
          [body.title, cnvId], cb);
   }],
   function(err) {
      cnn.release();
   });
});

router.delete('/:cnvId', function(req, res) {
   var vld = req.validator;
   var cnvId = req.params.cnvId;
   var cnn = req.cnn;

   async.waterfall([
   function(cb) {
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs, fields, cb) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
       vld.checkPrsOK(result[0].prsID, cb))
         cnn.chkQry('delete from Conversation where id = ?', [cnvId], cb);
   }],
   function(err) {
      if (!err)
         cnn.status(200);
      cnn.release();
   });
});

module.exports = router;
