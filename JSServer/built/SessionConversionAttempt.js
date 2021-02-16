"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
// This middleware assumes cookieParser has been "used" before this
// var crypto = require('crypto');
const crypto_1 = require("crypto");
var ssnsByCookie = {}; // All currently logged-in Sessions indexed by token
var ssnsById = []; // Same, but indexed by sequential session ID
var duration = 7200000; // Two hours in milliseconds
var cookieName = 'CHSAuth'; // Cookie key for authentication tokens
class Session {
    constructor(user, res) {
        this.isAdmin = () => {
            return this.role === 1;
        };
        this.logoutAll = () => {
            ssnsById = [];
            ssnsByCookie = [];
        };
        // Log out a user by removing this Session
        this.logOut = (id) => {
            var ssn = Session.ssnsById[id];
            var cki = ssn.authToken;
            // * not going to always log out curent ssn (admin logging out user)
            delete Session.ssnsById[id];
            delete Session.ssnsByCookie[cki];
            console.log("test");
        };
        let authToken = crypto_1.randomBytes(16).toString('hex'); // Make random token
        res.cookie(Session.cookieName, authToken, { maxAge: Session.duration, httpOnly: true }); // 1
        Session.ssnsByCookie[authToken] = this;
        Session.ssnsById.push(this);
        this.id = Session.ssnsById.length - 1;
        this.authToken = authToken;
        this.prsId = user.id;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.role = user.role;
        this.loginTime = this.lastUsed = new Date().getTime();
    }
    ;
}
exports.Session = Session;
// All currently logged-in Sessions indexed by token
Session.ssnsByCookie = {};
// Sessions by sequential session ID
Session.ssnsById = [];
Session.duration = 7200000; // Two hours in milliseconds
Session.cookieName = 'CHSAuth'; // Cookie key for auth tokens
Session.findById = (id) => Session.ssnsById[id];
Session.getAllIds = () => Object.keys(Session.ssnsById);
Session.resetAll = () => {
    Session.ssnsById = [];
    Session.ssnsByCookie = {};
};
; //End of class Paren
Session.removeAllSessions = (id) => {
    id = parseInt(id);
    ssnsById.forEach((s) => {
        if (id === s.prsId) {
            delete ssnsById[s.id];
            delete ssnsByCookie[s.authToken];
            console.log(s);
            console.log(ssnsByCookie[s.authToken]);
            console.log("done deleting all sessions");
        }
    });
    // ssnsByCookie = [];
};
Session.getAllIds = () => Object.keys(ssnsById);
// * Converts ssn id (not prsId) to ssn
Session.findById = id => ssnsById[id];
// Function router that will find any Session associated with |req|, based on
// cookies, delete the Session if it has timed out, or attach the Session to
// |req| if it's current If |req| has an attached Session after this process,
// then down-chain routes will treat |req| as logged-in.
var router = function (req, res, next) {
    var cookie = req.cookies[cookieName];
    var session = cookie && ssnsByCookie[cookie];
    if (session) {
        // If the session was last used more than |duration| mS ago..
        if (session.lastUsed < new Date().getTime() - duration)
            session.logOut();
        else {
            req.session = session;
        }
    }
    next();
};
module.exports = { Session, router };
