export default function Msgs(state = {}, action){
    switch(action.type){
        case 'UPDATE_MSGS': 
            return action.msgs;
            // let newState = [];
            // state.forEach((val) => newState[val.msg] = val)
            // newState[id] = likes;
            // return newState

        case 'ADD_MSG':
            // return state.concat([action.msg])
            return state; 
            
        default:
            return state;
    }
}