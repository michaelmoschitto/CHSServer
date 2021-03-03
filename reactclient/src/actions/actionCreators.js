import * as api from '../api';

export function signIn(credentials, cb) {
   return (dispatch, prevState) => {
      api.signIn(credentials)
      .then((userInfo) => dispatch({type: "SIGN_IN", user: userInfo}))
      .then(() => {if (cb) cb();})
   };
}

export function signOut(cb) {
   return (dispatch, prevState) => {
      api.signOut()
      .then(() => dispatch({ type: 'SIGN_OUT' }))
      .then(() => {if (cb) cb();});
   };
}

export function register(data, cb) {
   return (dispatch, prevState) => {
      api.register(data)
      .then(() => {if (cb) cb();})
      .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));
   };
}

export function updateCnvs(userId, cb) {
   return (dispatch, prevState) => {
      api.getCnvs(userId)
      .then((cnvs) => dispatch({ type: 'UPDATE_CNVS', cnvs })) //this will update cnvs
      .then(() => {if (cb) cb();});
   };
}

export function addCnv(newCnv, cb) {
   return (dispatch, prevState) => {
      api.postCnv(cnv)
      .then(cnvRsp => dispatch({type: 'ADD_CNV', cnv: newCnv}))
      .then(() => {if (cb) cb();});
   };
}

export function modCnv(cnvId, title, cb) {
   return (dispatch, prevState) => {
      api.putCnv(cnvId, {title})
      .then((cnvs) => dispatch({type: 'UPDATE_CNVS', data: cnvs))
      .then(() => {if (cb) cb();});
   };
}