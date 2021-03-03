// This middleware assumes cookieParser has been "used" before this

import {randomBytes} from 'crypto';
import {Response, Request, NextFunction} from 'express';

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

type user = {
   id: number;
   firstName: string;
   lastName: string;
   email: string;
   role: number;
};

export class Session {
   // All currently logged-in Sessions indexed by token
   private static ssnsByCookie: {[key: string]: Session} = {};

   // Sessions by sequential session ID
   private static ssnsById: Session[] = [];

   static readonly duration = 7200000; // Two hours in milliseconds
   static readonly cookieName = 'CHSAuth'; // Cookie key for auth tokens

   id: number; // ID of session
   prsId: number; // ID of person logged in
   authToken: string;
   firstName: string;
   lastName: string;
   email: string;
   role: number;
   lastUsed: number;
   loginTime: number;

   constructor(user: user, res: Response) {
      let authToken = randomBytes(16).toString('hex'); // Make random token

      res.cookie(Session.cookieName, authToken, {
         maxAge: Session.duration,
         httpOnly: true,
      });
       
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

   //Session.methods
   static findById = (id: number | string) => Session.ssnsById[id as number];
   static findByCookie = (cookie: string) => Session.ssnsByCookie[cookie];
   static getAllIds = () => Object.keys(Session.ssnsById);

   static resetAll = () => {
      Session.ssnsById = [];
      Session.ssnsByCookie = {};
   };

   static logoutAll = () => {
      Session.ssnsById = [];
      Session.ssnsByCookie = {};
   };

   static removeAllSessions = (id: string | number) => {
      id = parseInt(id as string);

      Session.ssnsById.forEach(s => {
         if (id === s.prsId) {
            delete Session.ssnsById[s.id];
            delete Session.ssnsByCookie[s.authToken];
         }
      });
   };

   isAdmin = () => {
      return this.role === 1;
   };

   // Log out a user by removing this Session
   logOut = (id: number) => {
      // not going to always log out curent ssn (admin logging out user)
      var ssn: Session = Session.ssnsById[id];
      var cki: string = ssn.authToken;
      delete Session.ssnsById[id];
      delete Session.ssnsByCookie[cki];
   };
}

// Function router that will find any Session associated with |req|, based on
// cookies, delete the Session if it has timed out, or attach the Session to
// |req| if it's current If |req| has an attached Session after this process,
// then down-chain routes will treat |req| as logged-in.
export let router = (req: Request, res: Response, next: NextFunction) => {
   var cookie: string = req.cookies[Session.cookieName];
   var session: string | Session = cookie && Session.findByCookie(cookie);

   if (session) {
      // If the session was last used more than |duration| mS ago..
      if (session.lastUsed < new Date().getTime() - Session.duration)
         session.logOut(session.prsId);
      else
         req.session = session;
   }

   next();
};

