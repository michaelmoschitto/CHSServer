import React, {useState} from 'react';
import {Modal, Button, Form, FormControl, FormGroup} from 'react-bootstrap';

const CnvModal = props => {
   const [cnvTitle, setCnvTitle] = useState(
      (props.cnv && props.cnv.title) || ''
   );

   let close = (result) => {
      props.onDismiss && props.onDismiss({
         status: result,
         title: cnvTitle
      });
   }

   let getValidationState = () => {
      if (cnvTitle && cnvTitle.length < 80)
         return "Ok";
      else if (!cnvTitle)
         return "Title is required";
      else
         return "Too long"
   }

   let handleChange = (e) => {
      setCnvTitle(e.target.value)
   }

   let componentWillReceiveProps = (nextProps) => {
      if (nextProps.showModal) {
         setCnvTitle((nextProps.cnv && nextProps.cnv.title) || "" )
      }
   }

   let buttonDisable = () => {
      return getValidationState() !== "Ok" ? 
       true : false;
   }

   return (
      <Modal keyboard={false} show={props.showModal} 
       onHide={() => close("Cancel")}>
         <Modal.Header closeButton>
            <Modal.Title>{props.title}</Modal.Title>
         </Modal.Header>
         <Modal.Body>
            <Form>
               <FormGroup controlId="formBasicText"
               //  isvalid={getValidationState()}
               >
                  <Form.Label>Conversation Title</Form.Label>
                  <FormControl
                     type="text"
                     value={cnvTitle}
                     placeholder="Enter text"
                     onChange={handleChange}
                     isValid={(getValidationState() === 
                      "Ok")}
                     isInvalid={(getValidationState() === 
                      "Too long" || ( getValidationState() === 
                      "Title is required"))}
                  />
                  <FormControl.Feedback type="valid"> 
                        Great!
                  </FormControl.Feedback>
                  <FormControl.Feedback type="invalid"> 
                        {getValidationState()}
                  </FormControl.Feedback>
               </FormGroup>
            </Form>
         </Modal.Body>
         <Modal.Footer>
            <Button onClick={() => close("Ok")} 
             disabled={buttonDisable()}>Ok</Button>
            <Button onClick={() => close("Cancel")}>Cancel</Button>
         </Modal.Footer>
      </Modal>)

};

export default CnvModal;
