import React, {Component, useState} from 'react';
import {Modal, Button, Form, FormControl, FormGroup} from 'react-bootstrap';
// import {errorTranslate} from './api'

const ErrorModal = props => {
    const [show, setShow] = useState(true);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);


   let removeErrors = () => {
      // dispatch somethign to remove errors from store
   };

   return (
    //   <Modal show={this.props.showModal} onHide={() => this.close('Cancel')}>
    //      <Modal.Header closeButton>
    //         <Modal.Title>Error Notice</Modal.Title>
    //      </Modal.Header>
    //      <Modal.Body>

    //      </Modal.Body>
    //      <Modal.Footer>
    //         <Button
    //            onClick={() => this.close('Ok')}
    //            disabled={this.buttonDisable()}
    //         >
    //            Ok
    //         </Button>
    //         <Button onClick={() => this.close('Cancel')}>Cancel</Button>
    //      </Modal.Footer>
    //   </Modal>

    <>
      <Modal
        show={props.show}
        // onHide={() => {
        //   return props.onClear}}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Error Notice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {props.errors[0]? props.errors[0].tag : ''}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={props.onClear}>
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </>
   );
};

export default ErrorModal;
