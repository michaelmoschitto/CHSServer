export default function Msgs(state = {}, action){
    switch(action.type){
        case 'UPDATE_MSGS': 
            return action.msgs;

        case 'ADD_MSG':
            // return state.concat([action.msg])
            return state; 
            
        default:
            return state;
    }
}