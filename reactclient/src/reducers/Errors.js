export default function Errors(state = [], action){
    switch (action.type){
        case 'REGISTER_ERR':
            return action.details;
        case 'CLEAR_ERRS':
            return {}
        default:
            return state;
    }
}