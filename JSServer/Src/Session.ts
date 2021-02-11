// This middleware assumes cookieParser has been "used" before this
import {randomBytes} from 'crypto';
import {Response, Request} from 'express';

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
}

export class Session {
   // All currently logged-in Sessions indexed by token
   private static ssnsByCookie: {[key: string]: Session} = {}; 
   
   // Sessions by sequential session ID
   private static ssnsById: Session[] = [];  
   
   static readonly duration = 7200000;     // Two hours in milliseconds
   static readonly cookieName = 'CHSAuth'; // Cookie key for auth tokens
   
   static findById = (id:number|string) => Session.ssnsById[id as number];
   static getAllIds = () => Object.keys(Session.ssnsById);
   
   static resetAll = () => {
      Session.ssnsById = [];
      Session.ssnsByCookie = {};
   }

   id: number;         // ID of session
   prsId: number;      // ID of person logged in
   authToken: string;
   firstName: string;
   lastName: string;
   email: string;
   role: number;
   lastUsed: number;
   loginTime: number;

   constructor(user: user, res: Response) {
      let authToken = randomBytes(16).toString('hex');  // Make random token
      
      res.cookie(Session.cookieName, authToken,
         {maxAge: Session.duration, httpOnly: true }); // 1
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
   };
   
   isAdmin = () => this.role === 1;
   
   // Log out a user by removing this Session
   logOut() {
      delete Session.ssnsById[this.id];
      delete Session.ssnsByCookie[this.authToken];
   };
   
   // Function router that will find any Session associated with |req|, based on
   // cookies, delete the Session if it has timed out, or attach the Session to
   // |req| if it's current If |req| has an attached Session after this process,
   // then down-chain routes will treat |req| as logged-in.
   static router = function(req: Request, res: Response, next: Function) {
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
}