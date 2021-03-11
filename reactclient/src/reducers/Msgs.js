export default function Msgs(state = {}, action){
    switch(action.type){
        case 'UPDATE_MSGS': 
            console.log('update msgs in store')
            return action.msgs;

        case 'ADD_MSG':
            // return state.concat([action.msg])
            console.log('Add msg in store')
            return state; 
            
        default:
            return state;
    }
}