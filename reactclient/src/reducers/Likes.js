export default function Likes(state = [], action) {   
   switch (action.type) {
      case 'UPDATE_LIKES':
         const id = parseInt(action.msgId);
         let likes = action.likes;

         let newState = [];
         state.forEach((val, i) => {
            newState[i] = val;
         });
         newState[id] = likes;
         return newState;

      case 'ADD_LIKE':
         
         let s = [...state]

         s[action.msgId].push(action.like)
         return s;

      default:
         return state;
   }
}
