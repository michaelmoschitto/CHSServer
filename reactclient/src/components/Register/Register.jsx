import React, {Component, useState} from 'react';
import {ConfDialog} from '../components';
import {Form, FormGroup, FormControl, Button, Alert} from 'react-bootstrap';
import {withRouter} from 'react-router-dom';
import './Register.css';

function FieldGroup({id, label, help, ...props}) {
   return (
      <FormGroup controlId={id}>
         <Form.Label>{label}</Form.Label>
         <Form.Control {...props} />
         {help && <Form.Text className="text-muted">{help}</Form.Text>}
      </FormGroup>
   );
}

const Register = props => {
   console.log("Rendering Register")

   const [regFields, setRegFields] = useState({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      passwordTwo: '',
      termsAccepted: false,
      role: 0,
   });

   const [offerSignIn, setOfferSignIn] = useState(false)

   let submit = () => {
      let { // Make a copy of the relevant values in current state
         firstName,
         lastName,
         email,
         password,
         termsAccepted,
         role
      } = regFields;

      const user = {
         firstName,
         lastName,
         email,
         password,
         termsAccepted,
         role
      };

      props.register(user, () => setOfferSignIn(true));
   };

   let handleChange = event => {
      let newState = {...regFields};

      switch (event.target.type) {
         case 'checkbox':
            newState[event.target.id] = event.target.checked;

            break;
         default:
            newState[event.target.id] = event.target.value;
      }

      setRegFields(newState);
   };

   let formValid = () => {
      let r = regFields;

      return r.email && r.lastName && r.password && r.password === r.passwordTwo
       && r.termsAccepted;
   };

   return (
      <div className="container">
         <form>
            <FieldGroup id="email" type="email" label="Email Address"
             placeholder="Enter email" value={regFields.email}
             onChange={handleChange} required={true}
             />

            <FieldGroup id="firstName" type="text" label="First Name"
             placeholder="Enter first name" value={regFields.firstName}
             onChange={handleChange}
             />

            <FieldGroup id="lastName" type="text" label="Last Name"
             placeholder="Enter last name" value={regFields.lastName}
             onChange={handleChange} required={true}
             />

            <FieldGroup id="password" type="password" label="Password"
             value={regFields.password}
             onChange={handleChange} required={true}
             />

            <FieldGroup id="passwordTwo" type="password" label="Repeat Password"
             value={regFields.passwordTwo}
             onChange={handleChange} required={true}
             help="Repeat your password"
            />

            <Form.Check  id="termsAccepted"
             value={regFields.termsAccepted} onChange={handleChange}
             label="Do you accept the terms and conditions?"/>
         </form>

         {regFields.password !== regFields.passwordTwo ?
          <Alert variant="warning">
             Passwords don't match
          </Alert> : ''}

         <Button variant="primary" onClick={() => submit()}
          disabled={!formValid()}>
            Submit
         </Button>

         <ConfDialog
            show={offerSignIn}
            title="Registration Success"
            body={`Would you like to log in as ${regFields.email}?`}
            buttons={['YES', 'NO']}
            onClose={answer => () => {
               setOfferSignIn(false);
               if (answer === 'YES')
                  props.signIn(
                   {email: regFields.email, password: regFields.password},
                   () => props.history.push("/"));
                }}   
          />
      </div>
    )

};

export default withRouter(Register);
