// Create a validator that draws its session from |req|, and reports
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
var { Session, } = require('./Session.js');
;
class Validator {
    // check(test: string | number, tag: string, params: any, cb: queryCallback)
    //  => number;
    constructor(req, res) {
        //now can pass validator as mysqlError 
        this.code = "";
        this.errno = 0;
        this.fatal = true;
        this.name = "";
        this.message = "";
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
        this.check = (test, tag, params, cb) => {
            if (!test) {
                this.errors.push({ tag: tag, params: params });
            }
            if (this.errors.length) {
                if (this.res) {
                    if (this.errors[0].tag === Validator.Tags.noPermission)
                        this.res.status(403).end();
                    else
                        this.res.status(400).json(this.errors);
                    this.res = null; // Preclude repeated closings
                }
                if (cb)
                    cb(this);
            }
            return !this.errors.length;
        };
        // Somewhat like |check|, but designed to allow several chained checks
        // in a row, finalized by a check call.
        this.chain = (test, tag, params) => {
            if (!test) {
                this.errors.push({ tag: tag, params: params });
            }
            return this;
        };
        this.checkAdmin = (cb) => {
            return this.check(this.session && this.session.isAdmin(), Validator.Tags.noPermission, null, cb);
        };
        // Validate that AU is the specified person or is an admin
        // * CORRECT
        this.checkPrsOK = (prsId, cb) => {
            if (typeof (prsId) === 'string')
                prsId = parseInt(prsId);
            // if(!Session.findById(prsId) &&)
            //    return false;
            return this.check(this.session &&
                // AU must be person {prsId} or admin
                (this.session.isAdmin() || this.session.prsId === prsId), Validator.Tags.noPermission, null, cb);
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
        this.hasFields = (obj, fieldList, cb) => {
            var self = this;
            fieldList.forEach(function (name) {
                self.chain(obj.hasOwnProperty(name) && obj[name] !== null &&
                    obj[name] !== "", Validator.Tags.missingField, [name]);
            });
            return this.check(true, null, null, cb);
        };
        // Throws forbidden field for any fields other than specified in fieldList
        this.hasOnlyFields = (body, fieldList, cb) => {
            var self = this;
            Object.keys(body).forEach(function (field) {
                self.chain(fieldList.includes(field), Validator.Tags.forbiddenField, [field]);
            });
            return this.check(true, null, null, cb);
        };
        this.checkFieldLengths = (body, lengths, cb) => {
            var self = this;
            Object.keys(body).forEach(function (field) {
                if (Object.keys(lengths).includes(field))
                    //
                    self.chain(body[field] && body[field].length <= lengths[field] && body[field] !== null && body[field] !== "", Validator.Tags.badValue, [field]);
            });
            return this.check(true, null, null, cb);
        };
        this.getErrors = () => { return this.errors; };
        this.errors = []; // Array of error objects having tag and params
        this.session = req.session;
        this.res = res;
    }
    ;
} //class closing brace
exports.Validator = Validator;
Validator.Tags = {
    noLogin: "noLogin",
    noPermission: "noPermission",
    missingField: "missingField",
    badValue: "badValue",
    notFound: "notFound",
    badLogin: "badLogin",
    dupEmail: "dupEmail",
    noTerms: "noTerms",
    forbiddenRole: "forbiddenRole",
    noOldPwd: "noOldPwd",
    dupTitle: "dupTitle",
    queryFailed: "queryFailed",
    forbiddenField: "forbiddenField",
    oldPwdMismatch: "oldPwdMismatch",
    dupLike: "dupLike"
};
