"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
// This middleware assumes cookieParser has been "used" before this
const crypto_1 = require("crypto");
class Session {
    constructor(user, res) {
        this.isAdmin = () => this.role === 1;
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
    // Log out a user by removing this Session
    logOut() {
        delete Session.ssnsById[this.id];
        delete Session.ssnsByCookie[this.authToken];
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
// Function router that will find any Session associated with |req|, based on
// cookies, delete the Session if it has timed out, or attach the Session to
// |req| if it's current If |req| has an attached Session after this process,
// then down-chain routes will treat |req| as logged-in.
Session.router = function (req, res, next) {
    var cookie = req.cookies[Session.cookieName];
    var session = cookie && Session.ssnsByCookie[cookie];
    if (session) {
        // If the session was last used more than |duration| mS ago..
        if (session.lastUsed < new Date().getTime() - Session.duration)
            session.logOut();
        else {
            req.session = session;
        }
    }
    next();
};
