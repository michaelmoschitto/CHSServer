import React, {Component, useState} from 'react';
import {Modal, Button, Form, FormControl, FormGroup} from 'react-bootstrap';
import {useSelector} from 'react-redux';

const ErrorModal = props => {
   const errors = useSelector(store => store.Errors)

   // errorDivs = errors.map((e) => (<div>{e}</div>))
   
   return (   
         <Modal
            show={props.show? true: false}
            backdrop="static"
            keyboard={false}
         >
            <Modal.Header closeButton>
               <Modal.Title>Error Notice</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               {/* {errors[0]? props.translator(errors[0].tag, 
                (navigator.language)) : ''} */}
               {/* {errors[0]? errorDivs : ''} */}
               {errors.length && 
                errors.map((e, index) => (<div key={index}>{e}</div>))}
            </Modal.Body>
            <Modal.Footer>
               <Button variant="primary" onClick={props.onClear}>
                  Ok
               </Button>
            </Modal.Footer>
         </Modal>
      
   );
};

export default ErrorModal;
