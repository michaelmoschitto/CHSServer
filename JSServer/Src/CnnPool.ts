import {queryCallback, createPool, Pool} from 'mysql';
import {default as PoolCFG} from './connection.json';
import {Request, Response, NextFunction} from 'express-serve-static-core';

interface poolConfig {
   connectionLimit?: number;
   host?: string;
   user?: string;
   password?: string;
}

export class CnnPool {
   // NOTE: Do *not* change this pool size.  It is required to be 1 in order
   // to demonstrate you are properly freeing connections!
   static PoolSize = 1;

   poolCfg: poolConfig = PoolCFG;
   pool: Pool;

   constructor() {
      this.poolCfg.connectionLimit = CnnPool.PoolSize;
      this.pool = createPool(this.poolCfg);
      console.log(this.poolCfg);
   }

   // The one (and probably only) CnnPool object needed for the app
   static singleton = new CnnPool();

   // Conventional getConnection, drawing from the pool
   getConnection = (cb: queryCallback) => {
      this.pool.getConnection(cb);
   };

   // Router function for use in auto-creating CnnPool for a request
   static router = (req: Request, res: Response, next: NextFunction) => {
      
      console.log('Getting connection');
      CnnPool.singleton.getConnection(function (err, cnn) {
         if (err) 
            res.status(500).json('Failed to get connection ' + err);
         else {

            console.log('Connection acquired');
            cnn.chkQry = function (qry: string, prms: string[], 
             cb: queryCallback) {

               this.query(qry, prms,
               function (err: any, dbRes: string, fields: any) {
                  if (err) {
                     res.status(500).json('Failed query ' + qry);
                     console.log(err);
                  }
               
                  cb(err, dbRes, fields);
               });
            };
            req.cnn = cnn;
            next();
         }
      });
   };
} 

