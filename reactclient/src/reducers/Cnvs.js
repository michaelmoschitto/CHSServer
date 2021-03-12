export default function Cnvs(state = [], action) {
   switch (action.type) {
      case 'UPDATE_CNVS': // Replace previous cnvs
         // console.log('updating all cnvs in store')
         return action.cnvs;
      case 'UPDATE_CNV':
         return state.map(val => {
            console.log('Val:', val)
            return val && (val.id !== action.data.id ? 
             val : Object.assign({}, val, {title: action.data.title}))
            }
         );
         
      case 'ADD_CNV':
         //this sucked what a hack :/
         let dup = false; 
         state.forEach((cnv) => {
            if(parseInt(cnv.id) === parseInt(action.cnv.id))
               dup = true;
         })

         if(!dup)
            return state.concat([action.cnv])
         else  
            return state;
      default:
         return state;
   }
}