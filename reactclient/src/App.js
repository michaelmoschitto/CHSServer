import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as actionCreators from './actions/actionCreators';
import Main from './components/Main/Main';
import { propTypes } from 'react-bootstrap/esm/Image';

// State properties automatically passed to Main
function mapStateToProps(state) {
   return {
      Prs: state.Prs,
      Cnvs: state.Cnvs
   };
}

// Function properties automatically passed to Main
function mapDispatchToProps(dispatch) {
   return bindActionCreators(actionCreators, dispatch);
}

const App = withRouter(connect(
   mapStateToProps,
   mapDispatchToProps
)(Main));


export default App;