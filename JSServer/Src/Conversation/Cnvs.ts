import {Router} from 'express';
import {waterfall} from 'async';
import {Validator} from '../Validator';
import {queryCallback} from 'mysql';

export let router = Router({caseSensitive: true});

const Tags = Validator.Tags;
const baseURL = '/Cnvs';

const kMaxTitle = 80;
const kShortContent = 80;
const kMaxContent = 5000;

interface Conversation {
   id: number;
   title: string;
   lastMessage: Date | number;
   ownerId: number;
};

// Listing only the fields we actually modify -- just to illustrate
interface Message {
   whenMade: Date | number;
   content: string
}

router.get('/', function(req: Request, res: Response) {
   req.cnn.chkQry('select id, title, ownerId from Conversation', null,
   function(err, cnvs: Conversation[]) {
      if (!err) {
         res.json(cnvs);
      }
      req.cnn.release();
   });
});

router.post('/', function(req, res) {
   let vld:Validator = req.validator;
   let body = req.body;
   let cnn = req.cnn;

   waterfall([
   function(cb: queryCallback) {
      cnn.chkQry('select * from Conversation where title = ?', body.title, cb);
   },
   function(existingCnv: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb))
         cnn.chkQry("insert into Conversation set ?", body, cb);
   },
   function(insRes: {insertId: number}, fields: any, cb: Function) {
      res.location(baseURL + '/' + insRes.insertId).end();
   }],
   function() {
      cnn.release();
   });
});

router.delete('/:cnvId', function(req, res) {
   let vld = req.validator;
   let cnvId = req.params.cnvId;
   let cnn = req.cnn;

   waterfall([
   function(cb: queryCallback) {
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs: Conversation[], fields: any, cb: queryCallback) {
      if (vld.check(cnvs.length > 0, Tags.notFound, null, cb) &&
       vld.checkPrsOK(cnvs[0].ownerId, cb))
         cnn.chkQry('delete from Conversation where id = ?', [cnvId], cb);
   }],
   function(err) {
      if (!err)
         res.status(200);
      cnn.release();
   });
});