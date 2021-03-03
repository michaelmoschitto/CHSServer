function Prs(state = {}, action) {
   switch(action.type) {
   case 'SIGN_IN':
      return action.user;
   case 'SIGN_OUT':
      return {}; // Clear user state
   default:
      return state;
   }
}

export default Prss;