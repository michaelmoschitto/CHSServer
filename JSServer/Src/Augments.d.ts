import {PoolConnection, QueryFunction} from 'mysql';
import {Validator} from './Validator';
import {Session} from './Session'

declare module 'mysql' {
   export interface PoolConnection {
      // Cannot use QueryFunction here -- why is that?
      chkQry: (qry: string, values: any[], cb: queryCallback) => void
   }
}

declare module 'express-serve-static-core' {
   export interface Request {
      bugs: any;
      session?: Session;
      cnn?: PoolConnection;
      validator?: Validator;

   }
}