import React, { Component } from 'react';
import {Register, SignIn, CnvOverview, CnvDetail, ConfDialog, ErrorModal, 
 MsgOverView} from '../components'
import {Route, Redirect, Switch } from 'react-router-dom';
import {Navbar, Nav, ListGroup, ListGroupItem} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';
import {useState} from 'react'
import './Main.css';

var ProtectedRoute = ({component: Cmp, path, ...rest }) => {
   return (<Route path={path} render={(props) => {

      return Object.keys(rest.Prs).length !== 0 ?
      <Cmp {...rest}/> : <Redirect to='/signin'/>;}}/>);
   };


   
class Main extends Component {


   signedIn() {
      return this.props.Prs && Object.keys(this.props.Prs).length !== 0; // Nonempty Prs obj
   }



   render() {
      return (
         <div>
            <div>
               <Navbar expand='md'>
                  <Navbar.Toggle />
                  <Navbar.Collapse>
                     <Nav variant="pills">
                        {this.signedIn() ?
                           [
                              <LinkContainer to='/allCnvs' key={0}>
                                 <Nav.Link> All Conversations</Nav.Link>
                              </LinkContainer>,
                              <LinkContainer to='/myCnvs' key={1}>
                                 <Nav.Link>My Conversations</Nav.Link>
                              </LinkContainer>,

                              <LinkContainer to='/myMessages' key={2}>
                              <Nav.Link>My Messages</Nav.Link>
                           </LinkContainer>
                           ]
                           :
                           [
                              <LinkContainer to='/signin' key={0}>
                                 <Nav.Link>Sign In</Nav.Link>
                              </LinkContainer>,
                              <LinkContainer to='/register' key={1}>
                                 <Nav.Link>Register</Nav.Link>
                              </LinkContainer>
                           ]
                        }
                     </Nav>
                     {this.signedIn() ?
                        [
                           <Nav.Item style={{'position' : 'fixed', 'right' : '2%'}} onClick={() => this.props.signOut()} key={0}>
                              Sign out
                           </Nav.Item>
                        ]
                        :
                        ''
                     }
                                    
                  </Navbar.Collapse>
               </Navbar>
               {this.signedIn() ?
                  <span style={{'float' : 'right', 'marginRight' : '10%'}}>
                     {`Logged in as: ${this.props.Prs.firstName}
                     ${this.props.Prs.lastName}`}
                  </span> : ''
               }
               
            </div>

            {/*Alternate pages beneath navbar, based on current route*/}
            <Switch>
              
               <Route exact path='/'
                  component={() => this.props.Prs ? 
                   <Redirect to="/allCnvs" />
                   : <Redirect to="/signin" />} />
               
               <Route path='/signin' 
                render={() => 
                 <SignIn signIn={this.props.signIn} />} />
               
               <Route path='/register'
                render={() => <Register {...this.props}/>} />

               <ProtectedRoute path='/CnvDetail/:cnvId' component={CnvDetail}
                {...this.props}/>

               <ProtectedRoute path='/allCnvs' component={CnvOverview}
                {...this.props}/>

               <ProtectedRoute path='/myCnvs' component={CnvOverview} 
               userOnly={true}
                {...this.props}/>

               <ProtectedRoute path='/myMessages' component={MsgOverView} 
                userOnly={true}
                {...this.props}/>
                
               {/* More routes */}
            </Switch>
            
            {/*Error popup dialog*/}
            <ErrorModal show={this.props.Errors.length} 
             translator={this.props.translateError}
             errors={this.props.Errors}
             onClear={() => this.props.clearErrors()} />

         </div>
      )
   }
}

export default Main
