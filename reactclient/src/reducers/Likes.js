export default function Likes(state = [], action){
    switch(action.type){
        case 'UPDATE_LIKES':
            const id = parseInt(action.msgId);
            let likes = action.likes;

            if(!state.id){
                let newState = [];
                state.forEach((val) => newState[val.id] = val)
                newState[id] = likes;
                return newState;
            }
            else
                return state;

        case 'ADD_LIKES':
        
            return 
        default:
            return state;

    }
}