'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
class Validator {
    constructor(req, res) {
        //to pass validator as mysqlError
        this.code = '';
        this.errno = 0;
        this.fatal = true;
        this.name = '';
        this.message = '';
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
            if (!test)
                this.errors.push({ tag: tag, params: params });
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
            if (!test)
                this.errors.push({ tag: tag, params: params });
            return this;
        };
        this.checkAdmin = (cb) => {
            return this.check(this.session && this.session.isAdmin(), Validator.Tags.noPermission, null, cb);
        };
        // Pass req.params.id to check whether endpoint is visited by either an
        //admin or that same person
        this.checkPrsOK = (prsId, cb) => {
            if (typeof prsId === 'string')
                prsId = parseInt(prsId);
            // AU must be person {prsId} or admin
            return this.check(this.session &&
                (this.session.isAdmin() || this.session.prsId === prsId), Validator.Tags.noPermission, null, cb);
        };
        // Check presence of truthy property in |obj| for all fields in fieldList
        this.hasFields = (obj, fieldList, cb) => {
            var self = this;
            fieldList.forEach(function (name) {
                self.chain(obj.hasOwnProperty(name) && obj[name] !== null && obj[name] !== '', Validator.Tags.missingField, [name]);
            });
            return this.check(true, null, null, cb);
        };
        // Throws forbidden field for any fields other than specified in fieldList
        this.hasOnlyFields = (body, fieldList, cb) => {
            var self = this;
            Object.keys(body).forEach(function (field) {
                self.chain(fieldList.includes(field), Validator.Tags.forbiddenField, [
                    field,
                ]);
            });
            return this.check(true, null, null, cb);
        };
        this.hasOnlyFieldsChained = (body, fieldList, cb) => {
            var self = this;
            Object.keys(body).forEach(function (field) {
                self.chain(fieldList.includes(field), Validator.Tags.forbiddenField, [
                    field,
                ]);
            });
            return this.chain(true, null, null);
        };
        this.checkFieldLengths = (body, lengths, cb) => {
            var self = this;
            Object.keys(lengths).forEach(function (field) {
                if (Object.keys(body).includes(field))
                    self.chain(body[field] &&
                        body[field].length <= lengths[field] &&
                        body[field] !== null &&
                        body[field] !== '', Validator.Tags.badValue, [field]);
            });
            return this.check(true, null, null, cb);
        };
        this.checkFieldLengthsChained = (body, lengths, cb) => {
            var self = this;
            Object.keys(lengths).forEach(function (field) {
                if (Object.keys(body).includes(field))
                    self.chain(body[field] &&
                        body[field].length <= lengths[field] &&
                        body[field] !== null &&
                        body[field] !== '', Validator.Tags.badValue, [field]);
            });
            return this.chain(true, null, null);
        };
        this.getErrors = () => {
            return this.errors;
        };
        this.errors = []; // Array of error objects having tag and params
        this.session = req.session;
        this.res = res;
    }
}
exports.Validator = Validator;
Validator.Tags = {
    noLogin: 'noLogin',
    noPermission: 'noPermission',
    missingField: 'missingField',
    badValue: 'badValue',
    badLogin: 'badLogin',
    dupEmail: 'dupEmail',
    noTerms: 'noTerms',
    forbiddenRole: 'forbiddenRole',
    noOldPwd: 'noOldPwd',
    dupTitle: 'dupTitle',
    queryFailed: 'queryFailed',
    forbiddenField: 'forbiddenField',
    oldPwdMismatch: 'oldPwdMismatch',
    dupLike: 'dupLike',
};
