import * as api from '../api';

export function signIn(credentials, cb) {
   return (dispatch, prevState) => {
      api.signIn(credentials)
         .then(userInfo => dispatch({type: 'SIGN_IN', user: userInfo}))
         .then(() => {
            if (cb) cb();
         })
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));
   };
}

export function signOut(cb) {
   return (dispatch, prevState) => {
      api.signOut()
         .then(() => dispatch({type: 'SIGN_OUT'}))
         .then(() => {
            if (cb) cb();
         });
   };
}

export function register(data, cb) {
   return (dispatch, prevState) => {
      api.postPrs(data)
         .then(() => {
            if (cb) cb();
         })
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));
         // .catch(error => dispatch({type: 'REGISTER_ERR',
         //  details: {tag: 'FakeError', params: 'Is This working???'}}));

   };
}

export function updateCnvs(userId, cb) {
   return (dispatch, prevState) => {
      api.getCnvs(userId)
         .then(cnvs => {dispatch({type: 'UPDATE_CNVS', cnvs})})
         .then(() => {
            if (cb) cb();
         });
   };
}

export function addCnv(newCnv, cb) {
   return (dispatch, prevState) => {
      api.postCnv(newCnv)
         .then(cnvRsp => { 
            dispatch({type: 'ADD_CNV', cnv: cnvRsp})
         })
         .then(() => {
            if (cb) cb();
         })
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));
   };
}

export function modCnv(cnvId, title, cb) {
   return (dispatch, prevState) => {
      api.putCnv(cnvId, {title})
         .then(cnvs => {
            return dispatch({type: 'UPDATE_CNV', data: cnvs});
         })

         .then(() => {
            if (cb) cb();
         });
   };
}

export function delCnv(cnvId, cb){
   return (dispatch, prevState) => {
      api.deleteCnv(cnvId)
      .then(cnvs => {
         return dispatch({type: 'UPDATE_CNVS', cnvs: cnvs})
      })
      .then(() => {
         if (cb) cb();
      });
   };
}

export function clearErrors(cb){
   return (dispatch, prevState) => {
      return dispatch({type: 'CLEAR_ERRS'});
   };
}

export function translateError(tag, lang='en', params, cb){
   return () => api.errorTranslate(tag, lang)
};

export function getMsgsByCnv(cnvId, cb){
   return (dispatch, prevState) => {
      api.getMsgsByCnv(cnvId)
      .then(msgs => dispatch({type: 'UPDATE_MSGS', msgs: msgs}))
      .then(() => {
         if (cb) cb();
      })
   }
}

export function getMsgsLikes(msgId, cb){
   return (dispatch, prevState) => {
      api.getMsgsLikes(msgId)
      .then((likes) => {
         return dispatch({type: 'UPDATE_LIKES', likes: likes, msgId: msgId})
      })
      .then(() => {if(cb) cb()});
   }
}

export function postLike(msgId, Prs, likeAble, cb){
   return (dispatch, prevState) => {
      if(likeAble){

      
         api.postLike(msgId)
         .then((rsp) => {
            // {id: 3, prsId: 3, firstName: "FirstM", lastName: "LastM"}

            let likeObj = {}
            likeObj['id'] = -1;
            likeObj['prsId'] = Prs.id;
            likeObj['firstName'] = Prs.firstName;
            likeObj['lastName'] = Prs.lastName;
            dispatch({type: 'ADD_LIKE', msgId: msgId, like: likeObj})
         })
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));
      // .catch()
   
      }
    }
}
