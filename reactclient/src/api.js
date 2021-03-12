// Orderly interface to the REST server, providing:
// 1. Standard URL base
// 2. Standard headers to manage CORS and content type
// 3. Guarantee that 4xx and 5xx results are returned as
//    rejected promises, with a payload comprising an
//    array of user-readable strings describing the error.
// 4. All successful post operations return promises that
//    resolve to a JS object representing the newly added
//    entity (all fields, not just those in the post body)
//    The only exception is Prss POST which cannot do this
//    due to login requirements.  Prss POST does the best
//    it can by returning the object it just added, augmented
//    with the proper ID.
// 5. Signin and signout operations that retain relevant
//    sessionId data.  Successful signin returns promise
//    resolving to newly signed in user.

// Server Errors show up as rejected promise, or exception in asynch await
//The problem is that the 400's are not thrown as exceptions, safe fetch makes 
// 400's act this way

const baseURL = 'http://localhost:3001/';
const headers = new Headers();
var sessionId;

headers.set('Content-Type', 'application/JSON');

const reqConf = {
   headers: headers,
   credentials: 'include',
};

// Helper functions for the common request types, automatically
// adding verb, headers, and error management.

export async function safeFetch(endpoint, method, body){
   var isUserError = false;
   var response;
   
   try{
      response = await doFetch(endpoint, method, body);
   
      if(response.ok)
         return response
      else{
         const errorBody = await response.json();
         isUserError = true;
         throw errorBody;
      }      
   }catch (err){ 
      
      if(isUserError){ //400's (badValue, dupTitle etc)
         throw err;
      }else{ // 500 server error
         const error = [{tag: "serverError"}]
         throw error;                 
      }
   }
};

async function doFetch(endpoint, method, body){
   let rsp;

   if(body){
      rsp = await fetch(baseURL + endpoint, {
        method: method,
        body: JSON.stringify(body),
        ...reqConf,
     });
     return rsp
     }else{
     rsp = await fetch(baseURL + endpoint, {
        method: method,
        ...reqConf,
     });
     return rsp;
   }
  }


// export async function safePost(endpoint, body){
//    var isUserError = false;

//    try{

//       const response = await fetch(baseURL + endpoint, {
//          method: 'POST',
//          body: JSON.stringify(body),
//          ...reqConf,
//       });

//       console.log('response: ', response)
   
//       if(response.ok)
//          return response
//       else{
//          const errorBody = await response.json();
//          isUserError = true;
//          throw errorBody;
//       }      
//    }catch (err){ 
//    //network err, the abscence of 200 will not automatically fail
//    // per https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
      
//       if(isUserError){ //400's (badValue, dupTitle etc)
//          throw err;
//       }else{ // 500 server error
//          const error = ["Server Connect Error"]
//          throw error;                 
//       }
//    }
// };

export function post(endpoint, body) {
   return safeFetch(endpoint, 'POST', body)
}

export function put(endpoint, body) {
   return safeFetch(endpoint, 'PUT', body)
}

export function get(endpoint) {
   return safeFetch(endpoint, 'GET', null)
}

export function del(endpoint) {
   return safeFetch(endpoint, 'DELETE', null)
}

// Functions for performing the api requests

/**
 * Sign a user into the service, returning a promise of the
 * user data
 * @param {{email: string, password: string}} cred
 */
// export function signIn(cred) {
//    return post('Ssns', cred)
//       .catch(err => {
//          console.log('ERROR DIALOG: ', err)
//          return Promise.reject(err);
//       })
//       .then(response => {
//          console.log('Response in chain ', response)
//          let location = 
//           response.headers.get('Location').split('/');
//          sessionId = location[location.length - 1];
//          return get('Ssns/' + sessionId);
//          // return get("Ssns/0");
//       })
//       .then(response => response.json()) // ..json() returns a Promise!
//       .then(body => get('Prss/' + body.prsId))
//       .then(userResponse => userResponse.json())
//       .then(rsp => rsp[0])
// }

export async function signIn(cred) {
   let postRsp;
   try{
      postRsp = await post('Ssns', cred);
      let location = postRsp.headers.get('Location').split('/');
      sessionId = location[location.length - 1];
      let session = await get('Ssns/' + sessionId);
      let body = await session.json();
      let prs = await get('Prss/' + body.prsId);
      let prsRsp = await prs.json()
      return prsRsp[0];
   
   }catch(err){
      throw err;
   }      
}

  



/**
 * @returns {Promise} result of the sign out request
 */
export function signOut() {
   return del('Ssns/' + sessionId);
}

/**
 * Register a user
 * @param {Object} user
 * @returns {Promise resolving to new user as specified in post}
 */
export async function postPrs(user) {
   try{
      let rsp = await post('Prss', user);
      user.id = parseInt(rsp.headers.get('Location').split('/').pop());
      return user;
   }catch(err){
      throw err;
   }
   /*
      return post("Prss", user)
      .then(rsp => {
         user.id = parseInt(rsp.headers.get("Location").split('/').pop());
         return user;
      })
   */
}

/**
 * @returns {Promise} json parsed data
 */
export async function getCnvs(userId) {
   console.log('getting cnvs in api.js')
   let res = await get('Cnvs' + (userId ? '?owner=' + userId : ''));

   return res.json();
   /*
      return get("Cnvs" + (userId ? "?owner="+userId : ""))
      .then((res) => res.json())
   */
}

export async function getCnvById(cnvId){
   let res = await get('Cnvs/' + (cnvId.toString()))

   return res.json()
}

// export function putCnv(id, body) {
//    return put(`Cnvs/${id}`, body)
//    .then(() => getCnvById(id))
//    .then(rsp => {
//       return rsp})
   
