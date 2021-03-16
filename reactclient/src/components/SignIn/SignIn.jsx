import React, {Component, useState} from 'react';
import {Form, FormGroup, Row, Col, FormControl, Button} from 'react-bootstrap';
import './SignIn.css';
import {withRouter} from 'react-router-dom';

const SignIn = props => {
   const [creds, setCreds] = useState({
      email: 'adm@11.com',
      password: 'password',
   });

   let signIn = event => {
      console.log("Component signin with " + creds.email);
      props.signIn(creds, () => 
       props.history.push("/allCnvs"));

      event.preventDefault()
   };

   let handleChange = event => {
      creds[event.target.name] = event.target.value;
      let newState = {...creds}
      setCreds(newState);
   };

   return (
      <section className="container">
         <Col sm={{offset: 2}}>
            <h1>Sign in</h1>
         </Col>
         <Form>
            <FormGroup as={Row} controlId="formHorizontalEmail">
               <Col as={Form.Label} sm={2}>
                  Email
               </Col>
               <Col sm={8}>
                  <FormControl
                   type="email"
                   name="email"
                   placeholder="Email"
                   value={creds.email}
                   onChange={handleChange}
                   />
               </Col>
            </FormGroup>
            <FormGroup as={Row} controlId="formHorizontalPassword">
               <Col as={Form.Label} sm={2}>
                  Password
               </Col>
               <Col sm={8}>
                  <FormControl
                   type="password"
                   name="password"
                   placeholder="Password"
                   value={creds.password}
                   onChange={handleChange}
                  />
               </Col> 
            </FormGroup>
            <FormGroup>
               <Col>
                  <Button type="submit" onClick={signIn}>
                     Sign in
                  </Button>
              </Col>
            </FormGroup>
         </Form>
      </section>
   )
};

export default withRouter(SignIn);