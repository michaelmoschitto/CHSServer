export default function Cnvs(state = true, action) {
   switch (action.type) {
      case 'ORDER_BY_DATE':
         return true;
      case 'ORDER_BY_LIKES':
         return false;
      default:
         return state;
   }
}
