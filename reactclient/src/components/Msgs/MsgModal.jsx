import React, { Component } from 'react';
import {
    Modal, Button, Form, FormControl, FormGroup
} from 'react-bootstrap';
import { useState } from 'react';

const MsgModal = props => {
   const [content, setContent] = useState("");



    let handleChange = (e) => {
        setContent(e.target.value);
    }

    let buttonDisabled = () => (content && content.length) ? false : true


    return (
        <Modal show={props.showModal} onHide={
            () => props.onDismiss('Cancel')}>
            <Modal.Header closeButton>
               <Modal.Title>New Message</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               <Form>
                  <FormGroup controlId="formBasicText"
                  //  isvalid={this.getValidationState()}
                  >
                     <Form.Label>Message Content</Form.Label>
                     <FormControl
                        as="textarea"
                        rows="4"
                        value={content}
                        placeholder="Enter message"
                        onChange={handleChange}
                        // isValid={(this.getValidationState() === 
                        //  "Ok")}
                        // isInvalid={(this.getValidationState() === 
                        //  "Too long" || ( this.getValidationState() === 
                        //  "Title is required"))}
                     />
                     {/* <FormControl.Feedback type="valid"> 
                           Great!
                     </FormControl.Feedback>
                     <FormControl.Feedback type="invalid"> 
                           {this.getValidationState()}
                     </FormControl.Feedback> */}
                     {/* <Form.Text className="text-muted">
                        Title is required
                     </Form.Text> */}
                  </FormGroup>
               </Form>
            </Modal.Body>
            <Modal.Footer>
               <Button onClick={() => props.onDismiss('Ok', content)} 
                disabled={buttonDisabled()}
                >Ok</Button>
               <Button onClick={() => props.onDismiss('Cancel')}>Cancel</Button>
            </Modal.Footer>
         </Modal>
    );
};

export default MsgModal;