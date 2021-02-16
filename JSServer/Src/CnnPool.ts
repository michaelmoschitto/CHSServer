import { queryCallback, PoolConnection, MysqlError, createPool, Pool } from 'mysql';
import {default as PoolCFG} from './connection.json'
import { Router } from 'express';
import {Request, Response, NextFunction} from 'express-serve-static-core';


// Constructor for DB connection pool
// Note: In some mysql server instances, standard password access may
// not be the default authentication.  In this case, adjust the user
// in question via this MySQL command, replacing the <> with appropriate
// values.
// ALTER USER '<user>'@'localhost' IDENTIFIED WITH mysql_native_password BY '<YourPassword>'; 
// var CnnPool = function() {
//    var poolCfg = require('./connection.json');

//    poolCfg.connectionLimit = CnnPool.PoolSize;
//    this.pool = mysql.createPool(poolCfg);

//    console.log(poolCfg);
// };
interface poolConfig{
   connectionLimit?: number;
   host?: string;
   user?: string;
   password?: string;
};

export let router = Router({ caseSensitive: true });

export class CnnPool{
   
   // NOTE: Do *not* change this pool size.  It is required to be 1 in order
   // to demonstrate you are properly freeing connections!
   static PoolSize = 1;

   poolCfg: poolConfig = PoolCFG; 
   pool: Pool;

   constructor(){
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
      console.log("Getting connection");
      CnnPool.singleton.getConnection(function(err, cnn) {
         if (err)
         res.status(500).json('Failed to get connection ' + err);
         else {
            console.log("Connection acquired");
            cnn.chkQry = function(qry: string, prms: string[], cb: queryCallback) {
               // Run real qry, checking for error
               
               this.query(qry, prms, function(err: any, dbRes: string, fields: any) {
                  if (err){
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
} //class closing brace

module.exports = CnnPool;