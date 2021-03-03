import { combineReducers } from 'redux';

import Prs from './Prs';
import Cnvs from './Cnvs';

const rootReducer = combineReducers({Prs, Cnvs});

export default rootReducer;
