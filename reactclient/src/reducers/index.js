import { combineReducers } from 'redux';

import Prs from './Prs';
import Cnvs from './Cnvs';
import Errors from './Errors'

const rootReducer = combineReducers({Prs, Cnvs, Errors});

export default rootReducer;
