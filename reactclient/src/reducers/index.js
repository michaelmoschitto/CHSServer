import { combineReducers } from 'redux';

import Prs from './Prs';
import Cnvs from './Cnvs';
import Errors from './Errors'
import Msgs from './Msgs'

const rootReducer = combineReducers({Prs, Cnvs, Errors, Msgs});

export default rootReducer;
