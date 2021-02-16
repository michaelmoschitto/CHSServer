"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This middleware assumes cookieParser has been "used" before this
var crypto = require('crypto');
var ssnsByCookie = {}; // All currently logged-in Sessions indexed by token
var ssnsById = []; // Same, but indexed by sequential session ID
var duration = 7200000; // Two hours in milliseconds
var cookieName = 'CHSAuth'; // Cookie key for authentication tokens
// Session-constructed objects represent an ongoing login session, including
// user details, login time, and time of last use, the latter for the purpose
// of timing out sessions that have been unused for too long.
// 
// Creating an authToken and register the relevant cookie.  Add the new session
// to both |ssnsByCookie| indexed by the authToken and to |ssnsById| indexed
// by session id.  Fill in session members from the supplied user object
//
// 1 Cookie is tagged by |cookieName|, times out on the client side after
// |duration| (though the router, below, will check anyway to prevent hacking),
// and will not be shown by the browser to the user, again to prevent hacking.
// type user = {
//    id: number;
//    firstName: string;
//    lastName: string;
//    email: string;
//    role: number;
// };
var Session = function (user, res) {
    var authToken = crypto.randomBytes(16).toString('hex'); // Make random token
    res.cookie(cookieName, authToken, { maxAge: duration, httpOnly: true }); // 1
    ssnsByCookie[authToken] = this;
    ssnsById.push(this);
    this.id = ssnsById.length - 1;
    this.authToken = authToken;
    this.prsId = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.role = user.role;
    this.loginTime = this.lastUsed = new Date().getTime();
};
//   WHY DOESNT THIS WORK?
// Session.logoutAll = function () {
//    console.log("alive!");
//    this.ssnsById = [];
//    this.ssnsByCookie = [];
//    this.ssnsById.push('100');
// };
Session.prototype.isAdmin = function () {
    return this.role === 1;
};
Session.logoutAll = () => {
    ssnsById = [];
    ssnsByCookie = [];
};
// Log out a user by removing this Session
Session.prototype.logOut = function (id) {
    var ssn = ssnsById[id];
    var cki = ssn.authToken;
    // * not going to always log out curent ssn (admin logging out user)
    delete ssnsById[id];
    delete ssnsByCookie[cki];
    console.log("test");
};
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
