'use strict';

import {Session} from './Session';
import {Request, Response} from 'express-serve-static-core';
import {queryCallback} from 'mysql';

interface Lengths {
   [key: string]: number;

   content?: number;
   title?: number;
}

interface Error {
   tag: string;
   params?: string[];
}


export class Validator {
   static Tags: {[key: string]: string} = {
      noLogin: 'noLogin', // No active session/login
      noPermission: 'noPermission', // Login lacks permission.
      missingField: 'missingField', // Field missing. Params[0] is field name
      badValue: 'badValue', // Bad field value.  Params[0] is field name
      badLogin: 'badLogin', // Email/password combination invalid
      dupEmail: 'dupEmail', // Email duplicates an existing email
      noTerms: 'noTerms', // Acceptance of terms is required.
      forbiddenRole: 'forbiddenRole', // Cannot set to this role
      noOldPwd: 'noOldPwd', // Password change requires old password
      dupTitle: 'dupTitle', // Title duplicates an existing cnv title
      queryFailed: 'queryFailed',
      forbiddenField: 'forbiddenField',
      oldPwdMismatch: 'oldPwdMismatch',
      dupLike: 'dupLike',
   };

   private errors: Error[];
   private session: Session;
   private res: Response;

   //to pass validator as mysqlError
   code: string = '';
   errno: number = 0;
   fatal: boolean = true;
   name: string = '';
   message: string = '';

   constructor(req: Request, res: Response) {
      this.errors = []; // Array of error objects having tag and params
      this.session = req.session as Session;
      this.res = res;
   }

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
   check = (
      test: boolean | number,
      tag: string,
      params: any,
      cb: queryCallback
   ): boolean => {
      if (!test) this.errors.push({tag: tag, params: params});

      if (this.errors.length) {
         if (this.res) {
            if (this.errors[0].tag === Validator.Tags.noPermission)
               this.res.status(403).end();
            else this.res.status(400).json(this.errors);
            this.res = null; // Preclude repeated closings
         }
         if (cb) cb(this);
      }
      return !this.errors.length;
   };

   // Somewhat like |check|, but designed to allow several chained checks
   // in a row, finalized by a check call.
   chain = (
      test: boolean | number | string | Date,
      tag: string,
      params?: any
   ) => {
      if (!test) this.errors.push({tag: tag, params: params});

      return this;
   };

   checkAdmin = (cb?: queryCallback) => {
      return this.check(
         this.session && this.session.isAdmin(),
         Validator.Tags.noPermission,
         null,
         cb
      );
   };

   // Pass req.params.id to check whether endpoint is visited by either an
   //admin or that same person
   checkPrsOK = (prsId: number | string, cb: queryCallback) => {
      if (typeof prsId === 'string') prsId = parseInt(prsId);
      // AU must be person {prsId} or admin
      return this.check(
         this.session &&
            (this.session.isAdmin() || this.session.prsId === prsId),
         Validator.Tags.noPermission,
         null,
         cb
      );
   };

   // Check presence of truthy property in |obj| for all fields in fieldList
   hasFields = (obj: any, fieldList: string[], cb: queryCallback) => {
      var self = this;

      fieldList.forEach(function (name: string) {
         self.chain(
            obj.hasOwnProperty(name) && obj[name] !== null && obj[name] !== '',
            Validator.Tags.missingField,
            [name]
         );
      });

      return this.check(true, null, null, cb);
   };

   // Throws forbidden field for any fields other than specified in fieldList
   hasOnlyFields = (body: any, fieldList: string[], cb: queryCallback) => {
      var self = this;

      Object.keys(body).forEach(function (field: string) {
         self.chain(fieldList.includes(field), Validator.Tags.forbiddenField, [
            field,
         ]);
      });

      return this.check(true, null, null, cb);
   };

   hasOnlyFieldsChained = (
      body: any,
      fieldList: string[],
      cb: queryCallback
   ) => {
      var self = this;

      Object.keys(body).forEach(function (field: string) {
         self.chain(fieldList.includes(field), Validator.Tags.forbiddenField, [
            field,
         ]);
      });

      return this.chain(true, null, null);
   };

   checkFieldLengths = (body: any, lengths: Lengths, cb: queryCallback) => {
      var self = this;

      Object.keys(lengths).forEach(function (field) {
         if (Object.keys(body).includes(field))
            self.chain(
               body[field] &&
                  body[field].length <= lengths[field] &&
                  body[field] !== null &&
                  body[field] !== '',
               Validator.Tags.badValue,
               [field]
            );
      });

      return this.check(true, null, null, cb);
   };

   checkFieldLengthsChained = (
      body: any,
      lengths: Lengths,
      cb: queryCallback
   ) => {
      var self = this;

      Object.keys(lengths).forEach(function (field) {
         if (Object.keys(body).includes(field))
            self.chain(
               body[field] &&
                  body[field].length <= lengths[field] &&
                  body[field] !== null &&
                  body[field] !== '',
               Validator.Tags.badValue,
               [field]
            );
      });

      return this.chain(true, null, null);
   };

   getErrors = (): Error[] => {
      return this.errors;
   };
} 