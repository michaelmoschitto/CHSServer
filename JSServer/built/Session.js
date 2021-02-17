"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = exports.Session = void 0;
// This middleware assumes cookieParser has been "used" before this
// var crypto = require('crypto');
const crypto_1 = require("crypto");
class Session {
    constructor(user, res) {
        this.isAdmin = () => { return this.role === 1; };
        // Log out a user by removing this Session
        this.logOut = (id) => {
            // not going to always log out curent ssn (admin logging out user)
            var ssn = Session.ssnsById[id];
            var cki = ssn.authToken;
            delete Session.ssnsById[id];
            delete Session.ssnsByCookie[cki];
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
//Session. methods
Session.findById = (id) => Session.ssnsById[id];
Session.findByCookie = (cookie) => Session.ssnsByCookie[cookie];
Session.getAllIds = () => Object.keys(Session.ssnsById);
Session.resetAll = () => {
    Session.ssnsById = [];
    Session.ssnsByCookie = {};
};
Session.logoutAll = () => {
    Session.ssnsById = [];
    Session.ssnsByCookie = {};
};
Session.removeAllSessions = (id) => {
    id = parseInt(id);
    Session.ssnsById.forEach((s) => {
        if (id === s.prsId) {
            delete Session.ssnsById[s.id];
            delete Session.ssnsByCookie[s.authToken];
            // console.log(s);
            // console.log(ssnsByCookie[s.authToken]);
            // console.log("done deleting all sessions");
        }
    });
};
; //End of class Paren
// Function router that will find any Session associated with |req|, based on
// cookies, delete the Session if it has timed out, or attach the Session to
// |req| if it's current If |req| has an attached Session after this process,
// then down-chain routes will treat |req| as logged-in.
let router = (req, res, next) => {
    var cookie = req.cookies[Session.cookieName];
    var session = cookie && Session.findByCookie(cookie);
    if (session) {
        // If the session was last used more than |duration| mS ago..
        if (session.lastUsed < new Date().getTime() - Session.duration)
            session.logOut(session.prsId);
        else {
            req.session = session;
        }
    }
    next();
};
exports.router = router;
// module.exports = {Session, router};
