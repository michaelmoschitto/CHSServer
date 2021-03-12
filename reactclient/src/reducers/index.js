import { combineReducers } from 'redux';

import Prs from './Prs';
import Cnvs from './Cnvs';
import Errors from './Errors'
import Msgs from './Msgs'
import Likes from './Likes'

const rootReducer = combineReducers({Prs, Cnvs, Errors, Msgs, Likes});

export default rootReducer;
