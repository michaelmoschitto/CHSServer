import { combineReducers } from 'redux';

import Prs from './Prs';
import Cnvs from './Cnvs';
import Errors from './Errors'
import Msgs from './Msgs'
import Likes from './Likes'
import Order from './Order'

const rootReducer = combineReducers({Prs, Cnvs, Errors, Msgs, Likes, Order});

export default rootReducer;