// }
export async function putCnv(id, body){
   try{
      await put(`Cnvs/${id}`, body);
      let changedCnv = await getCnvById(id);
      return changedCnv;

   }catch(err){
      throw err;
   }
}

// export function postCnv(body) {
//    return post('Cnvs', body)
//    .then(rsp => {
//       let location = rsp.headers.get('Location').split('/');
//       console.log("location: ", location)
//       return getCnvById(location[location.length - 1]);
//    })
// }

export async function postCnv(body){
   console.log('posting Cnv in api.js')
   try{
      let rsp = await post('Cnvs', body);
      let location = rsp.headers.get('Location').split('/');
      return getCnvById(location[location.length - 1]);
   }catch(err){
      throw err;
   }
}

// export function deleteCnv(id){
//    return del(`Cnvs/${id}`)
//    .then(rsp => get('Cnvs/'))
//    .then(cnvs => cnvs.json())

// }

export async function deleteCnv(id){
   try{  
      await del(`Cnvs/${id}`);
      let cnvs = await get('Cnvs/');

      return cnvs.json();
   }catch(err){
      throw err;
   };
}

export async function getMsgsByCnv(cnvId, dateTime = undefined, num = undefined){
   try{
      let msgs = await get(`Cnvs/${cnvId}/Msgs` + 
       (dateTime ? 'dateTime=' + dateTime.toString() : '') + 
       (num ? 'num=' + num.toString() : ''));

      return msgs.json();
   }catch(err){
      throw err;
   }
}

export async function getMsgsLikes(msgId){
   try{
      let likes = await get(`Msgs/${msgId}/Likes`);
      return likes.json();
   }catch(err){
      throw err;
   }
}

const errMap = {
   "en-US": {
      noAuth: 'Not Logged in',
      noPerm: 'Not permitted',
      notFound: 'Entity not present in DB',
      unknown: 'Unknown error',
      serverError: 'Server not reachable',
      missingField: 'Field missing from request: ',
      badValue: 'Field has bad value: ',
      badLogin: 'Email/password combination invalid',
      dupEmail: 'Email duplicates an existing email',
      noTerms: 'Acceptance of terms is required',
      forbiddenRole: 'Role specified is not permitted.',
      noOldPwd: 'Change of password requires an old password',
      oldPwdMismatch: 'Old password that was provided is incorrect.',
      dupTitle: 'Conversation title duplicates an existing one',
      dupEnrollment: 'Duplicate enrollment',
      forbiddenField: 'Field in body not allowed.',
      queryFailed: 'Query failed (server problem).',
   },
   en: {
      noAuth: 'Not Logged in',
      noPerm: 'Not permitted',
      notFound: 'Entity not present in DB',
      unknown: 'Unknown error',
      serverError: 'Server not reachable',
      missingField: 'Field missing from request: ',
      badValue: 'Field has bad value: ',
      badLogin: 'Email/password combination invalid',
      dupEmail: 'Email duplicates an existing email',
      noTerms: 'Acceptance of terms is required',
      forbiddenRole: 'Role specified is not permitted.',
      noOldPwd: 'Change of password requires an old password',
      oldPwdMismatch: 'Old password that was provided is incorrect.',
      dupTitle: 'Conversation title duplicates an existing one',
      dupEnrollment: 'Duplicate enrollment',
      forbiddenField: 'Field in body not allowed.',
      queryFailed: 'Query failed (server problem).',
   },
   es: {
      noAuth: '[ES] Not Logged in',
      noPerm: '[ES] Not permitted',
      notFound: '[ES] Entity not present in DB',
      unknown: '[ES] Unknown error',
      serverError: '[ES] Server not reachable',
      missingField: '[ES] Field missing from request: ',
      badValue: '[ES] Field has bad value: ',
      badLogin: '[ES] Email/password combination invalid',
      dupEmail: '[ES] Email duplicates an existing email',
      noTerms: '[ES] Acceptance of terms is required',
      forbiddenRole: '[ES] Role specified is not permitted.',
      noOldPwd: '[ES] Change of password requires an old password',
      oldPwdMismatch: '[ES] Old password that was provided is incorrect.',
      dupTitle: '[ES] Conversation title duplicates an existing one',
      dupEnrollment: '[ES] Duplicate enrollment',
      forbiddenField: '[ES] Field in body not allowed.',
      queryFailed: '[ES] Query failed (server problem).',
   },
   sv: {
      noAuth: '[SV] Not Logged in',
      noPerm: '[SV] Not permitted',
      notFound: 'Entitet saknas i DB',
      unknown: '[SV] Unknown error',
      serverError: '[SV] Server not reachable',
      missingField: 'Ett fält saknas: ',
      badValue: 'Fält har dåligt värde: ',
      badLogin: 'Email/lösenord kombination ogilltig',
      dupEmail: 'Email duplicerar en existerande email',
      noTerms: 'Villkoren måste accepteras',
      forbiddenRole: 'Angiven roll förjuden',
      noOldPwd: 'Tidiagre lösenord krav för att updatera lösenordet',
      oldPwdMismatch: 'Tidigare lösenord felaktigt',
      dupTitle: 'Konversationstitel duplicerar tidigare existerande titel',
      dupEnrollment: 'Duplicerad inskrivning',
      forbiddenField: 'Förbjudet fält i meddelandekroppen',
      queryFailed: 'Förfrågan misslyckades (server problem).',
   },
};

/**
 * @param {string} errTag
 * @param {string} lang
 */
export function errorTranslate(errTag, lang = 'en') {
   return errMap[lang][errTag] || 'Unknown Error!';
}

