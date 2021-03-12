import React, { Component } from 'react';
import {
    Modal, Button, Form, FormControl, FormGroup
} from 'react-bootstrap';

export default class CnvModal extends Component {
   constructor(props) {
      super(props);
      this.state = {
         cnvTitle: (this.props.cnv && this.props.cnv.title) || "",
      }
   }

   close = (result) => {
      this.props.onDismiss && this.props.onDismiss({
         status: result,
         title: this.state.cnvTitle
      });
   }

   getValidationState = () => {
      if (this.state.cnvTitle && this.state.cnvTitle.length < 80)
         return "Ok";
      else if(!this.state.cnvTitle)
         return "Title is required";
      else
         return "Too long"
   
   }

   handleChange = (e) => {
      this.setState({cnvTitle: e.target.value});
   }

   componentWillReceiveProps = (nextProps) => {
      if (nextProps.showModal) {
         this.setState(
          { cnvTitle: (nextProps.cnv && nextProps.cnv.title) || "" })
      }
   }

   buttonDisable = () => {
      return this.getValidationState() !== "Ok" ? 
       true : false;
   }

   render() {
      return (
         <Modal show={this.props.showModal} onHide={() => this.close("Cancel")}>
            <Modal.Header closeButton>
               <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               <Form>
                  <FormGroup controlId="formBasicText"
                  //  isvalid={this.getValidationState()}
                  >
                     <Form.Label>Conversation Title</Form.Label>
                     <FormControl
                        type="text"
                        value={this.state.cnvTitle}
                        placeholder="Enter text"
                        onChange={this.handleChange}
                        isValid={(this.getValidationState() === 
                         "Ok")}
                        isInvalid={(this.getValidationState() === 
                         "Too long" || ( this.getValidationState() === 
                         "Title is required"))}
                     />
                     <FormControl.Feedback type="valid"> 
                           Great!
                     </FormControl.Feedback>
                     <FormControl.Feedback type="invalid"> 
                           {this.getValidationState()}
                     </FormControl.Feedback>
                     {/* <Form.Text className="text-muted">
                        Title is required
                     </Form.Text> */}
                  </FormGroup>
               </Form>
            </Modal.Body>
            <Modal.Footer>
               <Button onClick={() => this.close("Ok")} 
                disabled={this.buttonDisable()}>Ok</Button>
               <Button onClick={() => this.close("Cancel")}>Cancel</Button>
            </Modal.Footer>
         </Modal>)
   }
}