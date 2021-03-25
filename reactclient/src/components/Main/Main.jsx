import React from 'react';
import {
   Register,
   SignIn,
   CnvOverview,
   CnvDetail,
   ErrorModal,
   MsgOverView,
} from '../components';
import {Route, Redirect, Switch} from 'react-router-dom';
import {Navbar, Nav} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';
import {useSelector} from 'react-redux';

import './Main.css';

var ProtectedRoute = ({component: Cmp, path, ...rest}) => {
   const Prs = useSelector(store => store.Prs);

   return (
      <Route
         path={path}
         render={props => {
            return Object.keys(Prs).length !== 0 ? (
               <Cmp {...rest} />
            ) : (
               <Redirect to="/signin" />
            );
         }}
      />
   );
};

const Main = props => {
   const Prs = useSelector(store => store.Prs);

   let signedIn = () => Prs && Object.keys(Prs).length !== 0;

   return (
      <div>
         <div>
            <Navbar expand="md" className="ml-auto">
               <Navbar.Toggle />
               <Navbar.Collapse>
                  <Nav variant="pills">
                     {signedIn()
                        ? [
                             <LinkContainer to="/allCnvs" key={0}>
                                 <Nav.Link> All Conversations</Nav.Link>
                             </LinkContainer>,
                             <LinkContainer to="/myCnvs" key={1}>
                                 <Nav.Link>My Conversations</Nav.Link>
                             </LinkContainer>,

                             <LinkContainer to="/myMessages" key={2}>
                                 <Nav.Link>My Messages</Nav.Link>
                             </LinkContainer>,
                          ]
                        : [
                             <LinkContainer to="/signin" key={0}>
                                 <Nav.Link>Sign In</Nav.Link>
                             </LinkContainer>,
                             <LinkContainer to="/register" key={1}>
                                 <Nav.Link>Register</Nav.Link>
                             </LinkContainer>,
                          ]}
                  </Nav>
                  {signedIn()
                     ? [
                          <Navbar.Collapse
                              style={{'color' : '#808080'}}
                              key={0}
                              className="justify-content-end"
                          >
                              <Nav.Item onClick={() => props.signOut()} key={1}>
                                 Sign out
                              </Nav.Item>
                          </Navbar.Collapse>,
                       ]
                     : ''}
               </Navbar.Collapse>
            </Navbar>

            {signedIn() ? (
               <span
                  style={{
                     float: 'right',
                     paddingTop: '6px',
                     paddingRight: '10%',
                  }}
               >
                  {`Logged in as: ${Prs.firstName}
                    ${Prs.lastName}`}
               </span>
            ) : (
               ''
            )}
         </div>

         {/*Alternate pages beneath navbar, based on current route*/}
         <Switch>
            <Route
               exact
               path="/"
               component={() =>
                  Prs ? <Redirect to="/allCnvs" /> : <Redirect to="/signin" />
               }
            />

            <Route
               path="/signin"
               render={() => <SignIn signIn={props.signIn} />}
            />

            <Route path="/register" render={() => <Register {...props} />} />

            <ProtectedRoute
               path="/CnvDetail/:cnvId"
               component={CnvDetail}
               {...props}
            />

            <ProtectedRoute
               path="/allCnvs"
               component={CnvOverview}
               {...props}
            />

            <ProtectedRoute
               path="/myCnvs"
               component={CnvOverview}
               userOnly={true}
               {...props}
            />

            <ProtectedRoute
               path="/myMessages"
               component={MsgOverView}
               userOnly={true}
               {...props}
            />
         </Switch>

         {/*Error popup dialog*/}
         <ErrorModal onClear={() => props.clearErrors()} />
      </div>
   );
};

export default Main;
