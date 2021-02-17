// Create a validator that draws its session from |req|, and reports

'use strict'

var {Session,} = require('./Session.js');
import { Request, Response } from 'express-serve-static-core';
import { queryCallback } from 'mysql';

interface Lengths {
   [key: string]: number; 

   content?: number;
   title?: number;
}

interface Error{
   tag: string; 
   params?: string[];
};

export class Validator{

   static Tags = {
      noLogin: "noLogin",              // No active session/login
      noPermission: "noPermission",    // Login lacks permission.
      missingField: "missingField",    // Field missing. Params[0] is field name
      badValue: "badValue",            // Bad field value.  Params[0] is field name
      notFound: "notFound",            // Entity not present in DB
      badLogin: "badLogin",            // Email/password combination invalid
      dupEmail: "dupEmail",            // Email duplicates an existing email
      noTerms: "noTerms",              // Acceptance of terms is required.
      forbiddenRole: "forbiddenRole",  // Cannot set to this role
      noOldPwd: "noOldPwd",            // Password change requires old password
      dupTitle: "dupTitle",            // Title duplicates an existing cnv title
      queryFailed: "queryFailed",
      forbiddenField: "forbiddenField",
      oldPwdMismatch: "oldPwdMismatch",
      dupLike: "dupLike"
   };

   private errors: Error[];
   private session: typeof Session;
   private res: Response;

   //now can pass validator as mysqlError 
   code: string = "";
   errno: number = 0;
   fatal: boolean = true;
   name: string = "";
   message: string = ""; 

   // check(test: string | number, tag: string, params: any, cb: queryCallback)
   //  => number;
   constructor(req: Request, res: Response) {
      this.errors = [];   // Array of error objects having tag and params
      this.session = req.session;
      this.res = res;
   };

// List of errors, and their corresponding resource string tags
   

// Check |test|.  If false, add an error with tag and possibly empty array
// of qualifying parameters, e.g. name of missing field if tag is
// Tags.missingField.
//
// Regardless, check if any errors have accumulated, and if so, close the
// response with a 400 and a list of accumulated errors, and throw
//  this validator as an error to |cb|, if present.  Thus,
// |check| may be used as an "anchor test" after other tests have run w/o
// immediately reacting to accumulated errors (e.g. checkFields and chain)
// and it may be relied upon to close a response with an appropriate error
// list and call an error handler (e.g. a waterfall default function),
// leaving the caller to cover the "good" case only.
check = (test: boolean | number, tag: string,
   params: any, cb: queryCallback) : boolean => {
      if (!test){
         this.errors.push({tag: tag, params: params});
      }
      
      if (this.errors.length) {
         if (this.res) {
            if (this.errors[0].tag === Validator.Tags.noPermission)
            this.res.status(403).end();
            else
            this.res.status(400).json(this.errors);
            this.res = null;   // Preclude repeated closings
         }
         if (cb)
         cb(this);
      }
      return !this.errors.length;
   };

   
   // Somewhat like |check|, but designed to allow several chained checks
   // in a row, finalized by a check call.
   chain = (test: boolean | number | string | Date, tag: string, params?: any) => {
      if (!test) {
         this.errors.push({tag: tag, params: params});
      }
      return this;
   };
   
   checkAdmin = (cb?: queryCallback) => {
      return this.check(this.session && this.session.isAdmin(),
      Validator.Tags.noPermission, null, cb);
   };
   
   // Validate that AU is the specified person or is an admin
   // * CORRECT
   checkPrsOK = (prsId: number | string, cb: queryCallback) => {
      if(typeof(prsId) === 'string')
      prsId = parseInt(prsId);
      
      // if(!Session.findById(prsId) &&)
      //    return false;
      
      return this.check(this.session &&
         // AU must be person {prsId} or admin
         (this.session.isAdmin() || this.session.prsId === prsId),
         Validator.Tags.noPermission, null, cb);
      };
      
      // "AU must be owner of session or admin"
      // Validator.prototype.chkSsnOk = function (ssnId, cb) {
         //    if (typeof (ssnId) === 'string')
         //       ssnId = parseInt(ssnId);
         
         //    // if(!Session.findById(prsId) &&)
         //    //    return false;
         
         //    return this.check(this.session &&
         //       // AU must be person {prsId} or admin
         //       // ! could also be another session that is yours
         //       // ! and there is no reason to 
         //       (this.session.isAdmin() || this.session.id === ssnId),
         //       Validator.Tags.noPermission, null, cb);
         // };
         
         // Check presence of truthy property in |obj| for all fields in fieldList
         hasFields = (obj: any, fieldList: string[], cb: queryCallback) => {
            var self = this;
            
            fieldList.forEach(function(name: string) {
               self.chain(obj.hasOwnProperty(name) && obj[name] !== null && 
               obj[name] !== "", Validator.Tags.missingField, [name]);
            });
            
            return this.check(true, null, null, cb);
         };
         
         // Throws forbidden field for any fields other than specified in fieldList
         hasOnlyFields = (body: any, fieldList: string[], cb: queryCallback) => {
            var self = this;
            
            Object.keys(body).forEach(function(field: string){
               self.chain(fieldList.includes(field), Validator.Tags.forbiddenField, [field]);
            });
            
            return this.check(true, null, null, cb);
         };
         
         checkFieldLengths = (body: any, lengths: Lengths, cb: queryCallback) => {
            var self = this;
            
            Object.keys(body).forEach(function (field) {
               if (Object.keys(lengths).includes(field))
               //
               self.chain(body[field] && body[field].length <= lengths[field] && body[field] !== null && body[field] !== "", Validator.Tags.badValue, [field]);
            });
            
            return this.check(true, null, null, cb);
            
         };

         getErrors = (): Error[] => {return this.errors};

} //class closing brace
         

// !this will probably need to be removed
// module.exports = Validator;
