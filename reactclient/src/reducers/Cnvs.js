export default function Cnvs(state = [], action) {
   switch (action.type) {
      case 'UPDATE_CNVS': // Replace previous cnvs
         return action.cnvs; //updates cnvs 
      case 'UPDATE_CNV':
         /* Example of wrongness
         state.forEach(cnv => {
            if (cnv.id === action.data.cnvId)
               cnv.title = action.data.title;
         });
         return state;*/
         return state.map(val => val.id !== action.data.cnvId ?
            val : Object.assign({}, val, { title: action.data.title }));
      case 'ADD_CNV':
         return state.concat([action.cnv]);
      default:
         return state;
   }
}
