export default function Likes(state = [], action){
   
    switch(action.type){
        case 'UPDATE_LIKES':
            const id = parseInt(action.msgId);
            let likes = action.likes;

            //update likes 2D array, this makes sure to copy each 
            //index (array of likes) to new place
            // if(!state.id){
            //     console.log('id!: ', state.id)

            //     let newState = [];
            //     state.forEach((val) => newState[val.id] = val)

            //     newState[id] = likes;
            //     console.log(newState)
            //     return newState;
            // }
            // else
            //     return state;
            let newState = [];
            state.forEach((val) => newState[val.id] = val)
            newState[id] = likes;
            return newState

        case 'ADD_LIKE':
            // console.log(`state: ${state}`)
          
            
            // if(state[action.msgId].length){
            //     let x = state[action.msgId].concat(action.like);
            //     console.log('State after 1 like: ', x)
            //     return x
            // }else{
            //     return state[action.msgId].concat([action.like])
            // }
            let s = state;
            s[action.msgId].push(action.like)
            // let s = (state[action.msgId]).concat()
            return s
            
        default:
            return state;

    }
}