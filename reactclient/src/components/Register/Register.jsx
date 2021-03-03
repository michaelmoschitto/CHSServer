import React, { Component } from 'react';
import {ConfDialog} from '../components';
import {Form, FormGroup, FormControl, Button, Alert} from 'react-bootstrap';

import './Register.css';

// Functional component label plus control w/optional help message
function FieldGroup({id, label, help, ...props }) {
   return (
       <FormGroup controlId={id}>
          <Form.Label>{label}</Form.Label>
          <Form.Control {...props} />
          {help && <Form.Text className="text-muted">{help}</Form.Text>}
       </FormGroup>
   );
}

class Register extends Component {
   constructor(props) {
      super(props);
      this.state = {
         firstName: '',
         lastName: '',
         email: '',
         password: '',
         passwordTwo: '',
         termsAccepted: false,
         role: 0
      }
      this.handleChange = this.handleChange.bind(this);
   }

   submit() {
      let { // Make a copy of the relevant values in current state
         firstName,
         lastName,
         email,
         password,
         termsAccepted,
         role
      } = this.state;

      const user = {
         firstName,
         lastName,
         email,
         password,
         termsAccepted,
         role
      };

      this.props.register(user, () => {this.setState({offerSignIn: true})});
   }

   handleChange(ev) {
      let newState = {};

      switch (ev.target.type) {
      case 'checkbox':
         newState[ev.target.id] = ev.target.checked;
         break;
      default:
         newState[ev.target.id] = ev.target.value;
      }
      this.setState(newState);
   }

   formValid() {
      let s = this.state;

      return s.email && s.lastName && s.password && s.password === s.passwordTwo
       && s.termsAccepted;
   }

   render() {
     return (
        <div className="container">
           <form>
              <FieldGroup id="email" type="email" label="Email Address"
               placeholder="Enter email" value={this.state.email}
               onChange={this.handleChange} required={true}
               />

              <FieldGroup id="firstName" type="text" label="First Name"
               placeholder="Enter first name" value={this.state.firstName}
               onChange={this.handleChange}
               />

              <FieldGroup id="lastName" type="text" label="Last Name"
               placeholder="Enter last name" value={this.state.lastName}
               onChange={this.handleChange} required={true}
               />

              <FieldGroup id="password" type="password" label="Password"
               value={this.state.password}
               onChange={this.handleChange} required={true}
               />

              <FieldGroup id="passwordTwo" type="password" label="Repeat Password"
               value={this.state.passwordTwo}
               onChange={this.handleChange} required={true}
               help="Repeat your password"
              />

              <Form.Check  id="termsAccepted"
               value={this.state.termsAccepted} onChange={this.handleChange}
               label="Do you accept the terms and conditions?"/>
           </form>

           {this.state.password !== this.state.passwordTwo ?
            <Alert variant="warning">
               Passwords don't match
            </Alert> : ''}

           <Button variant="primary" onClick={() => this.submit()}
            disabled={!this.formValid()}>
              Submit
           </Button>

           <ConfDialog
              show={this.state.offerSignIn}
              title="Registration Success"
              body={`Would you like to log in as ${this.state.email}?`}
              buttons={['YES', 'NO']}
              onClose={answer => {
                 this.setState({offerSignIn: false});
                 if (answer === 'YES') {
                    this.props.signIn(
                     {email: this.state.email, password: this.state.password},
                     () => this.props.history.push("/"));
                 }
              }}
           />
        </div>
      )
   }
}

export default Register;
