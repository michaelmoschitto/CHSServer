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
         })
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));

   };
}

export function register(data, cb) {
   return (dispatch, prevState) => {
      api.postPrs(data)
         .then(() => {
            if (cb) cb();
         })
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));

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
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}))
         .then(() => {
            if (cb) cb();
         });
   };
}

export function delCnv(cnvId, cb){
   return (dispatch, prevState) => {
      api.deleteCnv(cnvId)
      .then(cnvs => {
         return dispatch({type: 'DELETE_CNV', cnvId: cnvId})
      })
      .catch(error => dispatch({type: 'REGISTER_ERR', details: error}))
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
      .catch(error => dispatch({type: 'REGISTER_ERR', details: error}))
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
      .catch(error => dispatch({type: 'REGISTER_ERR', details: error}))
      .then(() => {if(cb) cb()});
   }
}

export function postLike(msgId, Prs, likeAble, cb){
   return (dispatch, prevState) => {
      if(likeAble){
         api.postLike(msgId)
         .then((rsp) => {
            
            let likeObj = {}
            likeObj['id'] = -1;
            likeObj['prsId'] = Prs.id;
            likeObj['firstName'] = Prs.firstName;
            likeObj['lastName'] = Prs.lastName;
            console.log('posting like')
            dispatch({type: 'ADD_LIKE', msgId: msgId, like: likeObj})
         })
         .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));   
      }
    }
}

export function postMsg(cnvId, content, cb){
   return (dispatch, prevState) => {
      api.postMsg(cnvId, content)
      .then(msgs => dispatch({type: 'UPDATE_MSGS', msgs: msgs}))
      .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));
   }
}

export function getPrsMsgs(prsId, order="", num="", cb){
   return (dispatch, prevState) => {
      console.log('gettting Prs Messages')
      api.getPrsMsgs(prsId, order, num)
      .then(msgs => {
         console.log('msgs: ', msgs)
         dispatch({type: 'UPDATE_MSGS', msgs: msgs})})
      .then(() => {
         if (cb) cb();
      })
      .catch(error => dispatch({type: 'REGISTER_ERR', details: error}));

   }
}

export function setOrderBy(type){
   return (dispatch, prevState) => {
   type === 'Date' ? dispatch({type: 'ORDER_BY_DATE'})
   : dispatch({type: 'ORDER_BY_LIKES'})
   }
}
