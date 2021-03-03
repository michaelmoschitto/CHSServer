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
// 5. Sign in and sign out operations that retain relevant
//    sessionId data.  Successful sign in returns promise 
//    resolving to newly signed in user.

const baseURL = "http://localhost:3001/";
const headers = new Headers();
var sessionId;

headers.set('Content-Type', 'application/JSON');

const reqConf = {
    headers: headers,
    credentials: 'include',
};

// Helper functions for the common request types, automatically
// adding verb, headers, and error management.
export function post(endpoint, body) {
    return fetch(baseURL + endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
        ...reqConf
    });
}

export function put(endpoint, body) {
    return fetch(baseURL + endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
        ...reqConf
    });
}

export function get(endpoint) {
    return fetch(baseURL + endpoint, {
        method: 'GET',
        ...reqConf
    });
}

export function del(endpoint) {
    return fetch(baseURL + endpoint, {
        method: 'DELETE',
        ...reqConf
    });
}

// Functions for performing the api requests

/**
 * Sign a user into the service, returning a promise of the 
 * user data
 * @param {{email: string, password: string}} cred
 */
export function signIn(cred) {
   return post("Ssns", cred)
    .then(response => {
        let location = response.headers.get("Location").split('/');
        sessionId = location[location.length - 1];
        return get("Ssns/" + sessionId);
    })
    .then(response => response.json())   // ..json() returns a Promise!
    .then(body => get('Prss/' + body.prsId))
    .then(userResponse => userResponse.json())
    .then(rsp => rsp[0]);
}

/**
 * @returns {Promise} result of the sign out request
 */
export function signOut() {
    return del("Ssns" + sessionId);
}

/**
 * Register a user
 * @param {Object} user
 * @returns {Promise resolving to new user as specified in post}
 */
export async function postPrs(user) {
    let rsp = await post("Prss", user);
    user.id = parseInt(rsp.headers.get("Location").split('/').pop());
    return user;
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
    let res = await get("Cnvs" + (userId ? "?owner="+userId : ""))
 
    return res.json();
 /*
    return get("Cnvs" + (userId ? "?owner="+userId : ""))
    .then((res) => res.json())
 */
 }

export function putCnv(id, body) {
    return put(`Cnvs/${id}`, body)
}

export function postCnv(body) {
    return post('Cnvs', body).then(rsp => {
      let location = rsp.headers.get("Location").split('/');
      return get(`Cnvs/${location[location.length-1]}`);
   })
   .then(rsp => rsp.json());
}

const errMap = {
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
        queryFailed: 'Query failed (server problem).'
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
        queryFailed: '[ES] Query failed (server problem).'
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
        queryFailed: 'Förfrågan misslyckades (server problem).'
    }
}

/**
 * @param {string} errTag
 * @param {string} lang
 */
export function errorTranslate(errTag, lang = 'en') {
    return errMap[errTag] || 'Unknown Error!';
}
